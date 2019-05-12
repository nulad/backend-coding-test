/* eslint-env mocha */

'use strict';

const request = require('supertest');
const sinon = require('sinon');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:');
const app = require('../src/app')(db);
const repo = require('../src/repo');
const buildSchemas = require('../src/schemas');
const Logger = require('../utils/logger');

describe('API tests', () => {
    let sandbox;
    before((done) => {
        db.serialize((err) => {
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            return done();
        });
    });

    beforeEach((done) => {
        sandbox = sinon.createSandbox();
        return done();
    })

    afterEach((done) => {
        sandbox.restore();
        return done();
    });

    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });

    describe('GET /rides empty', () => {
        it('should get empty rides', (done) => {
            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    const expected = {
                        error_code: 'RIDES_NOT_FOUND_ERROR',
                        message: 'Could not find any rides'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            const message = `incorrect assertion ${element}: ${expected[element]} - ${res.body[0][element]}`;
                            Logger.error(message);
                            throw new Error(message);
                        }
                    });
                    return true;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });

    describe('GET /rides/:id empty', () => {
        it('should get no ride', (done) => {
            request(app)
                .get('/rides/1')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    const expected = {
                        error_code: 'RIDES_NOT_FOUND_ERROR',
                        message: 'Could not find any rides'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            const message = `incorrect assertion ${element}: ${expected[element]} - ${res.body[element]}`;
                            Logger.error(message);
                            throw new Error(message);
                        }
                    });
                    return true;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });

    describe('POST /rides validation error', () => {
        it('should not create a new ride with incorrect Start Lat/Long ', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: -200,
                    start_long: 200,
                    end_lat: 0,
                    end_long: 1,
                    rider_name: 'joko',
                    driver_name: 'andi',
                    driver_vehicle: 'avanza'
                })
                .expect('Content-Type', /json/)
                .expect((res) => {
                    const expected = {
                        error_code: 'VALIDATION_ERROR',
                        message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            Logger.error(`incorrect assertion ${element}: ${expected[element]} - ${res.body[element]}`);
                            throw new Error();
                        }
                    });
                    return true;
                })
                .expect(200, done);
        });
        it('should not create a new ride with incorrect End Lat/Long ', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 1,
                    rider_name: 'joko',
                    driver_name: 'andi',
                    driver_vehicle: ''
                })
                .expect('Content-Type', /json/)
                .expect((res) => {
                    const expected = {
                        error_code: 'VALIDATION_ERROR',
                        message: 'Driver vehicle must be a non empty string'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            Logger.error(`incorrect assertion ${element}: ${expected[element]} - ${res.body[element]}`);
                            throw new Error();
                        }
                    });
                    return true;
                })
                .expect(200, done);
        });
        it('should not create a new ride with incorrect Rider name', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 200,
                    end_long: -200,
                    rider_name: 'joko',
                    driver_name: 'andi',
                    driver_vehicle: 'avanza'
                })
                .expect('Content-Type', /json/)
                .expect((res) => {
                    const expected = {
                        error_code: 'VALIDATION_ERROR',
                        message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            Logger.error(`incorrect assertion ${element}: ${expected[element]} - ${res.body[element]}`);
                            throw new Error();
                        }
                    });
                    return true;
                })
                .expect(200, done);
        });
        it('should not create a new ride with incorrect Driver name', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 1,
                    rider_name: '',
                    driver_name: 'andi',
                    driver_vehicle: 'avanza'
                })
                .expect('Content-Type', /json/)
                .expect((res) => {
                    const expected = {
                        error_code: 'VALIDATION_ERROR',
                        message: 'Rider name must be a non empty string'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            Logger.error(`incorrect assertion ${element}: ${expected[element]} - ${res.body[element]}`);
                            throw new Error();
                        }
                    });
                    return true;
                })
                .expect(200, done);
        });
        it('should not create a new ride with incorrect Driver vehicle', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 1,
                    rider_name: 'joko',
                    driver_name: '',
                    driver_vehicle: 'avanza'
                })
                .expect('Content-Type', /json/)
                .expect((res) => {
                    const expected = {
                        error_code: 'VALIDATION_ERROR',
                        message: 'Driver name must be a non empty string'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            Logger.error(`incorrect assertion ${element}: ${expected[element]} - ${res.body[element]}`);
                            throw new Error();
                        }
                    });
                    return true;
                })
                .expect(200, done);
        });
    });

    describe('POST /rides error', () => {
        it('should not create a new ride when there is error on insert', (done) => {
            sandbox.stub(repo, 'insert').rejects(new Error('test'));
            request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 1,
                    rider_name: 'joko',
                    driver_name: 'andi',
                    driver_vehicle: 'avanza'
                })
                .expect('Content-Type', /json/)
                .expect((res) => {
                    const expected = {
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown Error'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            Logger.error(`incorrect assertion ${element}: ${expected[element]} - ${res.body[0][element]}`);
                            throw new Error();
                        }
                    });
                    return true;
                })
                .expect(200, done);
        });
    });

    describe('POST /rides', () => {
        it('should create a new ride', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 1,
                    rider_name: 'joko',
                    driver_name: 'andi',
                    driver_vehicle: 'avanza'
                })
                .expect('Content-Type', /json/)
                .expect((res) => {
                    const expected = {
                        rideID: 1,
                        startLat: 0,
                        startLong: 0,
                        endLat: 0,
                        endLong: 1,
                        riderName: 'joko',
                        driverName: 'andi',
                        driverVehicle: 'avanza'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[0][element]) {
                            Logger.error(`incorrect assertion ${element}: ${expected[element]} - ${res.body[0][element]}`);
                            throw new Error();
                        }
                    });
                    return true;
                })
                .expect(200, done);
        });
    });

    describe('GET /rides error', () => {
        it('should not get all rides when there is error on getAll', (done) => {
            sandbox.stub(repo, 'getAll').rejects(new Error('test'));
            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    const expected = {
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown Error'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            Logger.error(`incorrect assertion ${element}: ${expected[element]} - ${res.body[element]}`);
                            throw new Error();
                        }
                    });
                    return true;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });

    describe('GET /rides/:id error', () => {
        it('should not get rides when there is error on get', (done) => {
            sandbox.stub(repo, 'get').rejects(new Error('test'));
            request(app)
                .get('/rides/1')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    const expected = {
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown Error'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            Logger.error(`incorrect assertion ${element}: ${expected[element]} - ${res.body[element]}`);
                            throw new Error();
                        }
                    });
                    return true;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });

    describe('GET /rides', () => {
        it('should get all rides', (done) => {
            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    const expected = {
                        data: [
                            {
                                rideID: 1,
                                startLat: 0,
                                startLong: 0,
                                endLat: 0,
                                endLong: 1,
                                riderName: 'joko',
                                driverName: 'andi',
                                driverVehicle: 'avanza'
                            }
                        ],
                        meta: {
                            page: 1,
                            limit: 10,
                            total_data: 1,
                            total_page: 1
                        }
                    };
                    if (res.body.data.length !== 1) {
                        const message = `incorrect assertion response length: ${1} - ${res.body.length}`;
                        Logger.error(message);
                        throw new Error(message);
                    }
                    Object.keys(expected).forEach((element) => {
                        if (expected.data[0][element] !== res.body.data[0][element]) {
                            const message = `incorrect assertion ${element}: ${expected[element]} - ${res.body[0][element]}`;
                            Logger.error(message);
                            throw new Error(message);
                        }
                    });
                    return true;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });

    describe('GET /rides/:id', () => {
        it('should get single ride', (done) => {
            request(app)
                .get('/rides/1')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    const expected = {
                        rideID: 1,
                        startLat: 0,
                        startLong: 0,
                        endLat: 0,
                        endLong: 1,
                        riderName: 'joko',
                        driverName: 'andi',
                        driverVehicle: 'avanza'
                    };
                    Object.keys(expected).forEach((element) => {
                        if (expected[element] !== res.body[element]) {
                            const message = `incorrect assertion ${element}: ${expected[element]} - ${res.body[element]}`;
                            Logger.error(message);
                            throw new Error(message);
                        }
                    });
                    return true;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });
});
