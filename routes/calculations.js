const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { Calculation } = require('../models/calculation');
const { performCalculations } = require('../utils/calculations');
const crypto = require('crypto');

const router = express.Router();

/**
 * @swagger
 * /simple-calculate:
 *   post:
 *     summary: Simple CO2 calculation
 *     description: Performs basic CO2 calculations with minimal input
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roof_area
 *               - roof_division
 *             properties:
 *               roof_area:
 *                 type: number
 *                 description: Roof area in square meters
 *                 example: 2000
 *               roof_division:
 *                 type: object
 *                 description: Percentage allocation of roof improvements
 *                 example: {
 *                   "Green Areas": 25,
 *                   "Solar Power": 25,
 *                   "Water Management": 25,
 *                   "Social Impact": 25
 *                 }
 *     responses:
 *       200:
 *         description: Calculation completed successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/simple-calculate', authenticate, async (req, res) => {
  try {
    const { roof_area, roof_division } = req.body;

    // Input validation
    if (!roof_area || !roof_division) {
      return res.status(400).json(global.createResponse(false, 'Calculation failed', null, 'Roof area and roof division are required'));
    }

    if (roof_area <= 0) {
      return res.status(400).json(global.createResponse(false, 'Calculation failed', null, 'Roof area must be positive'));
    }

    // Validate roof division percentages sum to 100%
    const totalPercentage = Object.values(roof_division).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json(global.createResponse(false, 'Calculation failed', null, 'Roof division percentages must sum to 100%'));
    }

    // Add default values for simplified calculation
    const calculationParams = {
      roof_area,
      roof_division,
      GWP_roof: 3.0, // Default value
      climate_zone: 'temperate', // Default value
      efficiency_degradation: 0.005 // Default value
    };

    const results = performCalculations(calculationParams);

    // Hash any personal or sensitive data before storing
    const hashedUserId = crypto.createHash('sha256')
      .update(req.user.id)
      .digest('hex');

    // Save calculation with minimal data
    const calculation = await Calculation.save({
      userId: hashedUserId,
      type: 'simple',
      parameters: {
        roof_area,
        roof_division
      },
      results: {
        neutrality: results.neutrality,
        savings: results.savings,
        economics: results.economics
      }
    });

    // Return only necessary information
    const response = global.createResponse(true, 'Calculation completed successfully', {
      id: calculation.id,
      results: {
        years_to_neutrality: results.neutrality.with_improvements,
        annual_savings: results.savings.annual,
        ten_year_savings: results.savings.ten_year,
        estimated_cost: results.economics.estimated_cost,
        simple_payback_years: results.economics.simple_payback_years,
        roi_10yr: results.economics.roi_10yr
      }
    });

    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'Calculation failed', null, error.message);
    res.status(400).json(response);
  }
});

/**
 * @swagger
 * /calculate:
 *   post:
 *     summary: Full CO2 calculation
 *     description: Performs detailed CO2 calculations based on provided parameters
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalculationParameters'
 *     responses:
 *       200:
 *         description: Calculation completed successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/calculate', authenticate, async (req, res) => {
  try {
    const results = performCalculations(req.body);
    
    // Save calculation to database
    const calculation = await Calculation.save({
      userId: req.user.id,
      type: 'standard',
      parameters: req.body,
      results
    });
    
    const response = global.createResponse(true, 'Calculation completed successfully', {
      id: calculation.id,
      results
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'Calculation failed', null, error.message);
    res.status(400).json(response);
  }
});

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Sales summary
 *     description: Provides simplified CO2 calculation results for sales purposes
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CalculationParameters'
 *               - type: object
 *                 properties:
 *                   building_address:
 *                     type: string
 *                     example: "123 Green Building St, Copenhagen"
 *                   company_id:
 *                     type: string
 *                     example: "DK12345678"
 *     responses:
 *       200:
 *         description: Sales summary generated successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/sales', authenticate, async (req, res) => {
  try {
    const fullResults = performCalculations(req.body);
    
    // Extract only the key information needed for sales
    const salesResults = {
      project: {
        roof_area: fullResults.configuration.roof_area,
        initial_co2_impact: Math.round(fullResults.configuration.initial_co2),
        roof_division: fullResults.configuration.roof_division,
        building_address: req.body.building_address || 'Not specified',
        company_id: req.body.company_id || 'Not specified'
      },
      key_metrics: {
        years_to_neutrality: fullResults.neutrality.with_improvements 
          ? parseFloat(fullResults.neutrality.with_improvements.toFixed(1)) 
          : null,
        years_saved: fullResults.neutrality.natural_decline && fullResults.neutrality.with_improvements
          ? parseFloat((fullResults.neutrality.natural_decline - fullResults.neutrality.with_improvements).toFixed(1))
          : null,
        annual_co2_savings: Math.round(fullResults.savings.annual),
        ten_year_co2_savings: Math.round(fullResults.savings.ten_year)
      },
      economics: {
        estimated_cost: Math.round(fullResults.economics.estimated_cost),
        payback_years: parseFloat(fullResults.economics.simple_payback_years.toFixed(1)),
        roi_10yr: parseFloat(fullResults.economics.roi_10yr.toFixed(1))
      },
      summary: {
        neutrality: fullResults.neutrality.with_improvements 
          ? `CO2 neutrality achieved in ${fullResults.neutrality.with_improvements.toFixed(1)} years`
          : "CO2 neutrality not achieved within the timeframe",
        improvement: fullResults.neutrality.natural_decline && fullResults.neutrality.with_improvements
          ? `Improvements accelerate neutrality by ${(fullResults.neutrality.natural_decline - fullResults.neutrality.with_improvements).toFixed(1)} years`
          : "Improvement impact cannot be fully quantified within the timeframe",
        economic: `Investment of ${Math.round(fullResults.economics.estimated_cost).toLocaleString()} with payback in ${fullResults.economics.simple_payback_years.toFixed(1)} years`
      }
    };
    
    // Save calculation to database
    const calculation = await Calculation.save({
      userId: req.user.id,
      type: 'sales',
      parameters: req.body,
      results: salesResults
    });
    
    const response = global.createResponse(true, 'Sales summary generated successfully', {
      id: calculation.id,
      results: salesResults
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'Sales summary generation failed', null, error.message);
    res.status(400).json(response);
  }
});

/**
 * @swagger
 * /batch:
 *   post:
 *     summary: Batch calculation
 *     description: Performs calculations for multiple buildings in a single request
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buildings
 *             properties:
 *               buildings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - building_id
 *                   properties:
 *                     building_id:
 *                       type: string
 *                       example: "building-123"
 *                     roof_area:
 *                       type: number
 *                       example: 2500
 *                     GWP_roof:
 *                       type: number
 *                       example: 3.5
 *                     roof_division:
 *                       type: object
 *                       example: {
 *                         "Green Areas": 25,
 *                         "Solar Power": 25,
 *                         "Water Management": 25,
 *                         "Social Impact": 25
 *                       }
 *               common_parameters:
 *                 type: object
 *                 properties:
 *                   climate_zone:
 *                     type: string
 *                     enum: ['temperate', 'tropical', 'arid', 'continental', 'polar']
 *                     example: 'temperate'
 *                   efficiency_degradation:
 *                     type: number
 *                     example: 0.005
 *     responses:
 *       200:
 *         description: Batch calculation completed successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/batch', authenticate, async (req, res) => {
  try {
    const { buildings, common_parameters = {} } = req.body;
    
    if (!buildings || !Array.isArray(buildings) || buildings.length === 0) {
      return res.status(400).json(global.createResponse(false, 'Batch calculation failed', null, 'Buildings array is required and must not be empty'));
    }
    
    const results = [];
    const calculationIds = [];
    
    for (const building of buildings) {
      if (!building.building_id) {
        return res.status(400).json(global.createResponse(false, 'Batch calculation failed', null, 'Each building must have a building_id'));
      }
      
      // Merge common parameters with building-specific parameters
      const calculationParams = {
        ...common_parameters,
        ...building
      };
      
      const calculationResult = performCalculations(calculationParams);
      
      // Save calculation to database
      const calculation = await Calculation.save({
        userId: req.user.id,
        type: 'batch',
        parameters: calculationParams,
        results: calculationResult
      });
      
      calculationIds.push(calculation.id);
      
      results.push({
        building_id: building.building_id,
        calculation_id: calculation.id,
        results: {
          neutrality: calculationResult.neutrality,
          savings: calculationResult.savings,
          economics: calculationResult.economics
        }
      });
    }
    
    const response = global.createResponse(true, 'Batch calculation completed successfully', {
      batch_size: buildings.length,
      calculation_ids: calculationIds,
      results
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'Batch calculation failed', null, error.message);
    res.status(400).json(response);
  }
});

/**
 * @swagger
 * /compare:
 *   post:
 *     summary: Compare scenarios
 *     description: Compares multiple calculation scenarios
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scenarios
 *             properties:
 *               scenarios:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - parameters
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Base Scenario"
 *                     parameters:
 *                       $ref: '#/components/schemas/CalculationParameters'
 *     responses:
 *       200:
 *         description: Comparison completed successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/compare', authenticate, async (req, res) => {
  try {
    const { scenarios } = req.body;
    
    if (!scenarios || !Array.isArray(scenarios) || scenarios.length < 2) {
      return res.status(400).json(global.createResponse(false, 'Comparison failed', null, 'At least two scenarios are required for comparison'));
    }
    
    const results = [];
    const calculationIds = [];
    
    for (const scenario of scenarios) {
      if (!scenario.name || !scenario.parameters) {
        return res.status(400).json(global.createResponse(false, 'Comparison failed', null, 'Each scenario must have a name and parameters'));
      }
      
      const calculationResult = performCalculations(scenario.parameters);
      
      // Save calculation to database
      const calculation = await Calculation.save({
        userId: req.user.id,
        type: 'comparison',
        parameters: {
          scenario_name: scenario.name,
          ...scenario.parameters
        },
        results: calculationResult
      });
      
      calculationIds.push(calculation.id);
      
      results.push({
        scenario_name: scenario.name,
        calculation_id: calculation.id,
        neutrality_years: calculationResult.neutrality.with_improvements,
        annual_savings: calculationResult.savings.annual,
        ten_year_savings: calculationResult.savings.ten_year,
        estimated_cost: calculationResult.economics.estimated_cost,
        payback_years: calculationResult.economics.simple_payback_years,
        roi_10yr: calculationResult.economics.roi_10yr
      });
    }
    
    // Find the best scenario for each metric
    const bestScenarios = {
      neutrality: findBestScenario(results, 'neutrality_years', 'min'),
      annual_savings: findBestScenario(results, 'annual_savings', 'max'),
      ten_year_savings: findBestScenario(results, 'ten_year_savings', 'max'),
      cost: findBestScenario(results, 'estimated_cost', 'min'),
      payback: findBestScenario(results, 'payback_years', 'min'),
      roi: findBestScenario(results, 'roi_10yr', 'max')
    };
    
    const response = global.createResponse(true, 'Comparison completed successfully', {
      comparison_id: uuidv4(),
      calculation_ids: calculationIds,
      scenarios: results,
      best_scenarios: bestScenarios,
      summary: generateComparisonSummary(results, bestScenarios)
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'Comparison failed', null, error.message);
    res.status(400).json(response);
  }
});

/**
 * @swagger
 * /history:
 *   get:
 *     summary: Get calculation history
 *     description: Returns the calculation history for the authenticated user
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calculation history retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const calculations = await Calculation.getAllForUser(req.user.id);
    
    // Format the calculations for the response
    const formattedCalculations = calculations.map(calc => ({
      id: calc.id,
      type: calc.type,
      created_at: calc.createdAt,
      parameters: {
        roof_area: calc.parameters.roof_area,
        GWP_roof: calc.parameters.GWP_roof,
        climate_zone: calc.parameters.climate_zone || 'temperate',
        roof_division: calc.parameters.roof_division
      },
      summary: calc.results.summary || {}
    }));
    
    const response = global.createResponse(true, 'Calculation history retrieved successfully', {
      count: formattedCalculations.length,
      calculations: formattedCalculations
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'Failed to retrieve calculation history', null, error.message);
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /history/{id}:
 *   get:
 *     summary: Get specific calculation
 *     description: Returns a specific calculation by ID
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Calculation ID
 *     responses:
 *       200:
 *         description: Calculation retrieved successfully
 *       404:
 *         description: Calculation not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/history/:id', authenticate, async (req, res) => {
  try {
    const calculationId = req.params.id;
    const calculation = await Calculation.findById(calculationId, req.user.id);
    
    if (!calculation) {
      return res.status(404).json(global.createResponse(false, 'Calculation not found', null, 'No calculation found with the provided ID'));
    }
    
    const response = global.createResponse(true, 'Calculation retrieved successfully', {
      id: calculation.id,
      type: calculation.type,
      created_at: calculation.createdAt,
      parameters: calculation.parameters,
      results: calculation.results
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'Failed to retrieve calculation', null, error.message);
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /export/{id}:
 *   get:
 *     summary: Export calculation results
 *     description: Exports calculation results in the specified format
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Calculation ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Calculation exported successfully
 *       404:
 *         description: Calculation not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/export/:id', authenticate, async (req, res) => {
  try {
    const calculationId = req.params.id;
    const format = req.query.format || 'json';
    
    const calculation = await Calculation.findById(calculationId, req.user.id);
    
    if (!calculation) {
      return res.status(404).json(global.createResponse(false, 'Export failed', null, 'No calculation found with the provided ID'));
    }
    
    if (format === 'json') {
      // For JSON, we can just return the calculation data
      res.setHeader('Content-Disposition', `attachment; filename="calculation-${calculationId}.json"`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(calculation);
    } else if (format === 'csv') {
      // For CSV, we need to flatten the data structure
      let csvContent = 'Parameter,Value\n';
      
      // Add basic information
      csvContent += `Calculation ID,${calculation.id}\n`;
      csvContent += `Timestamp,${calculation.createdAt}\n`;
      csvContent += `Type,${calculation.type || 'standard'}\n\n`;
      
      // Add configuration parameters
      csvContent += 'Configuration Parameters\n';
      csvContent += `Roof Area,${calculation.parameters.roof_area || 'N/A'}\n`;
      csvContent += `GWP Roof,${calculation.parameters.GWP_roof || 'N/A'}\n`;
      
      if (calculation.parameters.roof_division) {
        csvContent += 'Roof Division\n';
        for (const [key, value] of Object.entries(calculation.parameters.roof_division)) {
          csvContent += `${key},${value}%\n`;
        }
      }
      
      // Add results
      if (calculation.results.configuration) {
        csvContent += '\nResults\n';
        csvContent += `Initial CO2,${calculation.results.configuration.initial_co2 || 'N/A'}\n`;
        
        if (calculation.results.neutrality) {
          csvContent += `Years to Neutrality (with improvements),${calculation.results.neutrality.with_improvements || 'N/A'}\n`;
          csvContent += `Years to Neutrality (natural decline),${calculation.results.neutrality.natural_decline || 'N/A'}\n`;
        }
        
        if (calculation.results.savings) {
          csvContent += `Annual CO2 Savings,${calculation.results.savings.annual || 'N/A'}\n`;
          csvContent += `10-Year CO2 Savings,${calculation.results.savings.ten_year || 'N/A'}\n`;
        }
        
        if (calculation.results.economics) {
          csvContent += `Estimated Cost,${calculation.results.economics.estimated_cost || 'N/A'}\n`;
          csvContent += `Simple Payback Years,${calculation.results.economics.simple_payback_years || 'N/A'}\n`;
          csvContent += `10-Year ROI,${calculation.results.economics.roi_10yr || 'N/A'}%\n`;
        }
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="calculation-${calculationId}.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.status(200).send(csvContent);
    } else {
      return res.status(400).json(global.createResponse(false, 'Export failed', null, 'Unsupported format. Supported formats: json, csv'));
    }
  } catch (error) {
    const response = global.createResponse(false, 'Export failed', null, error.message);
    res.status(500).json(response);
  }
});

/**
 * Helper function to find the best scenario for a specific metric
 * @param {Array} scenarios - Array of scenarios
 * @param {string} metric - Metric to compare
 * @param {string} type - Type of comparison ('min' or 'max')
 * @returns {object} Best scenario
 */
