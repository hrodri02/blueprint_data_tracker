import { hash } from '../hash.mjs';
import { validateExitTicketGrade } from '../validate_student.mjs';

describe('hash', () => {
    it('should convert a string to a hex', () => {
        const result = hash('a');
        expect(result).toMatch(/^[a-fA-F0-9]+$/);
    });
});

describe('validateExitTicketGrade', () => {
    it('should throw an error if the value is less than 0', () => {
        expect(() => validateExitTicketGrade(-1)).toThrow();
    });

    it('should throw an error if the value is greater than 4', () => {
        expect(() => validateExitTicketGrade(5)).toThrow();
    });
});