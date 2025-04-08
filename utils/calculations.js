/**
 * Utility functions for CO2 calculations
 */

/**
 * Performs CO2 calculations based on provided parameters with improved mathematical model
 * @param {object} params - Calculation parameters
 * @returns {object} Calculation results
 */
function performCalculations(params) {
  const {
    roof_area = 2776,
    GWP_roof = 3.33,
    decline_rate = 0.03,
    roof_division = {
      "Green Areas": 25,
      "Solar Power": 25,
      "Water Management": 25,
      "Social Impact": 25
    },
    full_savings = {
      "Green Areas": 1347.98,
      "Solar Power": 12142.5,
      "Water Management": 1441.25,
      "Social Impact": 4180.0
    },
    improvement_years = {
      "Green Areas": 0,
      "Solar Power": 1,
      "Water Management": 2,
      "Social Impact": 3
    },
    years_to_calculate = 50,
    points = 1000,
    // New parameters for improved model
    efficiency_degradation = 0.005, // Annual degradation of improvement efficiency
    climate_zone = 'temperate' // Climate zone
  } = params;

  // Climate factor based on climate zone
  const climateFactors = {
    'temperate': 1.0,
    'tropical': 1.2,
    'arid': 0.9,
    'continental': 1.1,
    'polar': 0.8
  };
  
  const climate_factor = climateFactors[climate_zone] || 1.0;

  // Input validation
  if (roof_area <= 0) throw new Error("Roof area must be positive");
  if (GWP_roof <= 0) throw new Error("GWP_roof must be positive");
  if (decline_rate < 0 || decline_rate >= 1) throw new Error("Decline rate must be between 0 and 1");
  if (years_to_calculate <= 0) throw new Error("Years to calculate must be positive");
  if (points <= 0) throw new Error("Points must be positive");
  
  // Validate roof division percentages sum to 100%
  const totalPercentage = Object.values(roof_division).reduce((sum, val) => sum + val, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error("Roof division percentages must sum to 100%");
  }

  // Initial CO2 impact
  const initial_co2 = GWP_roof * roof_area;

  // Adjust savings based on percentage division of the roof
  const annual_savings = {};
  for (const key in roof_division) {
    annual_savings[key] = full_savings[key] * (roof_division[key] / 100);
  }

  // Generate timeline with more points for a smooth curve
  const years_smooth = linspace(0, years_to_calculate, points);

  // IMPROVED MODEL: Natural CO2 decline without improvements
  // Using a more realistic exponential decay model
  const co2_natural_decline = years_smooth.map(year => 
    initial_co2 * Math.exp(-decline_rate * year * climate_factor)
  );

  // IMPROVED MODEL: CO2 decline with improvements
  const co2_with_improvements = new Array(years_smooth.length).fill(0);
  co2_with_improvements[0] = initial_co2;

  // Apply natural decline and improvements over time with efficiency degradation
  for (let i = 1; i < years_smooth.length; i++) {
    // Natural decline component
    co2_with_improvements[i] = co2_with_improvements[i - 1] * Math.exp(-decline_rate * climate_factor);
    
    const year = years_smooth[i];
    
    // Apply improvements with efficiency degradation over time
    for (const improvement in improvement_years) {
      const start_year = improvement_years[improvement];
      if (year >= start_year) {
        // Calculate years since improvement started
        const years_active = year - start_year;
        // Apply efficiency degradation
        const efficiency = Math.max(0, 1 - (efficiency_degradation * years_active));
        // Apply savings with degraded efficiency
        co2_with_improvements[i] -= (annual_savings[improvement] * efficiency) / points * climate_factor;
      }
    }
    
    // Ensure CO2 doesn't go below zero
    co2_with_improvements[i] = Math.max(0, co2_with_improvements[i]);
  }

  // Find neutrality years
  let neutral_index_improved = -1;
  for (let i = 0; i < co2_with_improvements.length; i++) {
    if (co2_with_improvements[i] <= 0) {
      neutral_index_improved = i;
      break;
    }
  }

  let neutral_index_natural = -1;
  for (let i = 0; i < co2_natural_decline.length; i++) {
    if (co2_natural_decline[i] <= 0) {
      neutral_index_natural = i;
      break;
    }
  }

  const years_to_neutrality_improved = neutral_index_improved > 0 ? years_smooth[neutral_index_improved] : null;
  const years_to_neutrality_natural = neutral_index_natural > 0 ? years_smooth[neutral_index_natural] : null;

  // Calculate total CO2 savings over 10 years
  const ten_year_index = Math.floor(points / years_to_calculate * 10);
  const co2_without_improvements_10yr = co2_natural_decline[ten_year_index];
  const co2_with_improvements_10yr = co2_with_improvements[ten_year_index];
  const co2_savings_10yr = co2_without_improvements_10yr - co2_with_improvements_10yr;

  // Calculate total annual savings
  const total_annual_savings = Object.values(annual_savings).reduce((sum, val) => sum + val, 0);

  // Calculate ROI metrics
  const estimated_cost = calculateEstimatedCost(roof_area, roof_division);
  const simple_payback_years = estimated_cost / total_annual_savings;
  const roi_10yr = (co2_savings_10yr / estimated_cost) * 100;

  // Calculate carbon intensity metrics
  const carbon_intensity_per_sqm = initial_co2 / roof_area;
  const carbon_reduction_per_euro = co2_savings_10yr / estimated_cost;

  return {
    configuration: {
      roof_area,
      GWP_roof,
      initial_co2,
      decline_rate,
      roof_division,
      full_savings,
      improvement_years,
      annual_savings,
      efficiency_degradation,
      climate_zone,
      climate_factor
    },
    timeline: {
      years: years_smooth,
      co2_with_improvements,
      co2_natural_decline
    },
    neutrality: {
      with_improvements: years_to_neutrality_improved,
      natural_decline: years_to_neutrality_natural
    },
    savings: {
      annual: total_annual_savings,
      ten_year: co2_savings_10yr
    },
    economics: {
      estimated_cost,
      simple_payback_years,
      roi_10yr
    },
    intensity: {
      carbon_per_sqm: carbon_intensity_per_sqm,
      reduction_per_euro: carbon_reduction_per_euro
    },
    summary: {
      neutrality_improved: years_to_neutrality_improved 
        ? `CO2 neutrality with improvements is achieved in ${years_to_neutrality_improved.toFixed(1)} years.`
        : "CO2 neutrality with improvements is not achieved within the timeframe.",
      neutrality_natural: years_to_neutrality_natural
        ? `CO2 neutrality without improvements (natural decline) is achieved in ${years_to_neutrality_natural.toFixed(1)} years.`
        : "CO2 neutrality without improvements (natural decline) is not achieved within the timeframe.",
      economic_summary: `Estimated payback period is ${simple_payback_years.toFixed(1)} years with a 10-year ROI of ${roi_10yr.toFixed(1)}%.`
    }
  };
}

