/**
 * API Integration Tests
 */
const request = require('supertest');
const app = require('../index');
const { User } = require('../models/user');
const { Token } = require('../models/token');
const jwt = require('jsonwebtoken');

// Mock JWT_SECRET for testing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('API Endpoints', () => {
  let adminToken;
  
  // Setup: Create admin token for testing
  beforeAll(async () => {
    // Find admin user
    const adminUser = await User.findByUsername(process.env.ADMIN_USERNAME || 'admin');
    
    if (adminUser) {
      // Create JWT token
      adminToken = jwt.sign(
        { id: adminUser.id, username: adminUser.username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Add token to database
      await Token.create({
        userId: adminUser.id,
        token: adminToken,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      });
    }
  });
  
  // Test health endpoint
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.meta.success).toBe(true);
      expect(res.body.data.status).toEqual('UP');
    });
  });
  
  // Test authentication
  describe('Authentication', () => {
    it('should reject requests without authentication', async () => {
      const res = await request(app).get('/history');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.meta.success).toBe(false);
    });
    
    it('should accept requests with valid authentication', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }
      
      const res = await request(app)
        .get('/history')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.meta.success).toBe(true);
    });
  });
  
  // Test calculation endpoint
  describe('POST /calculate', () => {
    it('should perform calculation with valid parameters', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }
      
      const res = await request(app)
        .post('/calculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roof_area: 2000,
          GWP_roof: 3.0,
          roof_division: {
            "Plants": 25,
            "Solar Panels": 25,
            "Water Management": 25,
            "Energy Savings": 25
          }
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.meta.success).toBe(true);
      expect(res.body.data.results).toBeDefined();
      expect(res.body.data.results.configuration).toBeDefined();
      expect(res.body.data.results.neutrality).toBeDefined();
      expect(res.body.data.results.savings).toBeDefined();
    });
    
    it('should reject calculation with invalid parameters', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }
      
      const res = await request(app)
        .post('/calculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roof_area: -100, // Invalid negative value
          GWP_roof: 3.0,
          roof_division: {
            "Plants": 25,
            "Solar Panels": 25,
            "Water Management": 25,
            "Energy Savings": 25
          }
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.meta.success).toBe(false);
    });
  });
  
  // Test social impact endpoints
  describe('Social Impact Endpoints', () => {
    it('should calculate enhanced metrics', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }
      
      const res = await request(app)
        .post('/social/enhanced-calculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roof_area: 2776,
          GWP_roof: 3.33,
          roof_division: {
            "Plants": 25,
            "Solar Panels": 25,
            "Water Management": 25,
            "Social": 25
          },
          plant_absorption: 1347.976,
          energy_emission: 64095.68,
          solar_emission: 1747.13,
          solar_reduction: 12142.5,
          heating_original: 16720,
          heating_reduced: 12540,
          water_emission: 6849.81,
          water_mitigated: 1441.254,
          water_collected: 427
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.meta.success).toBe(true);
      expect(res.body.data.results.environmental_impact).toBeDefined();
      expect(res.body.data.results.sustainability).toBeDefined();
    });
    
    it('should generate SDG report', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }
      
      const res = await request(app)
        .post('/social/sdg-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roof_division: {
            "Plants": 25,
            "Solar Panels": 25,
            "Water Management": 25,
            "Social": 25
          },
          sdg_focus: [
            "Zero Hunger",
            "Good Health and Well-being",
            "Clean Water and Sanitation",
            "Affordable and Clean Energy"
          ],
          company_name: "Green Building Co.",
          project_name: "Headquarters Roof Renovation"
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.meta.success).toBe(true);
      expect(res.body.data.report.sdg_alignment).toBeDefined();
      expect(res.body.data.report.recommendations).toBeDefined();
    });
  });
});