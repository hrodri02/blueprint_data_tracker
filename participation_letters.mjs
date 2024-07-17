export function sortParticipationGrades(student_letters) {
    const letters = ['G', 'R', 'A', 'D', 'E', 'S'];
    const grades = letters.reduce((str, letter) => {
        if (student_letters.includes(letter)) {
            return str + letter;
        }
        return str;
    }, "");

    return (grades === "")? [] : [grades];
}