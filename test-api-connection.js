// Simple API connection test script
// Run this with: node test-api-connection.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080';

// Test endpoints
const endpoints = [
    { method: 'GET', path: '/api/products', description: 'Get all products' },
    { method: 'GET', path: '/api/products/categories', description: 'Get product categories' },
    { method: 'GET', path: '/api/products/in-stock', description: 'Get in-stock products' },
    { method: 'GET', path: '/api/admin/stats', description: 'Get admin stats (requires auth)' },
    { method: 'GET', path: '/api/orders/today', description: 'Get today\'s orders (requires auth)' },
    { method: 'GET', path: '/api/bookings/stats', description: 'Get booking stats (requires auth)' },
];

async function testEndpoint(endpoint) {
    try {
        const response = await axios({
            method: endpoint.method,
            url: `${API_BASE_URL}${endpoint.path}`,
            timeout: 5000
        });
        
        console.log(`✅ ${endpoint.description}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
        console.log('');
        
        return { success: true, status: response.status };
    } catch (error) {
        console.log(`❌ ${endpoint.description}`);
        console.log(`   Error: ${error.message}`);
        
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.code === 'ECONNREFUSED') {
            console.log('   Connection refused - backend may not be running');
        }
        
        console.log('');
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🧪 Testing Coffee-Beat API Connection');
    console.log('=====================================\n');
    
    let successCount = 0;
    
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        if (result.success) successCount++;
    }
    
    console.log(`\n📊 Test Results: ${successCount}/${endpoints.length} endpoints responding`);
    
    if (successCount === endpoints.length) {
        console.log('🎉 All endpoints are working correctly!');
    } else {
        console.log('⚠️  Some endpoints are not responding. Check if the backend is running.');
    }
}

// Check if backend is running first
async function checkBackendHealth() {
    try {
        await axios.get(`${API_BASE_URL}/actuator/health`, { timeout: 3000 });
        return true;
    } catch (error) {
        console.log('❌ Backend health check failed');
        console.log('   Make sure the Spring Boot application is running on port 8080');
        console.log('   Run: cd backend && mvn spring-boot:run\n');
        return false;
    }
}

async function main() {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
        await runTests();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testEndpoint, runTests, checkBackendHealth };
