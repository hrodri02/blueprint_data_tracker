const request = require('supertest');
const db = require('../../db/database');
let server;

const TIME_IN_SECONDS = 15 * 1000
jest.setTimeout(TIME_IN_SECONDS)

describe('/students', () => {
    beforeAll(() => {
        server = require('../../app');
    });

    afterEach(() => { 
        db.deleteAllStudents();
    });

    describe('POST /', () => {
        test('should return 400 if the input is an invalid student', async () => {
            const res = await request(server)
                                .post('/students')
                                .send({
                                    name: 'Vo', 
                                    period: 1,
                                    sheets_row: 21,
                                    fellow_id: '113431031494705476915'
                                });
            expect(res.status).toBe(400);
        });

        test('should return student if the input is a valid student', async () => {
            const new_student = {
                name: 'Vongphrachanh, Makaiden', 
                period: 1,
                sheets_row: 21,
                fellow_id: '113431031494705476915'
            };
            const res = await request(server)
                                .post('/students')
                                .send(new_student);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject(new_student);
        })
    });

    describe('GET /', () => {
        test('should return two students in a two-dimensional array', async () => {
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

        test('should return two students in a two-dimensional array and each student is in a separate array', async () => {
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

    describe('GET /fellow', () => {
        test('should return only the students of the fellow that made the request', async () => {
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

            await db.insertStudentsForFellow([
                {
                    name: "Burton, So'Laya", 
                    period: 1,
                    sheets_row: 3,
                    fellow_id: '117317693270757170130'
                },
                {
                    name: 'Lopez-Macias, Camila',
                    period: 2,
                    sheets_row: 6,
                    fellow_id: '117317693270757170130'
                }
            ]);

            const res = await request(server).get('/students/fellow');
            expect(res.status).toBe(200);
            expect(res.body[0].length).toBe(2);
            expect(res.body[0].some(s => s.name === 'Hammond, Braylani')).toBeTruthy();
            expect(res.body[0].some(s => s.name === 'Vongphrachanh, Makaiden')).toBeTruthy();
            expect(res.body[0].some(s => s.name === "Burton, So'Laya")).toBeFalsy();
            expect(res.body[0].some(s => s.name === 'Lopez-Macias, Camila')).toBeFalsy();
        });
    });

    describe('PATCH /:id', () => {
        test('should return 404 if the student id is invalid', async () => {
            const res = await request(server).patch('/students/1');
            expect(res.status).toBe(404);
        });

        test('should return 400 if the input is an invalid student', async () => {
            const student = await db.insertStudentForFellow({
                name: 'Vongphrachanh, Makaiden', 
                period: 1,
                sheets_row: 21,
                fellow_id: '113431031494705476915'
            });

            const res = await request(server)
                                .patch('/students/' + student.id)
                                .send({
                                    name: 'Vo',
                                });
            expect(res.status).toBe(400);
        });

        test('should return student if the input is a valid change', async () => {
            const student = await db.insertStudentForFellow({
                name: 'Vongphrachanh, Makaiden', 
                period: 1,
                sheets_row: 21,
                fellow_id: '113431031494705476915'
            });

            const res = await request(server)
                                .patch('/students/' + student.id)
                                .send({
                                    period: 2,
                                });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('period', 2);
        });
    });

    describe('DELETE /:id', () => {
        test('should return 404 if the student id is invalid', async () => {
            const res = await request(server).delete('/students/1');
            expect(res.status).toBe(404);
        });

        test('should return the deleted student if the studend id is valid', async () => {
            const student = await db.insertStudentForFellow({
                name: 'Vongphrachanh, Makaiden', 
                period: 1,
                sheets_row: 21,
                fellow_id: '113431031494705476915'
            });

            const res = await request(server).delete('/students/' + student.id);
                                
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject(student);
        });
    });

    describe('POST /dailydata', () => {
        test('should return 400 if the daily data is invalid', async () => {
            const dailyData = {'values': [[['Present'], [-1], ['gra']], [['Present'], [0], ['grADe']]]};
            const res = await request(server).post('/students/dailydata').send(dailyData);
            expect(res.status).toBe(400);
        });

        test('should update the spreadsheet if the daily data is valid', async() => {
            const dailyData = {
                'ranges': ['IT15:IT17'],
                'values': [[['Present'], [2], ['GRADES']]],
            };
            const res = await request(server).post('/students/dailydata').send(dailyData);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            dailyData['values'][0][1] = [dailyData['values'][0][1].toString()];
            expect(res.body[0].updatedData.values).toMatchObject(dailyData['values'][0]);
        });
    });
});