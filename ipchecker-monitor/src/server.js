const express = require('express');
const cron = require('node-cron');
const { generateTestData } = require('./testGenerator');
const { testAllServices } = require('./monitorTest');

const app = express();
const PORT = 4000;

let testHistory = [];
let isTestRunning = false;

async function monitorTest() {
    if (isTestRunning) {
        console.log('Test already running, skipping...');
        return;
    }
    
    isTestRunning = true;
    console.log('Startng test...');
    console.log('Time:', new Date().toISOString());
    
    const testData = generateTestData();
    console.log('Generated test data:', testData.items);
    
    const results = await testAllServices(testData);
    
    const testRun = {
        id: testHistory.length + 1,
        timestamp: new Date().toISOString(),
        testData: testData,
        results: results,
        summary: {
            total: results.length,
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'failed').length,
            avgResponseTime: calculateAvgResponseTime(results)
        }
    };
    
    testHistory.push(testRun);
    
    if (testHistory.length > 50) {
        testHistory = testHistory.slice(-50);
    }
    
    console.log('Test Summary:', testRun.summary);
    
    isTestRunning = false;
}

function calculateAvgResponseTime(results) {
    const times = results
        .filter(r => r.status === 'success')
        .map(r => parseInt(r.responseTime));
    
    if (times.length === 0) return '0ms';
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return `${Math.round(avg)}ms`;
}

app.get('/trigger', async (req, res) => {
    console.log('Manual test triggered via API');
    
    if (isTestRunning) {
        return res.json({ message: 'Test already running, please wait' });
    }
    
    monitorTest();
    res.json({ message: 'Test triggered successfully' });
});

app.get('/results/latest', (req, res) => {
    const latest = testHistory[testHistory.length - 1];
    
    if (!latest) {
        return res.json({ message: 'No tests run yet' });
    }
    
    res.json(latest);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        uptime: process.uptime(),
        testsRun: testHistory.length,
        isTestRunning: isTestRunning
    });
});

// First check shortly after start (initial run), so results exist straight away.
setTimeout(monitorTest, 15000).unref();

cron.schedule('*/5 * * * *', () => {
    console.log('Scheduled test triggered (every 5 minutes)');
    monitorTest();
});

app.listen(PORT, () => {
    console.log(`Monitoring test running on port ${PORT}`);
    console.log('Scheduled tests run every 5 minutes');
    console.log('Endpoints available: \n');
    console.log(`  - GET /trigger\n`);
    console.log(`  - GET /results/latest\n`);
    console.log(`  - GET /health\n`);
    
    monitorTest();
});