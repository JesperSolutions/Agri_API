const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { Calculation } = require('../models/calculation');
const { performEnhancedCalculations } = require('../utils/calculations');

const router = express.Router();

/**
 * @swagger
 * /social/enhanced-calculate:
 *   post:
 *     summary: Enhanced CO2 calculation with social metrics
 *     description: Performs detailed CO2 calculations with social and environmental metrics
 *     tags: [Social Impact]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnhancedCalculationParameters'
 *     responses:
 *       200:
 *         description: Enhanced calculation completed successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/enhanced-calculate', authenticate, async (req, res) => {
  try {
    const results = performEnhancedCalculations(req.body);
    
    // Save calculation to database
    const calculation = await Calculation.save({
      userId: req.user.id,
      type: 'enhanced',
      parameters: req.body,
      results
    });
    
    const response = global.createResponse(true, 'Enhanced calculation completed successfully', {
      id: calculation.id,
      results
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'Enhanced calculation failed', null, error.message);
    res.status(400).json(response);
  }
});

/**
 * @swagger
 * /social/sdg-report:
 *   post:
 *     summary: Generate SDG alignment report
 *     description: Generates a report on how the roof improvements align with UN Sustainable Development Goals
 *     tags: [Social Impact]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roof_division
 *               - sdg_focus
 *             properties:
 *               roof_division:
 *                 type: object
 *                 description: Percentage allocation of roof improvements
 *                 example: {
 *                   "Green Areas": 25,
 *                   "Solar Power": 25,
 *                   "Water Management": 25,
 *                   "Social Impact": 25
 *                 }
 *               sdg_focus:
 *                 type: array
 *                 description: UN Sustainable Development Goals addressed
 *                 example: ["Zero Hunger", "Good Health and Well-being", "Clean Water and Sanitation", "Affordable and Clean Energy"]
 *               company_name:
 *                 type: string
 *                 description: Company name for the report
 *                 example: "Green Building Co."
 *               project_name:
 *                 type: string
 *                 description: Project name for the report
 *                 example: "Headquarters Roof Renovation"
 *     responses:
 *       200:
 *         description: SDG report generated successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/sdg-report', authenticate, async (req, res) => {
  try {
    const { 
      roof_division, 
      sdg_focus, 
      company_name = "Your Company", 
      project_name = "Roof Improvement Project" 
    } = req.body;
    
    if (!roof_division || !sdg_focus || !Array.isArray(sdg_focus)) {
      return res.status(400).json(global.createResponse(false, 'SDG report generation failed', null, 'Roof division and SDG focus array are required'));
    }
    
    // Map of SDGs to their descriptions and how roof improvements contribute
    const sdgDescriptions = {
      "Zero Hunger": {
        description: "End hunger, achieve food security and improved nutrition and promote sustainable agriculture.",
        contribution: "Urban farming on rooftops supports vulnerable members of society by providing access to food in urban spaces, addressing social issues. Surplus food can be utilized to ensure no one in the local community goes hungry."
      },
      "Good Health and Well-being": {
        description: "Ensure healthy lives and promote well-being for all at all ages.",
        contribution: "Green areas on rooftops contribute to the prevention of health issues and reduction of stress. The greenery absorbs particulate pollution, reducing overall air pollution locally and lowering exposure to pollutants that can lead to cardiovascular diseases, cancer, and allergies."
      },
      "Clean Water and Sanitation": {
        description: "Ensure availability and sustainable management of water and sanitation for all.",
        contribution: "Green areas on rooftops retain and purify water, while rainwater collection systems allow for water reuse in applications like toilet flushing. This reduces the CO2e footprint and increases water usage efficiency, as the water doesn't need to pass through a treatment facility first."
      },
      "Affordable and Clean Energy": {
        description: "Ensure access to affordable, reliable, sustainable and modern energy for all.",
        contribution: "Solar panels on the rooftop reduce consumption of external energy and heating supply, along with decreasing air pollution. This leads to improved energy efficiency and reduces the CO2e footprint by approximately 19% in a worst-case scenario."
      },
      "Decent Work and Economic Growth": {
        description: "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all.",
        contribution: "Creating a social area on the rooftop with access to green spaces positively impacts employees through disease prevention, reduced stress, increased creativity, and improved productivity. This enhances economic potential per employee and attracts a more diverse workforce."
      },
      "Climate Action": {
        description: "Take urgent action to combat climate change and its impacts.",
        contribution: "The integrated design of green spaces, solar panels, water collection, and social areas creates a space that actively reduces the environmental impact of both the building's users and the building itself. The presence of greenery helps lower the prevalence of several serious diseases."
      },
      "Life on Land": {
        description: "Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss.",
        contribution: "Transforming the rooftop into green spaces reintegrates it into the ecosystem, supporting biodiversity and reconnecting the city with nature. Combined with solar panels, this reduces air pollution and the extraction of fossil fuels, preserving nature and supporting existing habitats."
      },
      "Partnerships for the Goals": {
        description: "Strengthen the means of implementation and revitalize the global partnership for sustainable development.",
        contribution: "Creating a sustainable rooftop environment fosters collaboration among companies residing in the building as they work together on this shared environment. This encourages knowledge exchange, supports the advancement of the Sustainable Development Goals, and enhances economic growth potential."
      }
    };
    
    // Calculate SDG alignment score
    const sdgAlignmentScore = Math.min(100, (sdg_focus.length / 17) * 100);
    
    // Generate SDG report
    const sdgReport = {
      report_id: uuidv4(),
      company_name,
      project_name,
      generated_at: new Date().toISOString(),
      roof_division,
      sdg_alignment: {
        sdgs_addressed: sdg_focus.map(sdg => ({
          name: sdg,
          description: sdgDescriptions[sdg]?.description || "No description available",
          contribution: sdgDescriptions[sdg]?.contribution || "No contribution details available"
        })),
        sdg_alignment_score: sdgAlignmentScore,
        alignment_rating: getSdgAlignmentRating(sdgAlignmentScore)
      },
      recommendations: generateSdgRecommendations(sdg_focus, Object.keys(sdgDescriptions))
    };
    
    // Save report to database
    const calculation = await Calculation.save({
      userId: req.user.id,
      type: 'sdg-report',
      parameters: req.body,
      results: sdgReport
    });
    
    const response = global.createResponse(true, 'SDG report generated successfully', {
      id: calculation.id,
      report: sdgReport
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'SDG report generation failed', null, error.message);
    res.status(400).json(response);
  }
});

/**
 * @swagger
 * /social/health-impact:
 *   post:
 *     summary: Calculate health impact
 *     description: Calculates the health impact of roof improvements
 *     tags: [Social Impact]
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
 *                 example: 2776
 *               roof_division:
 *                 type: object
 *                 description: Percentage allocation of roof improvements
 *                 example: {
 *                   "Green Areas": 25,
 *                   "Solar Power": 25,
 *                   "Water Management": 25,
 *                   "Social Impact": 25
 *                 }
 *               employees:
 *                 type: number
 *                 description: Number of employees in the building
 *                 example: 50
 *               building_occupants:
 *                 type: number
 *                 description: Total number of building occupants
 *                 example: 100
 *               green_view_percentage:
 *                 type: number
 *                 description: Percentage of occupants with view of green areas
 *                 example: 60
 *     responses:
 *       200:
 *         description: Health impact calculated successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/health-impact', authenticate, async (req, res) => {
  try {
    const { 
      roof_area, 
      roof_division, 
      employees = 50, 
      building_occupants = 100,
      green_view_percentage = 60
    } = req.body;
    
    if (!roof_area || !roof_division) {
      return res.status(400).json(global.createResponse(false, 'Health impact calculation failed', null, 'Roof area and roof division are required'));
    }
    
    // Calculate green roof area
    const green_roof_area = roof_area * (roof_division["Green Areas"] || 0) / 100;
    
    // Calculate health impacts based on research data
    const stress_reduction_percentage = 39.4 * (green_roof_area / roof_area) * (green_view_percentage / 100);
    const hypertension_reduction = 6.77 * (green_roof_area / roof_area) * (green_view_percentage / 100);
    const mortality_reduction = 15 * (green_roof_area / roof_area);
    const productivity_increase = 22.6 * (green_roof_area / roof_area) * (green_view_percentage / 100);
    const sick_days_reduction = 12.3 * (green_roof_area / roof_area) * (green_view_percentage / 100);
    
    // Calculate economic impact
    const avg_salary = 50000; // Example average salary
    const avg_sick_day_cost = 200; // Example cost per sick day
    const productivity_value = avg_salary * (productivity_increase / 100);
    const sick_day_savings = avg_sick_day_cost * (sick_days_reduction / 100) * employees;
    const total_economic_benefit = (productivity_value * employees) + sick_day_savings;
    
    // Calculate health impact score
    const health_impact_score = (stress_reduction_percentage + hypertension_reduction + mortality_reduction + productivity_increase + sick_days_reduction) / 5;
    
    // Generate health impact report
    const healthImpactReport = {
      report_id: uuidv4(),
      generated_at: new Date().toISOString(),
      roof_configuration: {
        roof_area,
        roof_division,
        green_roof_area,
        green_view_percentage
      },
      building_occupancy: {
        employees,
        building_occupants,
        percentage_with_green_view: green_view_percentage
      },
      health_impacts: {
        stress_reduction_percentage,
        hypertension_reduction,
        mortality_reduction,
        productivity_increase,
        sick_days_reduction,
        health_impact_score,
        health_impact_rating: getHealthImpactRating(health_impact_score)
      },
      economic_benefits: {
        productivity_value_per_employee: productivity_value,
        sick_day_savings,
        total_economic_benefit,
        roi_percentage: (total_economic_benefit / (green_roof_area * 120)) * 100 // Assuming cost of 120 per sqm for green roof
      },
      summary: {
        health: `The green roof improvements will reduce stress by ${stress_reduction_percentage.toFixed(1)}%, hypertension risk by ${hypertension_reduction.toFixed(1)}%, and heat-related mortality by ${mortality_reduction.toFixed(1)}%.`,
        productivity: `Employee productivity is expected to increase by ${productivity_increase.toFixed(1)}%, with sick days reduced by ${sick_days_reduction.toFixed(1)}%.`,
        economic: `The total annual economic benefit is estimated at ${total_economic_benefit.toLocaleString()} through productivity gains and reduced sick days.`
      }
    };
    
    // Save report to database
    const calculation = await Calculation.save({
      userId: req.user.id,
      type: 'health-impact',
      parameters: req.body,
      results: healthImpactReport
    });
    
    const response = global.createResponse(true, 'Health impact calculated successfully', {
      id: calculation.id,
      report: healthImpactReport
    });
    
    res.status(200).json(response);
  } catch (error) {
    const response = global.createResponse(false, 'Health impact calculation failed', null, error.message);
    res.status(400).json(response);
  }
});

/**
 * Helper function to get SDG alignment rating based on score
 * @param {number} score - SDG alignment score
 * @returns {string} SDG alignment rating
 */
