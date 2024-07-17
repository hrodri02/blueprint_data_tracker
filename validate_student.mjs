export function validateExitTicketGrade(value) {
    if (value < 0) throw new Error("Invalid: Exit Ticket grade must be an integer between 0 and 4.");
    if (value > 4) throw new Error("Invalid: Exit Ticket grade must be an integer between 0 and 4.");
}