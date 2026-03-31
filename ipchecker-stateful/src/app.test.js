const request = require('supertest');
const app = require('../src/app');
const fs = require('fs');
const path = require('path');

const TEST_DATA_FILE = path.join(__dirname, '../data/stored-ips.json');

describe('IP Checker Stateful Service', () => {
    beforeEach(() => {
        if (fs.existsSync(TEST_DATA_FILE)) {
            fs.writeFileSync(TEST_DATA_FILE, JSON.stringify({}), 'utf8');
        }
    });

    test('/health test coverage', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'ok',
            service: 'ipchecker-stateful'
        });
    });

    test('/save test coverage', async () => {
        const response = await request(app)
            .post('/save')
            .send({ items: '192.168.1.1,10.0.0.1' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.id).toBeDefined();
        expect(response.body.message).toBe('IP addresses saved successfully');
    });

    test('/load/:id test coverage', async () => {
        const saveResponse = await request(app)
            .post('/save')
            .send({ items: '172.16.0.1,192.168.0.1' });

        const id = saveResponse.body.id;

        const loadResponse = await request(app).get(`/load/${id}`);

        expect(loadResponse.status).toBe(200);
        expect(loadResponse.body.success).toBe(true);
        expect(loadResponse.body.items).toBe('172.16.0.1,192.168.0.1');
        expect(loadResponse.body.timestamp).toBeDefined();
    });
});