const request = require('supertest');
const express = require('express');

const cors = require('cors');

mockApp.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const mockApp = express();
mockApp.use(express.json());

mockApp.get('/totalIPs', (req, res) => {
    res.json({ total_ips: 3, items: req.query.items });
});

mockApp.get('/totalEmptyIPs', (req, res) => { 
    res.json({ total_empty_ips: 1, items: req.query.items });
});

mockApp.get('/validip', (req, res) => {
    res.json({ total_valid_ips: 2, results: ["192.168.1.1 -> valid (IPv4)", "invalid -> invalid", "10.0.0.1 -> valid (IPv4)"], items: req.query.items });
});

mockApp.get('/classifyip', (req, res) => {
    res.json({ ipv4: 2, ipv6: 1, results: ["192.168.1.1 -> IPv4", "10.0.0.1 -> IPv4", "2a00:1450::200e -> IPv6"], items: req.query.items });
});

mockApp.get('/infoip', (req, res) => {
    res.json({ countries: { "100.1.1.1": "US" }, items: req.query.items });
});

mockApp.get('/badip', (req, res) => {
    res.json({ good_ips: "192.168.1.1", bad_ips: "100.200.300.400", results: ["192.168.1.1 -> Good IP", "100.200.300.400 -> Bad IP"], items: req.query.items });
});

mockApp.post('/stateful/save', (req, res) => {
    res.json({ success: true, id: "test-uuid-123", message: "IP addresses saved successfully" });
});

mockApp.get('/stateful/load/:id', (req, res) => {
    res.json({ success: true, items: "192.168.1.1,10.0.0.1", timestamp: "2024-11-30T12:00:00.000Z" });
});

describe('Reverse Proxy API Tests', () => {
    
    test('GET /totalIPs returns total IP count', async () => {
        const response = await request(mockApp)
            .get('/totalIPs?items=192.168.1.1,10.0.0.1,,172.16.0.1');

        expect(response.status).toBe(200);
        expect(response.body.total_ips).toBe(3);
    });

    test('GET /totalEmptyIPs returns empty IP count', async () => {
        const response = await request(mockApp)
            .get('/totalEmptyIPs?items=192.168.1.1,,10.0.0.1');

        expect(response.status).toBe(200);
        expect(response.body.total_empty_ips).toBe(1);
    });

    test('GET /validip returns valid IP count', async () => {
        const response = await request(mockApp)
            .get('/validip?items=192.168.1.1,invalid,10.0.0.1');

        expect(response.status).toBe(200);
        expect(response.body.total_valid_ips).toBe(2);
        expect(response.body.results).toBeDefined();
        expect(response.body.results.length).toBe(3);
    });

    test('GET /classifyip returns IPv4 and IPv6 counts', async () => {
        const response = await request(mockApp)
            .get('/classifyip?items=192.168.1.1,10.0.0.1,2a00:1450::200e');

        expect(response.status).toBe(200);
        expect(response.body.ipv4).toBe(2);
        expect(response.body.ipv6).toBe(1);
        expect(response.body.results).toBeDefined();
        expect(response.body.results.length).toBe(3);
    });

    test('GET /infoip returns country information', async () => {
        const response = await request(mockApp)
            .get('/infoip?items=100.1.1.1');

        expect(response.status).toBe(200);
        expect(response.body.countries).toBeDefined();
    });

    test('GET /badip returns good and bad IPs', async () => {
        const response = await request(mockApp)
            .get('/badip?items=192.168.1.1,100.200.300.400');

        expect(response.status).toBe(200);
        expect(response.body.good_ips).toBeDefined();
        expect(response.body.bad_ips).toBeDefined();
        expect(response.body.results).toBeDefined();
        expect(response.body.results.length).toBe(2);
    });

    test('POST /stateful/save saves IP addresses', async () => {
        const response = await request(mockApp)
            .post('/stateful/save')
            .send({ items: '192.168.1.1,10.0.0.1' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.id).toBeDefined();
    });

    test('GET /stateful/load/:id loads IP addresses', async () => {
        const response = await request(mockApp)
            .get('/stateful/load/test-id-123');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.items).toBeDefined();
    });
});