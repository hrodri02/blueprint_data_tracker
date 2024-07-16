import { hash } from '../hash.mjs';

describe('hash', () => {
    it('should convert a string to a hex', () => {
        const result = hash('a');
        expect(result).toMatch(/^[a-fA-F0-9]+$/);
    });
});