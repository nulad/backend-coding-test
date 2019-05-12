'use strict';

exports.insert = (db, params) => {
    const result = new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params,
            function callback(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            }
        );
    });
    return result;
};

exports.get = (db, id) => {
    const result = new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM Rides WHERE rideID=${id}`,
            (err, rows) => {
                if (err) {
                    reject(err);
                }

                resolve(rows);
            }
        );
    });
    return result;
};

exports.getAll = (db, offset, limit) => {
    const result = new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM Rides LIMIT ?, ?',
            [offset, limit],
            (err, rows) => {
                if (err) {
                    reject(err);
                }

                resolve(rows);
            }
        );
    });
    return result;
};

exports.count = (db) => {
    const result = new Promise((resolve, reject) => {
        db.all(
            'SELECT count(*) AS count FROM Rides',
            (err, rows) => {
                if (err) {
                    reject(err);
                }

                resolve(rows[0].count);
            }
        );
    });
    return result;
};
