class Student
{
    constructor(id, first_name, last_name, period, row) {
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.period = period;
        this.grades = []
        // this is the row where the student first appears on the data tracker
        this.row = row;
    }
}

module.exports = Student;