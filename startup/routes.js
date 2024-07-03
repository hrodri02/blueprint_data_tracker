const {google} = require('../routes/google');
const home = require('../routes/home');
const students = require('../routes/students');
const users = require('../routes/users');
const error = require('../middleware/error')

module.exports = function(app) {
    app.use('/', home);
    app.use('/students', students);
    app.use('/users', users);
    app.use('/google', google);
    app.use(error);
}