/**
 * Performs enhanced CO2 calculations with social and environmental metrics
 * @param {object} params - Enhanced calculation parameters
 * @returns {object} Enhanced calculation results
 */
function performEnhancedCalculations(params) {
  const {
    roof_area = 2776,
    GWP_roof = 3.33,
    roof_division = {
      "Green Areas": 25,
      "Solar Power": 25,
      "Water Management": 25,
      "Social Impact": 25
    },
    plant_absorption = 1347.976,
    energy_emission = 64095.68,
    solar_emission = 1747.13,
    solar_reduction = 12142.5,
    heating_original = 16720,
    heating_reduced = 12540,
    water_emission = 6849.81,
    water_mitigated = 1441.254,
    water_collected = 427,
    social_metrics = {
      social_network: 11.08,
      trust: 11.08,
      reciprocity: 11.08,
      safety_wellbeing: 9.86,
      social_equity: 9.83,
      happiness: 22.6,
      stress_reduction: 39.4,
      quality_of_life: 35.3
    },
    health_metrics = {
      hypertension_reduction: 6.77,
      heat_wave_temperature: 28,
      mortality_reduction: 15
    },
    sdg_focus = [
      "Zero Hunger",
      "Good Health and Well-being",
      "Clean Water and Sanitation",
      "Affordable and Clean Energy",
      "Decent Work and Economic Growth",
      "Climate Action",
      "Life on Land",
      "Partnerships for the Goals"
    ],
    years_to_calculate = 50
  } = params;

  // Input validation
  if (roof_area <= 0) throw new Error("Roof area must be positive");
  if (GWP_roof <= 0) throw new Error("GWP_roof must be positive");
  
  // Validate roof division percentages sum to 100%
  const totalPercentage = Object.values(roof_division).reduce((sum, val) => sum + val, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error("Roof division percentages must sum to 100%");
  }

  // Initial CO2 impact
  const initial_co2 = GWP_roof * roof_area;

  // Calculate CO2 neutrality based on plant absorption
  const years_to_neutrality = initial_co2 / plant_absorption;

  // Calculate energy savings from solar panels
  const solar_energy_savings_percentage = (solar_reduction / energy_emission) * 100;
  
  // Calculate heating reduction percentage
  const heating_reduction_percentage = ((heating_original - heating_reduced) / heating_original) * 100;
  
  // Calculate water reduction percentage
  const water_reduction_percentage = (water_mitigated / water_emission) * 100;
  
  // Calculate total environmental impact
  const total_annual_co2_reduction = plant_absorption + solar_reduction + (heating_original - heating_reduced) + water_mitigated;
  
  // Calculate social impact score (weighted average of social metrics)
  const social_weights = {
    social_network: 0.1,
    trust: 0.1,
    reciprocity: 0.1,
    safety_wellbeing: 0.15,
    social_equity: 0.15,
    happiness: 0.15,
    stress_reduction: 0.15,
    quality_of_life: 0.1
  };
  
  let social_impact_score = 0;
  let total_weight = 0;
  
  for (const [metric, value] of Object.entries(social_metrics)) {
    const weight = social_weights[metric] || 0.1;
    social_impact_score += value * weight;
    total_weight += weight;
  }
  
  social_impact_score = social_impact_score / total_weight;
  
  // Calculate health impact score
  const health_impact_score = (health_metrics.hypertension_reduction + health_metrics.mortality_reduction) / 2;
  
  // Calculate SDG alignment score (based on number of SDGs addressed)
  const sdg_alignment_score = Math.min(100, (sdg_focus.length / 17) * 100);
  
  // Calculate combined sustainability score
  const sustainability_score = (
    (total_annual_co2_reduction / (initial_co2 * 0.1)) * 0.4 + // Environmental component (40%)
    social_impact_score * 0.3 + // Social component (30%)
    health_impact_score * 0.2 + // Health component (20%)
    sdg_alignment_score * 0.1   // SDG alignment component (10%)
  );
  
  // Calculate economic benefits
  const estimated_cost = calculateEnhancedEstimatedCost(roof_area, roof_division);
  const annual_economic_benefit = calculateAnnualEconomicBenefit(
    solar_reduction, 
    heating_original - heating_reduced, 
    water_collected,
    social_impact_score,
    health_impact_score
  );
  const simple_payback_years = estimated_cost / annual_economic_benefit;
  
  // Calculate long-term projections
  const years = Array.from({length: years_to_calculate + 1}, (_, i) => i);
  const cumulative_co2_reduction = years.map(year => total_annual_co2_reduction * year);
  const cumulative_economic_benefit = years.map(year => annual_economic_benefit * year);
  
  return {
    configuration: {
      roof_area,
      GWP_roof,
      initial_co2,
      roof_division
    },
    environmental_impact: {
      plant_absorption,
      years_to_neutrality,
      solar_energy_savings_percentage,
      heating_reduction_percentage,
      water_reduction_percentage,
      total_annual_co2_reduction
    },
    social_impact: {
      metrics: social_metrics,
      social_impact_score
    },
    health_impact: {
      metrics: health_metrics,
      health_impact_score,
      heat_wave_resilience: health_metrics.heat_wave_temperature > 25 ? "Improved" : "Standard"
    },
    sdg_alignment: {
      sdgs_addressed: sdg_focus,
      sdg_alignment_score
    },
    sustainability: {
      sustainability_score,
      rating: getSustainabilityRating(sustainability_score)
    },
    economics: {
      estimated_cost,
      annual_economic_benefit,
      simple_payback_years,
      roi_10yr: (annual_economic_benefit * 10 / estimated_cost) * 100
    },
    projections: {
      years,
      cumulative_co2_reduction,
      cumulative_economic_benefit
    },
    summary: {
      environmental: `The roof improvements will absorb ${plant_absorption.toFixed(2)} kg CO2e annually, achieving CO2 neutrality in ${years_to_neutrality.toFixed(1)} years. Energy consumption is reduced by ${solar_energy_savings_percentage.toFixed(1)}% through solar power, heating by ${heating_reduction_percentage.toFixed(1)}%, and water impact by ${water_reduction_percentage.toFixed(1)}%.`,
      social: `Social benefits include ${social_impact_score.toFixed(1)}% improvement in social metrics, with notable improvements in stress reduction (${social_metrics.stress_reduction}%) and quality of life (${social_metrics.quality_of_life}%).`,
      health: `Health benefits include ${health_metrics.hypertension_reduction}% reduction in hypertension risk and ${health_metrics.mortality_reduction}% reduction in heat-related mortality.`,
      economic: `With an estimated investment of ${estimated_cost.toLocaleString()} and annual benefits of ${annual_economic_benefit.toLocaleString()}, the payback period is ${simple_payback_years.toFixed(1)} years.`,
      sustainability: `Overall sustainability score is ${sustainability_score.toFixed(1)}/100, rated as "${getSustainabilityRating(sustainability_score)}".`
    }
  };
}

