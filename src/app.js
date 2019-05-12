'use strict';

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const Joi = require('joi');
const swaggerDoc = require('../swagger.json');

const app = express();
const jsonParser = bodyParser.json();

module.exports = (db) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

    app.get('/health', (req, res) => res.send('Healthy'));

    app.post('/rides', jsonParser, (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (typeof riderName !== 'string' || riderName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverName !== 'string' || driverName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver name must be a non empty string'
            });
        }

        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver vehicle must be a non empty string'
            });
        }

        const values = [
            req.body.start_lat,
            req.body.start_long,
            req.body.end_lat,
            req.body.end_long,
            req.body.rider_name,
            req.body.driver_name,
            req.body.driver_vehicle
        ];

        const result = db.run(
            'INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)',
            values,
            function callback(err) {
                if (err) {
                    return res.send({
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    });
                }

                return db.all(
                    'SELECT * FROM Rides WHERE rideID = ?',
                    this.lastID,
                    (error, rows) => {
                        if (error) {
                            return res.send({
                                error_code: 'SERVER_ERROR',
                                message: 'Unknown error'
                            });
                        }

                        return res.send(rows);
                    }
                );
            }
        );
        return result;
    });

    app.get('/rides', async (req, res) => {
        const ridesSchema = Joi.object().keys({
            page: Joi.number().positive().optional().default(1),
            limit: Joi.number().positive().optional().default(10)
        });

        const input = Joi.validate(req.query, ridesSchema);
        if (input.error) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: input.error.message
            });
        }
        const {
            page,
            limit
        } = input.value;
        const offset = (page - 1) * limit;

        const params = [
            offset,
            limit
        ];

        db.all(
            'SELECT * FROM Rides LIMIT ?, ?',
            params,
            (err, rows) => {
                if (err) {
                    return res.send({
                        error_code: 'SERVER_ERROR',
                        message: err.message
                    });
                }

                if (rows.length === 0) {
                    return res.send({
                        error_code: 'RIDES_NOT_FOUND_ERROR',
                        message: 'Could not find any rides'
                    });
                }

                db.all(
                    'SELECT count(*) AS count FROM Rides',
                    (err2, result) => {
                        if (err2) {
                            return res.send({
                                error_code: 'SERVER_ERROR',
                                message: err2.message
                            });
                        }

                        return res.send({
                            data: rows,
                            meta: {
                                page,
                                limit,
                                total_data: result[0].count,
                                total_page: Math.ceil(result[0].count / limit)
                            }
                        });
                    }
                );
                return true;
            }
        );
        return true;
    });

    app.get('/rides/:id', (req, res) => {
        db.all(
            `SELECT * FROM Rides WHERE rideID='${req.params.id}'`,
            (err, rows) => {
                if (err) {
                    return res.send({
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    });
                }

                if (rows.length === 0) {
                    return res.send({
                        error_code: 'RIDES_NOT_FOUND_ERROR',
                        message: 'Could not find any rides'
                    });
                }

                return res.send(rows[0]);
            }
        );
    });

    return app;
};
