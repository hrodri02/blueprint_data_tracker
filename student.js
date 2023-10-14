class Student
{
    constructor(id, first_name, last_name, period) {
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.period = period;
        this.grades = []
        // this is the row where the student first appears on the data tracker
        this.row = -1;
    }
}

const students = [
    // 1st period
    [
        new Student(0, "Joseph", "Logwood", 1),
        new Student(1, "Makaiden", "Vongphrachanh", 1),
        new Student(2, "Braylani", "Hammond", 1),
    ],
    // 2nd period
    [
        new Student(3, "Navie", "Davis", 2),
        new Student(4, "Prince", "Leggett", 2),
        new Student(5, "Jay'Lon", "Andrades", 2)
    ],
    // 3rd period
    [
        new Student(6, "Alexandra", "Covian Perez", 3),
        new Student(7, "Emeri", "Hewitt", 3),
        new Student(8, "Brian", "Cisneros", 3),
        new Student(9, "Himelda", "Ahilon-Pablo", 3),
    ],
    // 4th period
    [
        new Student(10, "David", "Hernandez", 4),
        new Student(11, "Juliana", "Ignacio Tinajero", 4),
        new Student(12, "Roselyn", "Sanchez-Flores", 4),
    ],
    // 6th period
    [
        new Student(13, "Luis", "Chang Chilel", 6),
        new Student(14, "Caleb", "Pablo", 6),
        new Student(15, "Alex", "Pablo Ramirez", 6),
        new Student(16, "Lawrence", "Ward", 6),
    ],
    // 7th period
    [
        new Student(17, "Arodi", "Granados Funes", 6),
        new Student(18, "John", "Martin-Garcia", 6),
        new Student(19, "Elmer", "Calmo Carrillo", 6),
        new Student(20, "Khloe", "Pierce", 6),
    ]
]

module.exports = students;