/**
 * Helper function to estimate costs based on roof area and division
 * @param {number} roof_area - Roof area in square meters
 * @param {object} roof_division - Percentage allocation of roof improvements
 * @returns {number} Estimated cost in currency units
 */
function calculateEstimatedCost(roof_area, roof_division) {
  // Example cost factors per square meter (these should be calibrated with real data)
  const cost_factors = {
    "Green Areas": 120,
    "Solar Power": 350,
    "Water Management": 80,
    "Social Impact": 150
  };
  
  let total_cost = 0;
  for (const improvement in roof_division) {
    const area_for_improvement = roof_area * (roof_division[improvement] / 100);
    const cost_for_improvement = area_for_improvement * (cost_factors[improvement] || 100);
    total_cost += cost_for_improvement;
  }
  
  return total_cost;
}

/**
 * Helper function to estimate enhanced costs based on roof area and division
 * @param {number} roof_area - Roof area in square meters
 * @param {object} roof_division - Percentage allocation of roof improvements
 * @returns {number} Estimated cost in currency units
 */
function calculateEnhancedEstimatedCost(roof_area, roof_division) {
  // Enhanced cost factors per square meter
  const cost_factors = {
    "Green Areas": 120,
    "Solar Power": 350,
    "Water Management": 80,
    "Social Impact": 150
  };
  
  let total_cost = 0;
  for (const improvement in roof_division) {
    const area_for_improvement = roof_area * (roof_division[improvement] / 100);
    const cost_for_improvement = area_for_improvement * (cost_factors[improvement] || 100);
    total_cost += cost_for_improvement;
  }
  
  return total_cost;
}

