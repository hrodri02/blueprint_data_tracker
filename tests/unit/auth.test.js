const auth = require('../../middleware/auth');

describe('auth middleware', () => {
    it('should call next if user is defined', () => {
        const req = {session: {user: {name: 'Heriberto Rodriguez'}}};
        const next = jest.fn();
        const res = {};
        auth(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});