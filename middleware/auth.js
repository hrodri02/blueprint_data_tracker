module.exports = function (req, res, next) {
    const user = req.session.user;
    if (user) {
        next();
        return;
    }

    res.status(401).send({error: 'Not Authorized'});
}