/**
 * Helper function to calculate annual economic benefit
 * @param {number} solar_reduction - CO2 reduction from solar panels
 * @param {number} heating_reduction - Heating reduction
 * @param {number} water_collected - Water collected in m3
 * @param {number} social_impact_score - Social impact score
 * @param {number} health_impact_score - Health impact score
 * @returns {number} Annual economic benefit
 */
function calculateAnnualEconomicBenefit(solar_reduction, heating_reduction, water_collected, social_impact_score, health_impact_score) {
  // Economic conversion factors (these should be calibrated with real data)
  const co2_price_per_kg = 0.05; // Price per kg CO2e
  const electricity_price_per_kwh = 0.25; // Price per kWh
  const water_price_per_m3 = 2.5; // Price per m3 of water
  const productivity_value = 50; // Value of 1% productivity increase per employee
  const health_cost_savings = 100; // Value of 1% health improvement
  
  // Assume solar reduction is proportional to electricity savings
  const electricity_savings = solar_reduction * 0.5; // Convert CO2 reduction to kWh equivalent
  
  // Calculate economic benefits
  const carbon_benefit = (solar_reduction + heating_reduction) * co2_price_per_kg;
  const electricity_benefit = electricity_savings * electricity_price_per_kwh;
  const water_benefit = water_collected * water_price_per_m3;
  
  // Assume 50 employees for productivity calculation
  const employees = 50;
  const productivity_benefit = social_impact_score * productivity_value * employees / 100;
  
  // Health benefit calculation
  const health_benefit = health_impact_score * health_cost_savings * employees / 100;
  
  return carbon_benefit + electricity_benefit + water_benefit + productivity_benefit + health_benefit;
}

/**
 * Helper function to get sustainability rating based on score
 * @param {number} score - Sustainability score
 * @returns {string} Sustainability rating
 */
function getSustainabilityRating(score) {
  if (score >= 90) return "Outstanding";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 50) return "Satisfactory";
  if (score >= 40) return "Acceptable";
  return "Needs Improvement";
}

/**
 * Helper function to create a linear space array (like numpy's linspace)
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} n - Number of points
 * @returns {Array} Array of evenly spaced points
 */
function linspace(start, end, n) {
  const result = new Array(n);
  const step = (end - start) / (n - 1);
  for (let i = 0; i < n; i++) {
    result[i] = start + (step * i);
  }
  return result;
}

module.exports = {
  performCalculations,
  performEnhancedCalculations,
  calculateEstimatedCost,
  calculateEnhancedEstimatedCost,
  calculateAnnualEconomicBenefit,
  getSustainabilityRating,
  linspace
};