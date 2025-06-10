# Enhanced CO2 Calculation API

This API provides CO2 reduction calculations based on roof improvements with enhanced social and environmental metrics.

## New Features in v1.1.0

- **Enhanced Social Metrics**: Calculate the social impact of green roofs including stress reduction, happiness, and quality of life improvements
- **Health Impact Calculations**: Quantify health benefits including hypertension reduction and mortality reduction
- **SDG Alignment**: Map roof improvements to UN Sustainable Development Goals
- **Improved Code Structure**: Modular code organization with separate route files
- **Enhanced Documentation**: Updated Swagger documentation with new endpoints
- **Rate Limiting**: Protection against API abuse
- **Structured Logging**: Comprehensive logging system for better debugging
- **Error Handling**: Centralized error handling for consistent responses
- **Configuration Validation**: Automatic validation of environment variables
- **Automated Testing**: Integration tests for API endpoints

## Table of Contents

- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Server Setup](#server-setup)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Public Endpoints](#public-endpoints)
  - [Basic Calculation Endpoints](#basic-calculation-endpoints)
  - [Advanced Calculation Endpoints](#advanced-calculation-endpoints)
  - [Social Impact Endpoints](#social-impact-endpoints)
  - [Administrative Endpoints](#administrative-endpoints)
- [Calculation Methodologies](#calculation-methodologies)
  - [Standard CO2 Calculations](#standard-co2-calculations)
  - [Enhanced Social Impact Calculations](#enhanced-social-impact-calculations)
  - [Health Impact Calculations](#health-impact-calculations)
  - [Economic Impact Calculations](#economic-impact-calculations)
  - [SDG Alignment Calculations](#sdg-alignment-calculations)
- [Mathematical Model](#mathematical-model-improvements)
- [UN Sustainable Development Goals](#un-sustainable-development-goals)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- 500MB+ of free disk space
- 512MB+ of RAM

### Local Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/co2-calculation-api.git
cd co2-calculation-api
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file (or copy from `.env.example`):

```bash
cp .env.example .env
```

4. Edit the `.env` file to set your environment variables:

```
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=your-secret-key-change-in-production
TOKEN_EXPIRY=30d

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

5. Deploy the API (initializes database and starts server):

```bash
npm run deploy
```

6. Access the API at http://localhost:3000 and the Swagger documentation at http://localhost:3000/api-docs

### Server Setup

For production deployment on a server:

1. Ensure Node.js (v14+) is installed on your server

2. Clone or upload the project to your server

3. Install dependencies:

```bash
npm install --production
```

4. Create a `.env` file with production settings:

```
# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Security
JWT_SECRET=your-secure-random-string
TOKEN_EXPIRY=30d

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
```

5. Deploy with production settings:

```bash
npm run deploy
```

6. For production use, consider setting up:
   - A process manager like PM2
   - A reverse proxy like Nginx
   - SSL/TLS certificates

### PM2 Setup (Recommended for Production)

1. Install PM2 globally:

```bash
npm install -g pm2
```

2. Start the application with PM2:

```bash
pm2 start index.js --name co2-calculation-api
```

3. Configure PM2 to start on system boot:

```bash
pm2 startup
pm2 save
```

### Nginx Configuration (Optional)

Example Nginx configuration for reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Configuration

The API can be configured using environment variables in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port to run the server on | 3000 |
| NODE_ENV | Environment (development, production, test) | development |
| LOG_LEVEL | Logging level (error, warn, info, debug) | info |
| JWT_SECRET | Secret key for JWT tokens | (random generated) |
| TOKEN_EXPIRY | Expiry time for JWT tokens | 30d |
| ADMIN_USERNAME | Default admin username | admin |
| ADMIN_PASSWORD | Default admin password | admin123 |

## API Documentation

Swagger documentation is available at `/api-docs` when the server is running.

## Authentication

The API uses JWT-based authentication with two types of tokens:

1. **User tokens**: For admin access to manage the API
2. **API tokens**: For client applications to access calculation endpoints

### Default Admin User

A default admin user is created on first run:
- Username: admin (configurable in .env)
- Password: admin123 (configurable in .env)

### Default Admin Token

A default admin token is created on first run for testing purposes:
- Token is saved to `admin-token.txt` in the project root
- Token is valid for 30 days
- Token can be used for testing the API without logging in

### Token Request Process

For clients to access the API:

1. Client submits a token request with company information
2. Admin approves the request
3. System generates an API token for the client
4. Client uses the token to access calculation endpoints

## Endpoints

### Public Endpoints

#### GET / - API Status
Returns the current status and version of the API.

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

#### GET /health - Health Check
Returns the health status of the API service.

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

#### POST /auth/login - User Authentication
Authenticates a user and returns a JWT token for API access.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**How it works:**
1. Validates username and password against the database
2. Uses PBKDF2 with salt for secure password verification
3. Generates a JWT token with user information
4. Stores the token in the database for validation
5. Returns the token and user information

#### POST /auth/token/request - Request API Access
Submits a request for API access token approval.

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

**How it works:**
1. Validates required fields (company, email, purpose)
2. Creates a pending token request in the database
3. Returns a request ID for tracking
4. Admin can later approve the request to generate an API token

### Basic Calculation Endpoints

#### POST /simple-calculate - Simple CO2 Calculation
Performs basic CO2 calculations with minimal input parameters.

**Request Body:**
```json
{
  "roof_area": 2000,
  "roof_division": {
    "Green Areas": 25,
    "Solar Power": 25,
    "Water Management": 25,
    "Social Impact": 25
  }
}
```

**How it works:**
1. **Input Validation**: Validates roof area is positive and roof division percentages sum to 100%
2. **Default Parameters**: Applies default values for GWP_roof (3.0), climate_zone ('temperate'), and efficiency_degradation (0.005)
3. **CO2 Calculation**: Uses the standard calculation model with simplified parameters
4. **Data Privacy**: Hashes user ID before storing to protect privacy
5. **Response**: Returns key metrics including years to neutrality, annual savings, and ROI

**Calculation Method:**
- Initial CO2 = GWP_roof × roof_area
- Annual savings calculated per improvement type based on roof division percentages
- Uses exponential decay model for natural CO2 decline
- Applies climate factors and efficiency degradation over time

#### POST /calculate - Full CO2 Calculation
Performs detailed CO2 calculations with comprehensive parameters.

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

**How it works:**
1. **Comprehensive Validation**: Validates all input parameters including ranges and constraints
2. **Climate Adjustment**: Applies climate zone factors (temperate: 1.0, tropical: 1.2, arid: 0.9, etc.)
3. **Timeline Generation**: Creates detailed timeline with 1000 points for smooth calculations
4. **Dual Modeling**: Calculates both natural decline and improvement scenarios
5. **Efficiency Degradation**: Models decreasing efficiency of improvements over time
6. **Economic Analysis**: Calculates costs, payback periods, and ROI metrics

**Mathematical Model:**
- **Natural Decline**: CO2(t) = Initial_CO2 × e^(-decline_rate × t × climate_factor)
- **With Improvements**: Applies annual savings with efficiency degradation
- **Efficiency**: efficiency(t) = max(0, 1 - efficiency_degradation × years_active)
- **Neutrality**: Finds intersection where CO2 levels reach zero

#### POST /sales - Sales Summary
Provides simplified results optimized for sales presentations.

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

**How it works:**
1. **Full Calculation**: Performs complete CO2 calculation internally
2. **Data Extraction**: Extracts only sales-relevant metrics
3. **Summary Generation**: Creates human-readable summary statements
4. **Project Context**: Includes building and company information
5. **Key Metrics Focus**: Emphasizes neutrality timeline, savings, and economic benefits

**Output Focus:**
- Years to CO2 neutrality
- Years saved compared to natural decline
- Annual and 10-year CO2 savings
- Investment cost and payback period
- ROI calculations

### Advanced Calculation Endpoints

#### POST /batch - Batch Calculation
Processes multiple buildings in a single request for efficiency.

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
    }
  ],
  "common_parameters": {
    "climate_zone": "temperate",
    "efficiency_degradation": 0.005
  }
}
```

**How it works:**
1. **Parameter Merging**: Combines common parameters with building-specific parameters
2. **Sequential Processing**: Processes each building individually
3. **Database Storage**: Saves each calculation separately with unique IDs
4. **Result Aggregation**: Compiles results into a single response
5. **Error Handling**: Continues processing even if individual buildings fail

**Use Cases:**
- Portfolio analysis for multiple properties
- Comparative analysis across building types
- Bulk processing for large real estate portfolios

#### POST /compare - Scenario Comparison
Compares multiple calculation scenarios to find optimal configurations.

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
    }
  ]
}
```

**How it works:**
1. **Scenario Processing**: Runs full calculations for each scenario
2. **Metric Extraction**: Extracts key comparison metrics from each result
3. **Best Scenario Analysis**: Identifies optimal scenarios for each metric
4. **Recommendation Engine**: Generates recommendations based on analysis
5. **Summary Generation**: Creates comparative summary with insights

**Comparison Metrics:**
- Fastest CO2 neutrality
- Highest annual/10-year savings
- Lowest cost and shortest payback
- Best ROI

### Social Impact Endpoints

#### POST /social/enhanced-calculate - Enhanced Social Impact Calculation
Performs comprehensive calculations including social, health, and environmental metrics.

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

**How it works:**
1. **Environmental Impact**: Calculates CO2 neutrality based on plant absorption
2. **Energy Analysis**: Determines solar energy savings percentage
3. **Water Impact**: Calculates heating and water reduction percentages
4. **Social Scoring**: Weighted average of social metrics with importance factors
5. **Health Assessment**: Combines hypertension and mortality reduction metrics
6. **SDG Alignment**: Scores based on number of SDGs addressed (max 17)
7. **Sustainability Score**: Combines all factors with weighted importance
8. **Economic Integration**: Includes productivity and health cost savings

**Calculation Formulas:**
- **Years to Neutrality**: Initial_CO2 ÷ plant_absorption
- **Energy Savings %**: (solar_reduction ÷ energy_emission) × 100
- **Social Score**: Σ(metric × weight) ÷ Σ(weights)
- **Sustainability Score**: (Environmental × 0.4) + (Social × 0.3) + (Health × 0.2) + (SDG × 0.1)

#### POST /social/sdg-report - SDG Alignment Report
Generates detailed reports on UN Sustainable Development Goals alignment.

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
    "Affordable and Clean Energy"
  ],
  "company_name": "Green Building Co.",
  "project_name": "Headquarters Roof Renovation"
}
```

**How it works:**
1. **SDG Mapping**: Maps each SDG to detailed descriptions and contribution explanations
2. **Alignment Scoring**: Calculates percentage based on SDGs addressed (out of 17 total)
3. **Rating Assignment**: Assigns qualitative ratings based on score ranges
4. **Gap Analysis**: Identifies unaddressed SDGs for improvement recommendations
5. **Report Generation**: Creates comprehensive report with actionable insights

**SDG Contributions:**
- **Zero Hunger**: Urban farming for food security
- **Good Health**: Air quality improvement and stress reduction
- **Clean Water**: Water retention, purification, and collection
- **Clean Energy**: Solar power for reduced energy consumption
- **Economic Growth**: Productivity improvements from green spaces
- **Climate Action**: Integrated environmental impact reduction

**Scoring System:**
- Exceptional: 90-100% (15-17 SDGs)
- Strong: 70-89% (12-14 SDGs)
- Good: 50-69% (8-11 SDGs)
- Moderate: 30-49% (5-7 SDGs)
- Limited: <30% (<5 SDGs)

#### POST /social/health-impact - Health Impact Assessment
Calculates specific health benefits and economic value of health improvements.

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

**How it works:**
1. **Green Area Calculation**: Determines actual green roof area from roof division
2. **Exposure Modeling**: Calculates percentage of occupants with green space exposure
3. **Health Benefit Scaling**: Scales research-based health benefits by exposure levels
4. **Economic Valuation**: Converts health improvements to economic benefits
5. **ROI Calculation**: Determines return on investment for health improvements

**Health Metrics Calculated:**
- **Stress Reduction**: 39.4% × (green_area/total_area) × (green_view_percentage/100)
- **Hypertension Reduction**: 6.77% × (green_area/total_area) × (green_view_percentage/100)
- **Mortality Reduction**: 15% × (green_area/total_area)
- **Productivity Increase**: 22.6% × (green_area/total_area) × (green_view_percentage/100)
- **Sick Days Reduction**: 12.3% × (green_area/total_area) × (green_view_percentage/100)

**Economic Calculations:**
- **Productivity Value**: avg_salary × (productivity_increase/100) × employees
- **Sick Day Savings**: avg_sick_day_cost × (sick_days_reduction/100) × employees
- **Total Benefit**: productivity_value + sick_day_savings
- **ROI**: (total_benefit ÷ green_roof_cost) × 100

### Administrative Endpoints

#### GET /history - Calculation History
Returns calculation history for the authenticated user.

**How it works:**
1. **User Authentication**: Verifies JWT token and extracts user ID
2. **Database Query**: Retrieves all calculations for the specific user
3. **Data Formatting**: Formats calculations for consistent response structure
4. **Privacy Protection**: Only returns calculations owned by the requesting user
5. **Summary Generation**: Creates summary information for each calculation

#### GET /history/:id - Specific Calculation
Retrieves detailed results for a specific calculation.

**How it works:**
1. **Authorization Check**: Verifies user owns the requested calculation
2. **Data Retrieval**: Fetches complete calculation data from database
3. **JSON Parsing**: Converts stored JSON strings back to objects
4. **Complete Response**: Returns full calculation parameters and results

#### GET /export/:id - Export Calculation
Exports calculation results in JSON or CSV format.

**Supported Formats:**
- **JSON**: Complete calculation data structure
- **CSV**: Flattened data suitable for spreadsheet analysis

**How it works:**
1. **Format Detection**: Determines export format from query parameter
2. **Data Retrieval**: Fetches calculation data
3. **Format Conversion**: Converts to requested format
4. **File Headers**: Sets appropriate content-type and download headers
5. **CSV Generation**: Flattens nested JSON structure for CSV export

## Calculation Methodologies

### Standard CO2 Calculations

The standard CO2 calculation model uses an improved exponential decay approach:

#### Core Formula
```
CO2(t) = Initial_CO2 × e^(-decline_rate × t × climate_factor) - Σ(improvements)
```

#### Key Components:

1. **Initial CO2 Impact**
   - Formula: `GWP_roof × roof_area`
   - Represents the baseline carbon footprint of the roof

2. **Natural Decline**
   - Uses exponential decay: `e^(-decline_rate × time)`
   - Adjusted by climate factors for regional variations

3. **Improvement Savings**
   - Applied annually based on roof division percentages
   - Includes efficiency degradation over time
   - Formula: `savings × efficiency(t)` where `efficiency(t) = max(0, 1 - degradation_rate × years_active)`

4. **Climate Factors**
   - Temperate: 1.0 (baseline)
   - Tropical: 1.2 (faster processes)
   - Arid: 0.9 (slower processes)
   - Continental: 1.1
   - Polar: 0.8

#### Timeline Modeling
- Uses 1000 data points over the calculation period for smooth curves
- Applies improvements at different start years based on implementation timeline
- Models efficiency degradation for realistic long-term projections

### Enhanced Social Impact Calculations

#### Social Impact Score
Weighted average of social metrics with research-based importance factors:

```
Social_Score = Σ(metric_value × weight) ÷ Σ(weights)
```

**Weights:**
- Social Network: 0.1
- Trust: 0.1
- Reciprocity: 0.1
- Safety & Wellbeing: 0.15
- Social Equity: 0.15
- Happiness: 0.15
- Stress Reduction: 0.15
- Quality of Life: 0.1

#### Sustainability Score
Comprehensive score combining multiple impact areas:

```
Sustainability = (Environmental × 0.4) + (Social × 0.3) + (Health × 0.2) + (SDG × 0.1)
```

**Components:**
- **Environmental (40%)**: CO2 reduction effectiveness
- **Social (30%)**: Social metric improvements
- **Health (20%)**: Health benefit score
- **SDG (10%)**: UN SDG alignment percentage

### Health Impact Calculations

#### Health Benefit Scaling
Health benefits are scaled based on green space exposure:

```
Health_Benefit = Base_Benefit × (Green_Area ÷ Total_Area) × (View_Percentage ÷ 100)
```

#### Research-Based Benefits
- **Stress Reduction**: Up to 39.4% improvement
- **Hypertension Reduction**: Up to 6.77% reduction in risk
- **Mortality Reduction**: Up to 15% reduction in heat-related mortality
- **Productivity Increase**: Up to 22.6% improvement
- **Sick Days**: Up to 12.3% reduction

#### Health Impact Score
```
Health_Score = (Hypertension_Reduction + Mortality_Reduction) ÷ 2
```

### Economic Impact Calculations

#### Cost Estimation
Per-square-meter costs by improvement type:
- Green Areas: €120/m²
- Solar Power: €350/m²
- Water Management: €80/m²
- Social Impact: €150/m²

#### Economic Benefits
Multiple benefit streams are calculated:

1. **Carbon Benefits**: `CO2_reduction × carbon_price_per_kg`
2. **Energy Savings**: `electricity_savings × price_per_kWh`
3. **Water Benefits**: `water_collected × price_per_m³`
4. **Productivity Benefits**: `social_score × productivity_value × employees`
5. **Health Savings**: `health_score × health_cost_savings × employees`

#### ROI Calculations
- **Simple Payback**: `total_cost ÷ annual_benefits`
- **10-Year ROI**: `(10_year_benefits ÷ total_cost) × 100`

### SDG Alignment Calculations

#### Alignment Score
```
SDG_Score = (Number_of_SDGs_Addressed ÷ 17) × 100
```

#### Rating System
- Outstanding: 90-100% (15-17 SDGs)
- Excellent: 80-89% (14-15 SDGs)
- Very Good: 70-79% (12-13 SDGs)
- Good: 60-69% (10-11 SDGs)
- Satisfactory: 50-59% (8-9 SDGs)
- Acceptable: 40-49% (7-8 SDGs)
- Needs Improvement: <40% (<7 SDGs)

## Mathematical Model Improvements

The API includes several improvements to the mathematical model:

1. **Social Impact Metrics**: Quantification of social benefits including stress reduction and quality of life
2. **Health Impact Calculations**: Measurement of health benefits including hypertension and mortality reduction
3. **SDG Alignment**: Mapping of roof improvements to UN Sustainable Development Goals
4. **Economic Benefits**: Calculation of economic benefits from productivity improvements and health cost savings
5. **Sustainability Scoring**: Overall sustainability score based on environmental, social, and health impacts

## UN Sustainable Development Goals

The API supports mapping roof improvements to the following UN Sustainable Development Goals:

- **Zero Hunger**: Urban farming on rooftops to support vulnerable members of society
- **Good Health and Well-being**: Green areas for health issue prevention and stress reduction
- **Clean Water and Sanitation**: Water retention, purification, and collection systems
- **Affordable and Clean Energy**: Solar panels for reduced energy consumption
- **Decent Work and Economic Growth**: Social areas for improved employee productivity
- **Climate Action**: Integrated design to reduce environmental impact
- **Life on Land**: Green spaces to support biodiversity
- **Partnerships for the Goals**: Collaborative environment for knowledge exchange

## Testing

The API includes automated tests to ensure functionality:

```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern=api.test.js
```

## Deployment

The API includes a comprehensive deployment script that handles:

1. Environment setup
2. System requirements check
3. Database initialization
4. Admin user and token creation
5. Automated testing
6. Server startup

Run the deployment script with:

```bash
npm run deploy
```

Additional deployment options:

```bash
# Setup only (don't start server)
node deploy.js --setup-only

# Skip tests
node deploy.js --skip-tests
```

## Troubleshooting

### Common Issues

1. **Database Initialization Fails**

   Check if the database directory is writable:

   ```bash
   chmod -R 755 database/data
   ```

2. **JWT Authentication Fails**

   Ensure JWT_SECRET is set in your .env file:

   ```
   JWT_SECRET=your-secure-random-string
   ```

3. **Server Won't Start**

   Check if the port is already in use:

   ```bash
   lsof -i :3000
   ```

4. **Rate Limiting Issues**

   Adjust rate limits in `middleware/rate-limit.js` if needed.

### Logs

Check the logs for detailed error information:

- `logs/error.log`: Contains error-level logs
- `logs/combined.log`: Contains all logs

### Getting Help

If you encounter issues not covered here, please:

1. Check the logs for detailed error messages
2. Run the deployment script with verbose logging:

   ```bash
   NODE_ENV=development LOG_LEVEL=debug node deploy.js
   ```

3. Contact support with the error logs and deployment summary