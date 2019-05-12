'use strict';

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const Joi = require('joi');
const swaggerDoc = require('../swagger.json');
const repo = require('./repo');

const app = express();
const jsonParser = bodyParser.json();

module.exports = (db) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

    app.get('/health', (req, res) => res.send('Healthy'));

    app.post('/rides', jsonParser, async (req, res) => {
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

        let response;
        let isError = false;
        const insertResult = await repo.insert(db, values)
            .catch((err) => {
                response = {
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown Error'
                };
                isError = true;
            });
        if (!isError) {
            const rows = await repo.get(db, insertResult.lastID)
                .catch((err) => {
                    response = {
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown Error'
                    };
                    isError = true;
                });
            response = rows;
        }

        return res.send(response);
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

        let response;
        let isError = false;
        const data = await repo.getAll(db, offset, limit)
            .catch((err) => {
                response = {
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown Error'
                };
                isError = true;
            });

        const count = await repo.count(db)
            .catch((err) => {
                response = {
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown Error'
                };
                isError = true;
            });

        if (!isError && count === 0) {
            return res.send({
                error_code: 'RIDES_NOT_FOUND_ERROR',
                message: 'Could not find any rides'
            });
        }

        if (!isError) {
            response = {
                data,
                meta: {
                    page,
                    limit,
                    total_data: count,
                    total_page: Math.ceil(count / limit)
                }
            };
        }
        return res.send(response);
    });

    app.get('/rides/:id', async (req, res) => {
        let response;
        let isError = false;
        const rows = await repo.get(db, req.params.id)
            .catch((err) => {
                response = {
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown Error'
                };
                isError = true;
            });

        if (!isError && rows.length === 0) {
            return res.send({
                error_code: 'RIDES_NOT_FOUND_ERROR',
                message: 'Could not find any rides'
            });
        }
        if (!isError) {
            [response] = rows;
        }
        return res.send(response);
    });

    return app;
};
