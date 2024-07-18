import { hash } from '../../hash.mjs';
import { validateExitTicketGrade } from '../../validate_student.mjs';
import { sortParticipationGrades } from '../../participation_letters.mjs';

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

describe('sortParticipationGrades', () => {
    it("should return ['GRADES'] if input is 'RADEGS'", () => {
        const result = sortParticipationGrades('RADEGS');
        expect(result).toEqual(['GRADES']);
    });

    it("should return [] if input is ''", () => {
        const result = sortParticipationGrades('');
        expect(result).toEqual([]);
    });
});