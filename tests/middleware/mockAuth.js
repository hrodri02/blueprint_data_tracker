function mockAuth(req, res, next) {
    req.session.user = {
        id: '113431031494705476915',
        email: 'hrodriguez1821@gmail.com',
        name: 'Heriberto Rodriguez'
    };
    next();
}

module.exports = mockAuth;