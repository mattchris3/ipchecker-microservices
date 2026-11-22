// Tests the real proxy against small fake upstream services on random ports.
const express = require('express');
const request = require('supertest');
const { createApp } = require('../server');

const servers = [];

/** Starts a fake service; resolves with its base URL (ending in "/"). */
function upstream(setup) {
    const app = express();
    app.use(express.json());
    setup(app);
    return new Promise((resolve) => {
        const server = app.listen(0, '127.0.0.1', () => {
            servers.push(server);
            resolve(`http://127.0.0.1:${server.address().port}/`);
        });
    });
}

// Nothing listens on port 9 (discard), so connections are refused straight away.
const DEAD = 'http://127.0.0.1:9/';

let config;
let app;

beforeAll(async () => {
    const counter = await upstream((a) =>
        a.get('/', (req, res) =>
            res.json({ error: false, items: req.query.items, total_ips: req.query.items.split(',').length }),
        ),
    );
    const store = await upstream((a) => {
        const saved = {};
        a.get('/health', (req, res) => res.json({ status: 'ok' }));
        a.post('/save', (req, res) => {
            saved.abc = req.body.items;
            res.json({ success: true, id: 'abc' });
        });
        a.get('/load/:id', (req, res) =>
            saved[req.params.id]
                ? res.json({ success: true, items: saved[req.params.id] })
                : res.status(404).json({ success: false }),
        );
    });

    config = {
        services: {
            totalIPs: [counter],
            withFailover: [DEAD, counter],
            allDown: [DEAD],
            stateful: [store],
        },
    };
    app = createApp(() => config, { timeout: 1000 });
});

afterAll(() => Promise.all(servers.map((s) => new Promise((r) => s.close(r)))));

describe('routing', () => {
    test('forwards the query to the service and returns its answer', async () => {
        const res = await request(app).get('/totalIPs').query({ items: '1.1.1.1,8.8.8.8' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ error: false, items: '1.1.1.1,8.8.8.8', total_ips: 2 });
    });

    test('reports which upstream answered and how long it took', async () => {
        const res = await request(app).get('/totalIPs').query({ items: '1.1.1.1' });
        expect(res.headers['x-upstream']).toBe(config.services.totalIPs[0]);
        expect(Number(res.headers['x-upstream-time'])).toBeGreaterThanOrEqual(0);
    });

    test('unknown services are a 404', async () => {
        const res = await request(app).get('/nope');
        expect(res.status).toBe(404);
    });
});

describe('failover', () => {
    test('skips a dead upstream and uses the next one', async () => {
        const res = await request(app).get('/withFailover').query({ items: '1.1.1.1' });
        expect(res.status).toBe(200);
        expect(res.headers['x-upstream']).toBe(config.services.withFailover[1]);
    });

    test('returns 503 with the failures when every upstream is down', async () => {
        const res = await request(app).get('/allDown').query({ items: '1.1.1.1' });
        expect(res.status).toBe(503);
        expect(res.body.failures).toHaveLength(1);
        expect(res.body.failures[0].url).toBe(DEAD);
    });
});

describe('discovery and health', () => {
    test('lists the configured services', async () => {
        const res = await request(app).get('/discover/services');
        expect(res.body.totalServices).toBe(4);
        expect(res.body.services.map((s) => s.name)).toContain('withFailover');
    });

    test('checks every endpoint of a service', async () => {
        const res = await request(app).get('/health/withFailover');
        expect(res.body.endpoints.map((e) => e.status)).toEqual(['unhealthy', 'healthy']);
    });

    test('checks the stateful store on its health endpoint', async () => {
        const res = await request(app).get('/health/stateful');
        expect(res.body.endpoints[0].status).toBe('healthy');
    });

    test('picks up config changes without a restart', async () => {
        config.services.added = config.services.totalIPs;
        const res = await request(app).get('/added').query({ items: '1.1.1.1' });
        expect(res.status).toBe(200);
        delete config.services.added;
    });
});

describe('stateful store', () => {
    test('saves and loads a list', async () => {
        const saved = await request(app).post('/stateful/save').send({ items: '1.1.1.1,8.8.8.8' });
        expect(saved.body).toEqual({ success: true, id: 'abc' });
        const loaded = await request(app).get('/stateful/load/abc');
        expect(loaded.body.items).toBe('1.1.1.1,8.8.8.8');
    });

    test('an unknown ID is a 404, not a failed service', async () => {
        const res = await request(app).get('/stateful/load/missing');
        expect(res.status).toBe(404);
    });
});
