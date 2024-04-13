module.exports = async function (req, res, next) {
    const user = req.session.user;
    if (user.sheets_permissions === 1) {
        next();
        return;
    }
    res.send({error_message: 'You must give this app permissions to write to your google sheets.'});
}