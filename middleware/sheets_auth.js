module.exports = async function (req, res, next) {
    const permissions = req.session.user.sheets_permissions;
    if (permissions) {
        next();
        return;
    }
    res.send({error_message: 'You must give this app permissions to write to your google sheets.'});
}