function findBestScenario(scenarios, metric, type) {
  if (!scenarios || scenarios.length === 0) return null;
  
  let bestScenario = scenarios[0];
  
  for (let i = 1; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    
    if (type === 'min') {
      // For metrics where lower is better (e.g., neutrality years, cost)
      if (scenario[metric] !== null && (bestScenario[metric] === null || scenario[metric] < bestScenario[metric])) {
        bestScenario = scenario;
      }
    } else {
      // For metrics where higher is better (e.g., savings, ROI)
      if (scenario[metric] !== null && (bestScenario[metric] === null || scenario[metric] > bestScenario[metric])) {
        bestScenario = scenario;
      }
    }
  }
  
  return {
    scenario_name: bestScenario.scenario_name,
    value: bestScenario[metric]
  };
}

/**
 * Helper function to generate a comparison summary
 * @param {Array} scenarios - Array of scenarios
 * @param {object} bestScenarios - Best scenarios for each metric
 * @returns {object} Comparison summary
 */
function generateComparisonSummary(scenarios, bestScenarios) {
  return {
    recommendation: `Based on the comparison, "${bestScenarios.roi.scenario_name}" provides the best overall return on investment at ${bestScenarios.roi.value.toFixed(1)}%.`,
    fastest_neutrality: bestScenarios.neutrality.value !== null
      ? `"${bestScenarios.neutrality.scenario_name}" achieves CO2 neutrality fastest in ${bestScenarios.neutrality.value.toFixed(1)} years.`
      : "None of the scenarios achieve CO2 neutrality within the calculation timeframe.",
    highest_savings: `"${bestScenarios.ten_year_savings.scenario_name}" provides the highest 10-year CO2 savings at ${bestScenarios.ten_year_savings.value.toFixed(1)} units.`,
    best_payback: `"${bestScenarios.payback.scenario_name}" has the shortest payback period at ${bestScenarios.payback.value.toFixed(1)} years.`
  };
}

module.exports = router;