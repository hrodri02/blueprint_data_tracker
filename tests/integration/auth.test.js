const request = require('supertest');
let server;

describe('auth middleware', () => {
    beforeEach(() => { server = require('../../app'); });
    afterEach(() => { server.close(); });

    test('should return 401 if user is undefined', async () => {
        const res = await request(server).get('/students');
        expect(res.status).toBe(401);
    });
});