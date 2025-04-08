# Deployment Guide for Ubuntu Server

## Prerequisites

1. Ubuntu Server 20.04 LTS or higher
2. Root access or sudo privileges
3. Domain name (optional, but recommended)

## Installation Steps

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js and npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

### 3. Install Required Build Tools
```bash
sudo apt install -y build-essential
```

### 4. Create Application Directory
```bash
sudo mkdir -p /var/www/co2-api
sudo chown -R $USER:$USER /var/www/co2-api
```

### 5. Clone or Upload Project Files
```bash
cd /var/www/co2-api
# If using Git:
git clone <repository-url> .
# Or upload files using SFTP/SCP
```

### 6. Install Dependencies
```bash
npm install --production
```

### 7. Configure Environment Variables
```bash
cp .env.example .env
nano .env
```

Required configurations:
```env
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
JWT_SECRET=your-secure-random-string
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-password
```

### 8. Initialize Database
```bash
npm run init-db
```

### 9. Install PM2 Process Manager
```bash
sudo npm install -g pm2
```

### 10. Create PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'co2-api',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/co2-api-error.log',
    out_file: '/var/log/pm2/co2-api-out.log'
  }]
};
```

### 11. Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 12. Install and Configure Nginx

Install Nginx:
```bash
sudo apt install -y nginx
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/co2-api
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/co2-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 13. Set Up SSL (Recommended)

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

### 14. Set Up Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Using the API

### 1. Get Authentication Token

```bash
curl -X POST http://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-admin-username","password":"your-admin-password"}'
```

### 2. Make API Requests

Example request to the simple calculate endpoint:
```bash
curl -X POST http://your-domain.com/simple-calculate \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "roof_area": 2000,
    "roof_division": {
      "Green Areas": 25,
      "Solar Power": 25,
      "Water Management": 25,
      "Social Impact": 25
    }
  }'
```

## Monitoring and Maintenance

### View Application Logs
```bash
# View PM2 logs
pm2 logs co2-api

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Update Application
```bash
cd /var/www/co2-api
git pull  # If using Git
npm install --production
pm2 reload co2-api
```

### Backup Database
```bash
# Create backup directory
sudo mkdir -p /var/backups/co2-api

# Backup database
cp /var/www/co2-api/database/data/co2calc.db /var/backups/co2-api/co2calc-$(date +%Y%m%d).db
```

### Security Best Practices

1. Keep system updated:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Monitor system resources:
```bash
htop  # Install with: sudo apt install htop
```

3. Check system logs:
```bash
sudo journalctl -u nginx
sudo journalctl -u pm2-root
```

4. Regular security audits:
```bash
# Install security scanner
sudo apt install -y lynis
# Run security audit
sudo lynis audit system
```

## Troubleshooting

1. If the API is not responding:
```bash
# Check if Node.js process is running
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check application logs
pm2 logs co2-api
```

2. If database errors occur:
```bash
# Check database permissions
ls -l /var/www/co2-api/database/data/

# Restore from backup if needed
cp /var/backups/co2-api/co2calc-backup.db /var/www/co2-api/database/data/co2calc.db
```

3. If SSL certificate issues occur:
```bash
# Test SSL configuration
sudo nginx -t

# Renew SSL certificate
sudo certbot renew --dry-run
```

## Support

For additional support:
1. Check the API documentation at `http://your-domain.com/api-docs`
2. Review application logs
3. Contact system administrator

Remember to replace `your-domain.com`, `your-admin-username`, and other placeholder values with your actual values.