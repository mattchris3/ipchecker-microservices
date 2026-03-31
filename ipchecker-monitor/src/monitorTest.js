const axios = require('axios');

const PROXY_URL = 'http://revproxy:3000';

async function testService(serviceName, testData) {
    const startTime = Date.now();
    
    try {
        const response = await axios.get(`${PROXY_URL}/${serviceName}`, {
            params: { items: testData.items },
            timeout: 10000
        });
        
        const responseTime = Date.now() - startTime;
        
        return {
            service: serviceName,
            status: 'success',
            responseTime: `${responseTime}ms`,
            testData: testData.items,
            response: response.data,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        return {
            service: serviceName,
            status: 'failed',
            responseTime: `${responseTime}ms`,
            testData: testData.items,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

async function testAllServices(testData) {
    const services = ['totalIPs', 'totalEmptyIPs', 'validip', 'classifyip', 'badip', 'infoip'];
    const results = [];
    
    for (const service of services) {
        console.log(`Testing ${service}...`);
        const result = await testService(service, testData);
        results.push(result);
    }
    
    return results;
}

module.exports = { testService, testAllServices };
