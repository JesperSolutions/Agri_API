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

- **GET /**: Returns API status and available endpoints
- **GET /health**: Health check endpoint
- **POST /auth/login**: User login
- **POST /auth/token/request**: Request API access token

### Calculation Endpoints (Authentication Required)

- **POST /calculate**: Performs detailed CO2 calculations
- **POST /sales**: Provides simplified CO2 calculation results for sales purposes
- **POST /batch**: Performs calculations for multiple buildings in a single request
- **GET /history**: Returns the calculation history for the authenticated user
- **GET /history/:id**: Returns a specific calculation by ID
- **POST /compare**: Compares multiple calculation scenarios
- **GET /export/:id**: Exports calculation results in the specified format

### Social Impact Endpoints (Authentication Required)

- **POST /social/enhanced-calculate**: Performs enhanced calculations with social metrics
- **POST /social/sdg-report**: Generates a report on SDG alignment
- **POST /social/health-impact**: Calculates health impact of roof improvements

### Admin Endpoints (Admin Authentication Required)

- **GET /admin/users**: List all users
- **POST /admin/users**: Create new user
- **GET /auth/token**: List all tokens
- **GET /auth/token/requests**: List all token requests
- **POST /auth/token/:id/approve**: Approve token request
- **POST /auth/token/:id/revoke**: Revoke token

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