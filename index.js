'use strict';

const sqlite3 = require('sqlite3').verbose();

const port = 8010;
const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');
const Logger = require('./utils/logger');

db.serialize(() => {
    buildSchemas(db);

    const app = require('./src/app')(db);

    app.listen(port, () => Logger.info(`App started and listening on port ${port}`));
});
