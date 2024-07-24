const request = require('supertest');
let server;

describe('auth middleware', () => {
    beforeAll(() => { server = require('../../app'); });
    test('should return 401 if user is undefined', async () => {
        const res = await request(server).get('/students');
        expect(res.status).toBe(401);
    });
});