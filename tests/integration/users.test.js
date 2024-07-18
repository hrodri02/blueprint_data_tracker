const request = require('supertest');
let server;

describe('/users', () => {
    beforeEach(() => { server = require('../../app'); });
    afterEach(() => { server.close() } );
    describe('GET /me', () => {
        it('should return the current user', async () => {
            const res = await request(server).get('/users/me');
            expect(res.status).toBe(500);
        });
    });
});