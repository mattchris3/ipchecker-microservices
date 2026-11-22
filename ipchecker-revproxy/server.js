// Reverse proxy / API gateway for the IP Checker services.
//
// - Routing is config-driven: config.json maps a service name to one or more
//   upstream URLs, and is reloaded when the file changes (no restart needed).
// - Failover: each upstream is tried in order until one answers.
// - Discovery (/discover/services) and health checks (/health/:service).
// - Every proxied response carries X-Upstream (which instance answered) and
//   X-Upstream-Time (how long it took), so clients can see the path a request took.
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DEFAULT_TIMEOUT_MS = 5000;

function readConfig(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Tries each upstream in turn. Resolves with { response, url, ms } from the
 * first that answers, or throws with the list of failures.
 */
async function forward(urls, request, timeout) {
    const failures = [];
    for (const url of urls) {
        const started = Date.now();
        try {
            const response = await request(url, timeout);
            return { response, url, ms: Date.now() - started };
        } catch (error) {
            console.warn(`${url} failed (${error.message}), trying next`);
            failures.push({ url, error: error.message, status: error.response?.status });
        }
    }
    const error = new Error('All upstreams failed');
    error.failures = failures;
    throw error;
}

/** Builds the app. `getConfig` is called per request, so config reloads apply at once. */
function createApp(getConfig, { timeout = DEFAULT_TIMEOUT_MS } = {}) {
    const app = express();
    app.use(cors({ exposedHeaders: ['X-Upstream', 'X-Upstream-Time'] }));
    app.use(express.json());

    const upstreams = (name) => getConfig().services?.[name];

    const send = (res, { response, url, ms }) => {
        res.set('X-Upstream', url);
        res.set('X-Upstream-Time', String(ms));
        res.status(response.status).json(response.data);
    };

    const fail = (res, error) =>
        res.status(503).json({ error: true, message: 'All services failed', failures: error.failures ?? [] });

    app.get('/discover/services', (req, res) => {
        const services = Object.entries(getConfig().services ?? {}).map(([name, endpoints]) => ({
            name,
            endpoints,
            endpointCount: endpoints.length,
        }));
        res.json({ totalServices: services.length, services });
    });

    app.get('/health/:service', async (req, res) => {
        const urls = upstreams(req.params.service);
        if (!urls) return res.status(404).json({ error: true, message: 'Service not found' });

        const endpoints = await Promise.all(
            urls.map(async (url) => {
                const started = Date.now();
                try {
                    // The stateful store answers on /health; the others on / with a sample item.
                    const probe = req.params.service === 'stateful' ? `${url}health` : url;
                    await axios.get(probe, { params: { items: '127.0.0.1' }, timeout });
                    return { url, status: 'healthy', responseTime: `${Date.now() - started}ms` };
                } catch (error) {
                    return { url, status: 'unhealthy', error: error.message };
                }
            }),
        );
        res.json({ service: req.params.service, endpoints });
    });

    app.post('/stateful/save', async (req, res) => {
        const urls = upstreams('stateful');
        if (!urls) return res.status(404).json({ error: true, message: 'Stateful service not found' });
        try {
            send(res, await forward(urls, (url, t) => axios.post(`${url}save`, req.body, { timeout: t }), timeout));
        } catch (error) {
            fail(res, error);
        }
    });

    app.get('/stateful/load/:id', async (req, res) => {
        const urls = upstreams('stateful');
        if (!urls) return res.status(404).json({ error: true, message: 'Stateful service not found' });
        const id = encodeURIComponent(req.params.id);
        try {
            send(res, await forward(urls, (url, t) => axios.get(`${url}load/${id}`, { timeout: t }), timeout));
        } catch (error) {
            // A 404 from the store means "no such ID", not a failed service.
            if (error.failures?.some((f) => f.status === 404)) {
                return res.status(404).json({ error: true, message: 'No saved list with that ID' });
            }
            fail(res, error);
        }
    });

    app.get('/:service', async (req, res) => {
        const urls = upstreams(req.params.service);
        if (!urls) return res.status(404).json({ error: true, message: 'Service not found' });
        try {
            send(res, await forward(urls, (url, t) => axios.get(url, { params: req.query, timeout: t }), timeout));
        } catch (error) {
            fail(res, error);
        }
    });

    return app;
}

module.exports = { createApp, forward };

if (require.main === module) {
    const file = process.env.CONFIG_FILE || path.join(__dirname, 'config.json');
    let config = readConfig(file);
    fs.watchFile(file, () => {
        try {
            config = readConfig(file);
            console.log('Config reloaded');
        } catch (error) {
            console.error('Config reload failed, keeping the previous one:', error.message);
        }
    });

    const port = process.env.PORT || config.port || 3000;
    createApp(() => config).listen(port, () => console.log(`Reverse proxy listening on ${port}`));
}
