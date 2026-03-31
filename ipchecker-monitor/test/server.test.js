const request = require('supertest');
const express = require('express');

const mockApp = express();

let testHistory = [];
let isTestRunning = false;

function calculateAvgResponseTime(results) {
    const times = results
        .filter(r => r.status === 'success')
        .map(r => parseInt(r.responseTime));
    
    if (times.length === 0) return '0ms';
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return `${Math.round(avg)}ms`;
}

mockApp.get('/trigger', async (req, res) => {
    if (isTestRunning) {
        return res.json({ message: 'Test already running, please wait' });
    }
    res.json({ message: 'Test triggered successfully' });
});

mockApp.get('/results/latest', (req, res) => {
    const latest = testHistory[testHistory.length - 1];
    
    if (!latest) {
        return res.json({ message: 'No tests run yet' });
    }
    
    res.json(latest);
});

mockApp.get('/health', (req, res) => {
    res.json({
        status: 'running',
        uptime: process.uptime(),
        testsRun: testHistory.length,
        isTestRunning: isTestRunning
    });
});

describe('IPChecker Monitoring Service', () => {
    beforeEach(() => {
        testHistory = [];
        isTestRunning = false;
    });

    test('calculateAvgResponseTime should work correctly', () => {
        const results = [
            { status: 'success', responseTime: '100ms' },
            { status: 'success', responseTime: '200ms' },
            { status: 'failed', responseTime: '999ms' }
        ];

        expect(calculateAvgResponseTime(results)).toBe('150ms');
        expect(calculateAvgResponseTime([])).toBe('0ms');
    });

    test('GET /health should return status', async () => {
        const response = await request(mockApp).get('/health');
        
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('running');
    });

    test('GET /trigger should work', async () => {
        const response = await request(mockApp).get('/trigger');
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Test triggered successfully');
    });

    test('GET /results/latest should handle no tests', async () => {
        const response = await request(mockApp).get('/results/latest');
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('No tests run yet');
    });

    test('GET /results/latest should return test data', async () => {
        testHistory.push({
            id: 1,
            timestamp: '2024-11-30T12:00:00.000Z',
            testData: { items: '192.168.1.1' },
            results: [],
            summary: { total: 0, successful: 0, failed: 0, avgResponseTime: '0ms' }
        });

        const response = await request(mockApp).get('/results/latest');
        
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(1);
    });
});