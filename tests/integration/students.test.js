const request = require('supertest');
const db = require('../../db/database');

describe('/students', () => {
    let server;
    beforeEach(() => { 
        server = require('../../app');
    });
    afterEach(() => { 
        server.close();
        db.deleteAllStudents();
    });
    describe('GET /', () => {
        it('should return two students in a two-dimensional array', async () => {
            await db.insertStudentsForFellow([
                {
                    name: 'Vongphrachanh, Makaiden', 
                    period: 1,
                    sheets_row: 21,
                    fellow_id: '113431031494705476915'
                },
                {
                    name: 'Hammond, Braylani',
                    period: 1,
                    sheets_row: 15,
                    fellow_id: '113431031494705476915'
                }
            ]);

            const res = await request(server)
                                .get('/students');
            expect(res.status).toBe(200);
            expect(res.body[0].length).toBe(2);
            expect(res.body[0].some(s => s.name === 'Hammond, Braylani')).toBeTruthy();
            expect(res.body[0].some(s => s.name === 'Vongphrachanh, Makaiden')).toBeTruthy();
        });

        it('should return two students in a two-dimensional array and each student is in a separate array', async () => {
            await db.insertStudentsForFellow([
                {
                    name: "Burton, So'Laya", 
                    period: 1,
                    sheets_row: 3,
                    fellow_id: '113431031494705476915'
                },
                {
                    name: 'Lopez-Macias, Camila',
                    period: 2,
                    sheets_row: 6,
                    fellow_id: '113431031494705476915'
                }
            ]);

            const res = await request(server)
                                .get('/students');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0].length).toBe(1);
            expect(res.body[1].length).toBe(1);
            expect(res.body[1].some(s => s.name === 'Lopez-Macias, Camila')).toBeTruthy();
            expect(res.body[0].some(s => s.name === "Burton, So'Laya")).toBeTruthy();
        });
    });
});