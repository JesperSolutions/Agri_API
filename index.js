const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import utilities
const logger = require('./utils/logger');
const { validateConfig } = require('./utils/config-validator');

// Import middleware
const { apiLimiter, authLimiter } = require('./middleware/rate-limit');
const { notFound, errorHandler } = require('./middleware/error-handler');

// Import routes
const authRoutes = require('./routes/auth');
const calculationRoutes = require('./routes/calculations');
const adminRoutes = require('./routes/admin');
const socialRoutes = require('./routes/social');

// Validate configuration
validateConfig();

const app = express();
const PORT = process.env.PORT || 3000;

// API Version
const API_VERSION = '1.1.0';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Apply rate limiting
app.use('/auth/login', authLimiter);
app.use('/auth/token/request', authLimiter);
app.use('/calculate', apiLimiter);
app.use('/social', apiLimiter);

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CO2 Calculation API',
      version: API_VERSION,
      description: 'API for CO2 reduction calculations based on roof improvements with enhanced social and environmental metrics',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        CalculationParameters: {
          type: 'object',
          properties: {
            roof_area: {
              type: 'number',
              description: 'Roof area in square meters',
              example: 2776
            },
            GWP_roof: {
              type: 'number',
              description: 'Global Warming Potential of the roof',
              example: 3.33
            },
            decline_rate: {
              type: 'number',
              description: 'Natural CO2 decline rate',
              example: 0.03
            },
            roof_division: {
              type: 'object',
              description: 'Percentage allocation of roof improvements',
              example: {
                "Green Areas": 25,
                "Solar Power": 25,
                "Water Management": 25,
                "Social Impact": 25
              }
            },
            climate_zone: {
              type: 'string',
              description: 'Climate zone for calculations',
              enum: ['temperate', 'tropical', 'arid', 'continental', 'polar'],
              example: 'temperate'
            },
            efficiency_degradation: {
              type: 'number',
              description: 'Annual degradation of improvement efficiency',
              example: 0.005
            }
          }
        },
        EnhancedCalculationParameters: {
          type: 'object',
          properties: {
            roof_area: {
              type: 'number',
              description: 'Roof area in square meters',
              example: 2776
            },
            GWP_roof: {
              type: 'number',
              description: 'Global Warming Potential of the roof',
              example: 3.33
            },
            roof_division: {
              type: 'object',
              description: 'Percentage allocation of roof improvements',
              example: {
                "Green Areas": 25,
                "Solar Power": 25,
                "Water Management": 25,
                "Social Impact": 25
              }
            },
            plant_absorption: {
              type: 'number',
              description: 'CO2 absorption rate for plants in kg CO2e per year',
              example: 1347.976
            },
            energy_emission: {
              type: 'number',
              description: 'Energy emission in kg CO2e per year',
              example: 64095.68
            },
            solar_emission: {
              type: 'number',
              description: 'Solar panel emission in kg CO2e',
              example: 1747.13
            },
            solar_reduction: {
              type: 'number',
              description: 'Solar panel reduction in kg CO2e per year',
              example: 12142.5
            },
            heating_original: {
              type: 'number',
              description: 'Original heating emission in kg CO2e per year',
              example: 16720
            },
            heating_reduced: {
              type: 'number',
              description: 'Reduced heating emission in kg CO2e per year',
              example: 12540
            },
            water_emission: {
              type: 'number',
              description: 'Water emission in kg CO2e per year',
              example: 6849.81
            },
            water_mitigated: {
              type: 'number',
              description: 'Water mitigated in kg CO2e per year',
              example: 1441.254
            },
            water_collected: {
              type: 'number',
              description: 'Water collected in m3 per year',
              example: 427
            },
            social_metrics: {
              type: 'object',
              description: 'Social impact metrics in percentage improvement',
              example: {
                "social_network": 11.08,
                "trust": 11.08,
                "reciprocity": 11.08,
                "safety_wellbeing": 9.86,
                "social_equity": 9.83,
                "happiness": 22.6,
                "stress_reduction": 39.4,
                "quality_of_life": 35.3
              }
            },
            health_metrics: {
              type: 'object',
              description: 'Health impact metrics',
              example: {
                "hypertension_reduction": 6.77,
                "heat_wave_temperature": 28,
                "mortality_reduction": 15
              }
            },
            sdg_focus: {
              type: 'array',
              description: 'UN Sustainable Development Goals addressed',
              example: ["Zero Hunger", "Good Health and Well-being", "Clean Water and Sanitation", "Affordable and Clean Energy"]
            }
          }
        },
        TokenRequest: {
          type: 'object',
          required: ['company', 'email', 'purpose'],
          properties: {
            company: {
              type: 'string',
              description: 'Company name',
              example: 'Green Roofs Inc.'
            },
            email: {
              type: 'string',
              description: 'Contact email',
              example: 'contact@greenroofs.com'
            },
            purpose: {
              type: 'string',
              description: 'Purpose of API access',
              example: 'Integration with building management system'
            },
            company_id: {
              type: 'string',
              description: 'Company ID or registration number',
              example: 'DK12345678'
            },
            address: {
              type: 'string',
              description: 'Company address',
              example: '123 Green Street, Copenhagen'
            }
          }
        },
        User: {
          type: 'object',
          required: ['username', 'password', 'role'],
          properties: {
            username: {
              type: 'string',
              example: 'newuser'
            },
            password: {
              type: 'string',
              example: 'securepassword123'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              example: 'user'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  meta: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: false
                      },
                      message: {
                        type: 'string',
                        example: 'Authentication failed'
                      }
                    }
                  },
                  error: {
                    type: 'string',
                    example: 'No authorization header provided'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Calculations',
        description: 'Endpoints for CO2 calculations'
      },
      {
        name: 'Social Impact',
        description: 'Endpoints for social and environmental impact calculations'
      },
      {
        name: 'Authentication',
        description: 'Authentication and token management'
      },
      {
        name: 'Administration',
        description: 'Administrative endpoints (admin only)'
      }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Standard API Response Structure
 * @param {boolean} success - Indicates if the request was successful
 * @param {string} message - Human-readable message about the response
 * @param {object} data - The actual response data
 * @param {string|null} error - Error message if success is false
 * @returns {object} Standardized response object
 */
function createResponse(success, message, data = null, error = null) {
  return {
    meta: {
      success,
      message,
      version: API_VERSION,
      timestamp: Math.floor(Date.now() / 1000)
    },
    data,
    error
  };
}

// Make createResponse available globally
global.createResponse = createResponse;

// API Routes
app.get('/', (req, res) => {
  const response = createResponse(
    true, 
    'API is operational',
    { 
      status: 'running',
      version: API_VERSION,
      documentation: `/api-docs`
    }
  );
  res.status(200).json(response);
});

app.get('/health', (req, res) => {
  const response = createResponse(true, 'Service is healthy', { status: 'UP' });
  res.status(200).json(response);
});

// Use routes
app.use('/auth', authRoutes);
app.use('/', calculationRoutes);
app.use('/admin', adminRoutes);
app.use('/social', socialRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`CO2 Calculation API running on port ${PORT}`);
  logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`CO2 Calculation API running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;