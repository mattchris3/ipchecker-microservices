const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

let config = {};

function loadConfig() {
    const data = fs.readFileSync('config.json', 'utf8');
    config = JSON.parse(data);
}

loadConfig();

fs.watchFile('config.json', (curr, prev) => {
    console.log('Config file changed, reloading...');
    loadConfig();
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/discover/services', (req, res) => {
    const availableServices = Object.keys(config.services).map(serviceName => ({
        name: serviceName,
        endpoints: config.services[serviceName],
        endpointCount: config.services[serviceName].length
    }));
    
    res.json({
        totalServices: availableServices.length,
        services: availableServices
    });
});

app.get('/health/:service', async (req, res) => {
    const serviceName = req.params.service;
    
    if (!config.services[serviceName]) {
        return res.status(404).json({ error: true, message: 'Service not found' });
    }
    
    const serviceUrls = config.services[serviceName];
    const healthStatus = [];
    
    for (const url of serviceUrls) {
        try {
            const start = Date.now();
            await axios.get(url + '?items=test', { timeout: 5000 });
            const responseTime = Date.now() - start;
            
            healthStatus.push({
                url: url,
                status: 'healthy',
                responseTime: `${responseTime}ms`
            });
        } catch (error) {
            healthStatus.push({
                url: url,
                status: 'unhealthy',
                error: error.message
            });
        }
    }
    
    res.json({
        service: serviceName,
        endpoints: healthStatus
    });
});

app.get('/:service', async (req, res) => {
    const serviceName = req.params.service;
    const queryParams = req.query;

    if (!config.services[serviceName]) {
        return res.status(404).json({ error: true, message: 'Service not found' });
    }

    const urls = config.services[serviceName];
    
    for (let i = 0; i < urls.length; i++) {
        try {
            const url = urls[i];
            console.log(`Forwarding ${serviceName} to ${url}`);
            
            const response = await axios.get(url, { params: queryParams });
            return res.json(response.data);
        } catch (error) {
            console.log(`${urls[i]} failed to respond, trying next`);
            if (i === urls.length - 1) {
                return res.status(503).json({ error: true, message: 'All services failed' });
            }
        }
    }
});

app.post('/stateful/save', async (req, res) => {
    const bodyData = req.body;

    if (!config.services.stateful) {
        return res.status(404).json({ error: true, message: 'Stateful service not found' });
    }

    const urls = config.services.stateful;
    
    for (let i = 0; i < urls.length; i++) {
        try {
            const url = urls[i] + 'save';
            console.log(`Forwarding POST to ${url}`);
            
            const response = await axios.post(url, bodyData);
            return res.json(response.data);
        } catch (error) {
            console.log(`${urls[i]} failed to respond, trying next`);
            if (i === urls.length - 1) {
                return res.status(503).json({ error: true, message: 'All services failed' });
            }
        }
    }
});

app.get('/stateful/load/:id', async (req, res) => {
    const id = req.params.id;

    if (!config.services.stateful) {
        return res.status(404).json({ error: true, message: 'Stateful service not found' });
    }

    const urls = config.services.stateful;
    
    for (let i = 0; i < urls.length; i++) {
        try {
            const url = urls[i] + 'load/' + id;
            console.log(`Forwarding GET to ${url}`);
            
            const response = await axios.get(url);
            return res.json(response.data);
        } catch (error) {
            console.log(`${urls[i]} failed to respond, trying next`);
            if (i === urls.length - 1) {
                return res.status(503).json({ error: true, message: 'All services failed' });
            }
        }
    }
});

const PORT = config.port || 3000;
app.listen(PORT, () => {
    console.log(`Reverse Proxy running on port ${PORT}`);
});