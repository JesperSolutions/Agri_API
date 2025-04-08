# CO2 Calculation API Documentation

## Overview

The CO2 Calculation API provides endpoints for calculating CO2 reduction based on roof improvements with enhanced social and environmental metrics. This documentation provides detailed information about each endpoint, including request/response formats, authentication requirements, and example usage.

**API Version:** 1.1.0

## Table of Contents

- [Authentication](#authentication)
  - [Login](#login)
  - [Token Request](#token-request)
- [Basic Endpoints](#basic-endpoints)
  - [Health Check](#health-check)
  - [API Status](#api-status)
- [Calculation Endpoints](#calculation-endpoints)
  - [Standard Calculation](#standard-calculation)
  - [Sales Summary](#sales-summary)
  - [Batch Calculation](#batch-calculation)
  - [Compare Scenarios](#compare-scenarios)
- [Social Impact Endpoints](#social-impact-endpoints)
  - [Enhanced Calculation](#enhanced-calculation)
  - [SDG Report](#sdg-report)
  - [Health Impact](#health-impact)
- [History and Export](#history-and-export)
  - [Calculation History](#calculation-history)
  - [Specific Calculation](#specific-calculation)
  - [Export Calculation](#export-calculation)
- [Administration](#administration)
  - [List Users](#list-users)
  - [Create User](#create-user)
  - [List Tokens](#list-tokens)
  - [List Token Requests](#list-token-requests)
  - [Approve Token Request](#approve-token-request)
  - [Revoke Token](#revoke-token)

## Authentication

All API endpoints (except for `/health`, `/`, `/auth/login`, and `/auth/token/request`) require authentication using a JWT token.

### Login

Authenticates a user and returns a JWT token.

**Endpoint:** `POST /auth/login`

**Authentication Required:** No

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Login successful",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Token Request

Submit a request for an API access token.

**Endpoint:** `POST /auth/token/request`

**Authentication Required:** No

**Request Body:**
```json
{
  "company": "Green Roofs Inc.",
  "email": "contact@greenroofs.com",
  "purpose": "Integration with building management system",
  "company_id": "DK12345678",
  "address": "123 Green Street, Copenhagen"
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Token request submitted successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Your request has been submitted and is pending approval. You will be notified via email when approved."
  }
}
```

## Basic Endpoints

### Health Check

Returns the health status of the API.

**Endpoint:** `GET /health`

**Authentication Required:** No

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Service is healthy",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "status": "UP"
  }
}
```

### API Status

Returns the status of the API and available endpoints.

**Endpoint:** `GET /`

**Authentication Required:** No

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "API is operational",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "status": "running",
    "version": "1.1.0",
    "documentation": "/api-docs"
  }
}
```

## Calculation Endpoints

### Standard Calculation

Performs detailed CO2 calculations based on provided parameters.

**Endpoint:** `POST /calculate`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "roof_area": 2000,
  "GWP_roof": 3.0,
  "decline_rate": 0.03,
  "roof_division": {
    "Green Areas": 25,
    "Solar Power": 25,
    "Water Management": 25,
    "Social Impact": 25
  },
  "climate_zone": "temperate",
  "efficiency_degradation": 0.005
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Calculation completed successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "results": {
      "configuration": {
        "roof_area": 2000,
        "GWP_roof": 3.0,
        "initial_co2": 6000,
        "decline_rate": 0.03,
        "roof_division": {
          "Green Areas": 25,
          "Solar Power": 25,
          "Water Management": 25,
          "Social Impact": 25
        },
        "annual_savings": {
          "Green Areas": 336.995,
          "Solar Power": 3035.625,
          "Water Management": 360.3125,
          "Social Impact": 1045
        },
        "efficiency_degradation": 0.005,
        "climate_zone": "temperate",
        "climate_factor": 1
      },
      "neutrality": {
        "with_improvements": 7.2,
        "natural_decline": 33.5
      },
      "savings": {
        "annual": 4777.9325,
        "ten_year": 42500.5
      },
      "economics": {
        "estimated_cost": 175000,
        "simple_payback_years": 36.6,
        "roi_10yr": 24.3
      }
    }
  }
}
```

### Sales Summary

Provides simplified CO2 calculation results for sales purposes.

**Endpoint:** `POST /sales`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "roof_area": 2000,
  "GWP_roof": 3.0,
  "roof_division": {
    "Green Areas": 25,
    "Solar Power": 25,
    "Water Management": 25,
    "Social Impact": 25
  },
  "building_address": "123 Green Building St, Copenhagen",
  "company_id": "DK12345678"
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Sales summary generated successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "results": {
      "project": {
        "roof_area": 2000,
        "initial_co2_impact": 6000,
        "roof_division": {
          "Green Areas": 25,
          "Solar Power": 25,
          "Water Management": 25,
          "Social Impact": 25
        },
        "building_address": "123 Green Building St, Copenhagen",
        "company_id": "DK12345678"
      },
      "key_metrics": {
        "years_to_neutrality": 7.2,
        "years_saved": 26.3,
        "annual_co2_savings": 4778,
        "ten_year_co2_savings": 42501
      },
      "economics": {
        "estimated_cost": 175000,
        "payback_years": 36.6,
        "roi_10yr": 24.3
      },
      "summary": {
        "neutrality": "CO2 neutrality achieved in 7.2 years",
        "improvement": "Improvements accelerate neutrality by 26.3 years",
        "economic": "Investment of 175,000 with payback in 36.6 years"
      }
    }
  }
}
```

### Batch Calculation

Performs calculations for multiple buildings in a single request.

**Endpoint:** `POST /batch`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "buildings": [
    {
      "building_id": "building-123",
      "roof_area": 2500,
      "GWP_roof": 3.5,
      "roof_division": {
        "Green Areas": 25,
        "Solar Power": 25,
        "Water Management": 25,
        "Social Impact": 25
      }
    },
    {
      "building_id": "building-456",
      "roof_area": 1800,
      "GWP_roof": 3.0,
      "roof_division": {
        "Green Areas": 30,
        "Solar Power": 40,
        "Water Management": 20,
        "Social Impact": 10
      }
    }
  ],
  "common_parameters": {
    "climate_zone": "temperate",
    "efficiency_degradation": 0.005
  }
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Batch calculation completed successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "batch_size": 2,
    "calculation_ids": [
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001"
    ],
    "results": [
      {
        "building_id": "building-123",
        "calculation_id": "550e8400-e29b-41d4-a716-446655440000",
        "results": {
          "neutrality": {
            "with_improvements": 8.1,
            "natural_decline": 33.5
          },
          "savings": {
            "annual": 5972.4,
            "ten_year": 53125.6
          },
          "economics": {
            "estimated_cost": 218750,
            "simple_payback_years": 36.6,
            "roi_10yr": 24.3
          }
        }
      },
      {
        "building_id": "building-456",
        "calculation_id": "550e8400-e29b-41d4-a716-446655440001",
        "results": {
          "neutrality": {
            "with_improvements": 6.8,
            "natural_decline": 33.5
          },
          "savings": {
            "annual": 4777.9,
            "ten_year": 42500.5
          },
          "economics": {
            "estimated_cost": 157500,
            "simple_payback_years": 33.0,
            "roi_10yr": 27.0
          }
        }
      }
    ]
  }
}
```

### Compare Scenarios

Compares multiple calculation scenarios.

**Endpoint:** `POST /compare`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "scenarios": [
    {
      "name": "Base Scenario",
      "parameters": {
        "roof_area": 2000,
        "GWP_roof": 3.0,
        "roof_division": {
          "Green Areas": 25,
          "Solar Power": 25,
          "Water Management": 25,
          "Social Impact": 25
        }
      }
    },
    {
      "name": "Solar Focus",
      "parameters": {
        "roof_area": 2000,
        "GWP_roof": 3.0,
        "roof_division": {
          "Green Areas": 10,
          "Solar Power": 60,
          "Water Management": 20,
          "Social Impact": 10
        }
      }
    },
    {
      "name": "Green Focus",
      "parameters": {
        "roof_area": 2000,
        "GWP_roof": 3.0,
        "roof_division": {
          "Green Areas": 60,
          "Solar Power": 10,
          "Water Management": 20,
          "Social Impact": 10
        }
      }
    }
  ]
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Comparison completed successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "comparison_id": "550e8400-e29b-41d4-a716-446655440000",
    "calculation_ids": [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
      "550e8400-e29b-41d4-a716-446655440003"
    ],
    "scenarios": [
      {
        "scenario_name": "Base Scenario",
        "calculation_id": "550e8400-e29b-41d4-a716-446655440001",
        "neutrality_years": 7.2,
        "annual_savings": 4777.9,
        "ten_year_savings": 42500.5,
        "estimated_cost": 175000,
        "payback_years": 36.6,
        "roi_10yr": 24.3
      },
      {
        "scenario_name": "Solar Focus",
        "calculation_id": "550e8400-e29b-41d4-a716-446655440002",
        "neutrality_years": 6.5,
        "annual_savings": 7285.5,
        "ten_year_savings": 64801.2,
        "estimated_cost": 200000,
        "payback_years": 27.5,
        "roi_10yr": 32.4
      },
      {
        "scenario_name": "Green Focus",
        "calculation_id": "550e8400-e29b-41d4-a716-446655440003",
        "neutrality_years": 8.1,
        "annual_savings": 3035.6,
        "ten_year_savings": 27000.3,
        "estimated_cost": 140000,
        "payback_years": 46.1,
        "roi_10yr": 19.3
      }
    ],
    "best_scenarios": {
      "neutrality": {
        "scenario_name": "Solar Focus",
        "value": 6.5
      },
      "annual_savings": {
        "scenario_name": "Solar Focus",
        "value": 7285.5
      },
      "ten_year_savings": {
        "scenario_name": "Solar Focus",
        "value": 64801.2
      },
      "cost": {
        "scenario_name": "Green Focus",
        "value": 140000
      },
      "payback": {
        "scenario_name": "Solar Focus",
        "value": 27.5
      },
      "roi": {
        "scenario_name": "Solar Focus",
        "value": 32.4
      }
    },
    "summary": {
      "recommendation": "Based on the comparison, \"Solar Focus\" provides the best overall return on investment at 32.4%.",
      "fastest_neutrality": "\"Solar Focus\" achieves CO2 neutrality fastest in 6.5 years.",
      "highest_savings": "\"Solar Focus\" provides the highest 10-year CO2 savings at 64801.2 units.",
      "best_payback": "\"Solar Focus\" has the shortest payback period at 27.5 years."
    }
  }
}
```

## Social Impact Endpoints

### Enhanced Calculation

Performs detailed CO2 calculations with social and environmental metrics.

**Endpoint:** `POST /social/enhanced-calculate`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "roof_area": 2776,
  "GWP_roof": 3.33,
  "roof_division": {
    "Green Areas": 25,
    "Solar Power": 25,
    "Water Management": 25,
    "Social Impact": 25
  },
  "plant_absorption": 1347.976,
  "energy_emission": 64095.68,
  "solar_emission": 1747.13,
  "solar_reduction": 12142.5,
  "heating_original": 16720,
  "heating_reduced": 12540,
  "water_emission": 6849.81,
  "water_mitigated": 1441.254,
  "water_collected": 427,
  "social_metrics": {
    "social_network": 11.08,
    "trust": 11.08,
    "reciprocity": 11.08,
    "safety_wellbeing": 9.86,
    "social_equity": 9.83,
    "happiness": 22.6,
    "stress_reduction": 39.4,
    "quality_of_life": 35.3
  },
  "health_metrics": {
    "hypertension_reduction": 6.77,
    "heat_wave_temperature": 28,
    "mortality_reduction": 15
  },
  "sdg_focus": [
    "Zero Hunger",
    "Good Health and Well-being",
    "Clean Water and Sanitation",
    "Affordable and Clean Energy"
  ]
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Enhanced calculation completed successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "results": {
      "configuration": {
        "roof_area": 2776,
        "GWP_roof": 3.33,
        "initial_co2": 9244.08,
        "roof_division": {
          "Green Areas": 25,
          "Solar Power": 25,
          "Water Management": 25,
          "Social Impact": 25
        }
      },
      "environmental_impact": {
        "plant_absorption": 1347.976,
        "years_to_neutrality": 6.9,
        "solar_energy_savings_percentage": 18.9,
        "heating_reduction_percentage": 25.0,
        "water_reduction_percentage": 21.0,
        "total_annual_co2_reduction": 19111.73
      },
      "social_impact": {
        "metrics": {
          "social_network": 11.08,
          "trust": 11.08,
          "reciprocity": 11.08,
          "safety_wellbeing": 9.86,
          "social_equity": 9.83,
          "happiness": 22.6,
          "stress_reduction": 39.4,
          "quality_of_life": 35.3
        },
        "social_impact_score": 18.7
      },
      "health_impact": {
        "metrics": {
          "hypertension_reduction": 6.77,
          "heat_wave_temperature": 28,
          "mortality_reduction": 15
        },
        "health_impact_score": 10.9,
        "heat_wave_resilience": "Improved"
      },
      "sdg_alignment": {
        "sdgs_addressed": [
          "Zero Hunger",
          "Good Health and Well-being",
          "Clean Water and Sanitation",
          "Affordable and Clean Energy"
        ],
        "sdg_alignment_score": 23.5
      },
      "sustainability": {
        "sustainability_score": 72.6,
        "rating": "Very Good"
      },
      "economics": {
        "estimated_cost": 242900,
        "annual_economic_benefit": 25123.45,
        "simple_payback_years": 9.7,
        "roi_10yr": 103.4
      }
    }
  }
}
```

### SDG Report

Generates a report on how the roof improvements align with UN Sustainable Development Goals.

**Endpoint:** `POST /social/sdg-report`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "roof_division": {
    "Green Areas": 25,
    "Solar Power": 25,
    "Water Management": 25,
    "Social Impact": 25
  },
  "sdg_focus": [
    "Zero Hunger",
    "Good Health and Well-being",
    "Clean Water and Sanitation",
    "Affordable and Clean Energy",
    "Decent Work and Economic Growth",
    "Climate Action"
  ],
  "company_name": "Green Building Co.",
  "project_name": "Headquarters Roof Renovation"
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "SDG report generated successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "report": {
      "report_id": "550e8400-e29b-41d4-a716-446655440001",
      "company_name": "Green Building Co.",
      "project_name": "Headquarters Roof Renovation",
      "generated_at": "2025-03-04T12:19:49.000Z",
      "roof_division": {
        "Green Areas": 25,
        "Solar Power": 25,
        "Water Management": 25,
        "Social Impact": 25
      },
      "sdg_alignment": {
        "sdgs_addressed": [
          {
            "name": "Zero Hunger",
            "description": "End hunger, achieve food security and improved nutrition and promote sustainable agriculture.",
            "contribution": "Urban farming on rooftops supports vulnerable members of society by providing access to food in urban spaces, addressing social issues. Surplus food can be utilized to ensure no one in the local community goes hungry."
          },
          {
            "name": "Good Health and Well-being",
            "description": "Ensure healthy lives and promote well-being for all at all ages.",
            "contribution": "Green areas on rooftops contribute to the prevention of health issues and reduction of stress. The greenery absorbs particulate pollution, reducing overall air pollution locally and lowering exposure to pollutants that can lead to cardiovascular diseases, cancer, and allergies."
          },
          {
            "name": "Clean Water and Sanitation",
            "description": "Ensure availability and sustainable management of water and sanitation for all.",
            "contribution": "Green areas on rooftops retain and purify water, while rainwater collection systems allow for water reuse in applications like toilet flushing. This reduces the CO2e footprint and increases water usage efficiency, as the water doesn't need to pass through a treatment facility first."
          },
          {
            "name": "Affordable and Clean Energy",
            "description": "Ensure access to affordable, reliable, sustainable and modern energy for all.",
            "contribution": "Solar panels on the rooftop reduce consumption of external energy and heating supply, along with decreasing air pollution. This leads to improved energy efficiency and reduces the CO2e footprint by approximately 19% in a worst-case scenario."
          },
          {
            "name": "Decent Work and Economic Growth",
            "description": "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all.",
            "contribution": "Creating a social area on the rooftop with access to green spaces positively impacts employees through disease prevention, reduced stress, increased creativity, and improved productivity. This enhances economic potential per employee and attracts a more diverse workforce."
          },
          {
            "name": "Climate Action",
            "description": "Take urgent action to combat climate change and its impacts.",
            "contribution": "The integrated design of green spaces, solar panels, water collection, and social areas creates a space that actively reduces the environmental impact of both the building's users and the building itself. The presence of greenery helps lower the prevalence of several serious diseases."
          }
        ],
        "sdg_alignment_score": 35.3,
        "alignment_rating": "Good"
      },
      "recommendations": {
        "current_alignment": "The project currently addresses 6 out of 17 SDGs (35% alignment).",
        "suggestions": [
          {
            "sdg": "Life on Land",
            "suggestion": "Consider incorporating elements that address Life on Land to improve SDG alignment."
          },
          {
            "sdg": "Partnerships for the Goals",
            "suggestion": "Consider incorporating elements that address Partnerships for the Goals to improve SDG alignment."
          }
        ]
      }
    }
  }
}
```

### Health Impact

Calculates the health impact of roof improvements.

**Endpoint:** `POST /social/health-impact`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "roof_area": 2776,
  "roof_division": {
    "Green Areas": 25,
    "Solar Power": 25,
    "Water Management": 25,
    "Social Impact": 25
  },
  "employees": 50,
  "building_occupants": 100,
  "green_view_percentage": 60
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Health impact calculated successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "report": {
      "report_id": "550e8400-e29b-41d4-a716-446655440001",
      "generated_at": "2025-03-04T12:19:49.000Z",
      "roof_configuration": {
        "roof_area": 2776,
        "roof_division": {
          "Green Areas": 25,
          "Solar Power": 25,
          "Water Management": 25,
          "Social Impact": 25
        },
        "green_roof_area": 694,
        "green_view_percentage": 60
      },
      "building_occupancy": {
        "employees": 50,
        "building_occupants": 100,
        "percentage_with_green_view": 60
      },
      "health_impacts": {
        "stress_reduction_percentage": 5.9,
        "hypertension_reduction": 1.0,
        "mortality_reduction": 3.8,
        "productivity_increase": 3.4,
        "sick_days_reduction": 1.8,
        "health_impact_score": 3.2,
        "health_impact_rating": "Modest"
      },
      "economic_benefits": {
        "productivity_value_per_employee": 1700,
        "sick_days_savings": 180,
        "total_economic_benefit": 85180,
        "roi_percentage": 102.4
      },
      "summary": {
        "health": "The green roof improvements will reduce stress by 5.9%, hypertension risk by 1.0%, and heat-related mortality by 3.8%.",
        "productivity": "Employee productivity is expected to increase by 3.4%, with sick days reduced by 1.8%.",
        "economic": "The total annual economic benefit is estimated at 85,180 through productivity gains and reduced sick days."
      }
    }
  }
}
```

## History and Export

### Calculation History

Returns the calculation history for the authenticated user.

**Endpoint:** `GET /history`

**Authentication Required:** Yes

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Calculation history retrieved successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "count": 2,
    "calculations": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "type": "standard",
        "created_at": "2025-03-04T12:15:00.000Z",
        "parameters": {
          "roof_area": 2000,
          "GWP_roof": 3.0,
          "climate_zone": "temperate",
          "roof_division": {
            "Green Areas": 25,
            "Solar Power": 25,
            "Water Management": 25,
            "Social Impact": 25
          }
        },
        "summary": {
          "neutrality_improved": "CO2 neutrality with improvements is achieved in 7.2 years.",
          "neutrality_natural": "CO2 neutrality without improvements (natural decline) is achieved in 33.5 years.",
          "economic_summary": "Estimated payback period is 36.6 years with a 10-year ROI of 24.3%."
        }
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "type": "enhanced",
        "created_at": "2025-03-04T12:10:00.000Z",
        "parameters": {
          "roof_area": 2776,
          "GWP_roof": 3.33,
          "climate_zone": "temperate",
          "roof_division": {
            "Green Areas": 25,
            "Solar Power": 25,
            "Water Management": 25,
            "Social Impact": 25
          }
        },
        "summary": {
          "environmental": "The roof improvements will absorb 1347.98 kg CO2e annually, achieving CO2 neutrality in 6.9 years.",
          "social": "Social benefits include 18.7% improvement in social metrics, with notable improvements in stress reduction (39.4%) and quality of life (35.3%).",
          "health": "Health benefits include 6.77% reduction in hypertension risk and 15% reduction in heat-related mortality.",
          "economic": "With an estimated investment of 242,900 and annual benefits of 25,123.45, the payback period is 9.7 years.",
          "sustainability": "Overall sustainability score is 72.6/100, rated as \"Very Good\"."
        }
      }
    ]
  }
}
```

### Specific Calculation

Returns a specific calculation by ID.

**Endpoint:** `GET /history/:id`

**Authentication Required:** Yes

**Parameters:**
- `id` (path): Calculation ID

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Calculation retrieved successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "standard",
    "created_at": "2025-03-04T12:15:00.000Z",
    "parameters": {
      "roof_area": 2000,
      "GWP_roof": 3.0,
      "decline_rate": 0.03,
      "roof_division": {
        "Green Areas": 25,
        "Solar Power": 25,
        "Water Management": 25,
        "Social Impact": 25
      },
      "climate_zone": "temperate",
      "efficiency_degradation": 0.005
    },
    "results": {
      "configuration": {
        "roof_area": 2000,
        "GWP_roof": 3.0,
        "initial_co2": 6000,
        "decline_rate": 0.03,
        "roof_division": {
          "Green Areas": 25,
          "Solar Power": 25,
          "Water Management": 25,
          "Social Impact": 25
        },
        "annual_savings": {
          "Green Areas": 336.995,
          "Solar Power": 3035.625,
          "Water Management": 360.3125,
          "Social Impact": 1045
        },
        "efficiency_degradation": 0.005,
        "climate_zone": "temperate",
        "climate_factor": 1
      },
      "neutrality": {
        "with_improvements": 7.2,
        "natural_decline": 33.5
      },
      "savings": {
        "annual": 4777.9325,
        "ten_year": 42500.5
      },
      "economics": {
        "estimated_cost": 175000,
        "simple_payback_years": 36.6,
        "roi_10yr": 24.3
      },
      "summary": {
        "neutrality_improved": "CO2 neutrality with improvements is achieved in 7.2 years.",
        "neutrality_natural": "CO2 neutrality without improvements (natural decline) is achieved in 33.5 years.",
        "economic_summary": "Estimated payback period is 36.6 years with a 10-year ROI of 24.3%."
      }
    }
  }
}
```

### Export Calculation

Exports calculation results in the specified format.

**Endpoint:** `GET /export/:id`

**Authentication Required:** Yes

**Parameters:**
- `id` (path): Calculation ID
- `format` (query): Export format (json, csv)

**Response:**
For JSON format, the response is the same as the specific calculation endpoint.

For CSV format, the response is a CSV file with the calculation data.

## Administration

### List Users

Returns a list of all users (admin only).

**Endpoint:** `GET /admin/users`

**Authentication Required:** Yes (Admin)

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Users retrieved successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "users": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "admin",
        "role": "admin",
        "created_at": "2025-03-01T10:00:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "user1",
        "role": "user",
        "created_at": "2025-03-02T11:30:00.000Z"
      }
    ]
  }
}
```

### Create User

Creates a new user (admin only).

**Endpoint:** `POST /admin/users`

**Authentication Required:** Yes (Admin)

**Request Body:**
```json
{
  "username": "newuser",
  "password": "securepassword123",
  "role": "user"
}
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "User created successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "username": "newuser",
    "role": "user"
  }
}
```

### List Tokens

Returns a list of all API tokens (admin only).

**Endpoint:** `GET /auth/token`

**Authentication Required:** Yes (Admin)

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Tokens retrieved successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "tokens": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "company": "Green Roofs Inc.",
        "email": "contact@greenroofs.com",
        "purpose": "Integration with building management system",
        "created_at": "2025-03-01T10:00:00.000Z",
        "expires_at": "2026-03-01T10:00:00.000Z",
        "revoked": 0
      }
    ]
  }
}
```

### List Token Requests

Returns a list of all token requests (admin only).

**Endpoint:** `GET /auth/token/requests`

**Authentication Required:** Yes (Admin)

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Token requests retrieved successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "requests": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "company": "Green Roofs Inc.",
        "email": "contact@greenroofs.com",
        "purpose": "Integration with building management system",
        "company_id": "DK12345678",
        "address": "123 Green Street, Copenhagen",
        "status": "pending",
        "created_at": "2025-03-03T15:30:00.000Z"
      }
    ]
  }
}
```

### Approve Token Request

Approves a token request and generates an API token (admin only).

**Endpoint:** `POST /auth/token/:id/approve`

**Authentication Required:** Yes (Admin)

**Parameters:**
- `id` (path): Token request ID

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Token request approved",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-03-04T12:19:49.000Z"
  }
}
```

### Revoke Token

Revokes an API token (admin only).

**Endpoint:** `POST /auth/token/:id/revoke`

**Authentication Required:** Yes (Admin)

**Parameters:**
- `id` (path): Token ID

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Token revoked successfully",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "data": {
    "tokenId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "meta": {
    "success": false,
    "message": "Error message",
    "version": "1.1.0",
    "timestamp": 1709556789
  },
  "error": "Detailed error description"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (missing or invalid authentication)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource not found)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- General API endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 10 requests per hour per IP

When rate limit is exceeded, the API returns a 429 status code with a message indicating when the limit will reset.