function getSdgAlignmentRating(score) {
  if (score >= 90) return "Exceptional";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Good";
  if (score >= 30) return "Moderate";
  return "Limited";
}

/**
 * Helper function to get health impact rating based on score
 * @param {number} score - Health impact score
 * @returns {string} Health impact rating
 */
function getHealthImpactRating(score) {
  if (score >= 30) return "Transformative";
  if (score >= 20) return "Significant";
  if (score >= 10) return "Moderate";
  if (score >= 5) return "Modest";
  return "Minimal";
}

/**
 * Helper function to generate SDG recommendations
 * @param {Array} addressed - SDGs already addressed
 * @param {Array} all - All available SDGs
 * @returns {object} Recommendations
 */
function generateSdgRecommendations(addressed, all) {
  // Find SDGs not yet addressed
  const notAddressed = all.filter(sdg => !addressed.includes(sdg));
  
  // Generate recommendations
  const recommendations = {
    current_alignment: `The project currently addresses ${addressed.length} out of 17 SDGs (${Math.round((addressed.length / 17) * 100)}% alignment).`,
    suggestions: []
  };
  
  // Add suggestions for top 3 not addressed SDGs (if any)
  if (notAddressed.length > 0) {
    recommendations.suggestions = notAddressed.slice(0, 3).map(sdg => ({
      sdg,
      suggestion: `Consider incorporating elements that address ${sdg} to improve SDG alignment.`
    }));
  } else {
    recommendations.suggestions.push({
      sdg: "All SDGs",
      suggestion: "Excellent work! Your project already addresses all the key SDGs relevant to roof improvements."
    });
  }
  
  return recommendations;
}

module.exports = router;