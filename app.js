const express = require('express');
const app = express();
require('./startup/logging')();
require('./startup/config')(app);
require('./startup/routes')(app);
/**
 * Server Activation
 */
const port = process.env.PORT || 8000;
if (process.env.NODE_ENV !== 'test')
    app.listen(port, () => console.log(`Listening on port ${port}...`));
module.exports = app;
/**
 * Server Deactivation
 */