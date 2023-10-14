const periodStrings = ["First", "Second", "Third", "Fourth", "Sixth", "Seventh"];
const classNames = ["doNow", "numberTalk", "launch", "engage", "summary", "exitTicket"];
const backgroundColors = ["blue", "orange", "yellow", "green", "lightblue", "red"];
const textColors = ["", "black", "black", "", "black", ""];
// const timesInMS = [5*60000, 8*60000, 5*60000, 15*60000, 5*60000, 5*60000];
const timesInMS = [5*1000, 8*1000, 5*1000, 15*1000, 5*1000, 5*1000];
const numLessonParts = 6;

const lessonTimerLabel = document.getElementById("timerLabel");
const hallpassTimerLabel = document.getElementById("hallpassTimerLabel");
let lessonTimerId = null;
let hallpassTimerId = null;

function setupLessonTimer() {
    lessonTimerLabel.style.background = backgroundColors[0];
    lessonTimerLabel.style.color = textColors[0];
    const timeInMS = timesInMS[0];
    const mins = parseInt(timeInMS / 60000);
    const secs = (timeInMS - mins * 60000) / 1000;
    const secsString = (secs < 10) ? "0" + secs.toString() : secs.toString();
    lessonTimerLabel.innerText = `${mins}:${secsString}`;
}

function setupHallpassTimer() {
    const timeInMS = 15*60000;
    const mins = parseInt(timeInMS / 60000);
    const secs = (timeInMS - mins * 60000) / 1000;
    const secsString = (secs < 10) ? "0" + secs.toString() : secs.toString();
    hallpassTimerLabel.innerText = `${mins}:${secsString}`;
}

function startButtonClicked() {
    startLessonTimer();
    startHallpassTimer();
    lessonTimerLabel.style.pointerEvents = "none";
}

function startLessonTimer() {
    // document.getElementsByClassName(classNames[0])[0].scrollIntoView();
    let i = 0;
    let timeInMS = timesInMS[0];

    lessonTimerId = window.setInterval(() => {
        timeInMS -= 1000;
        mins = parseInt(timeInMS / 60000);
        secs = (timeInMS - mins * 60000) / 1000;
    
        if (mins == 0 && secs === 0) {
            if (i == numLessonParts - 1) {
                clearInterval(lessonTimerId);
            }
            else {
                // play alarm sound
                const alarmSound = new Audio('mixkit-classic-alarm-995.wav');
                alarmSound.play();
                // update the lesson part
                i++;
                // update background color
                lessonTimerLabel.style.background = backgroundColors[i];
                lessonTimerLabel.style.color = textColors[i];
                // update the time in the new part
                timeInMS = timesInMS[i];
                mins = parseInt(timeInMS / 60000);
                secs = (timeInMS - mins * 60000) / 1000;
                lessonTimerLabel.innerText = `${mins}:0${secs}`;
            }
        }
        else if (mins > 0 && secs === 0) {
            mins -= 1;
            secs = 59;
            lessonTimerLabel.innerText = `${mins}:${secs}`;
        }
        else {
            const secsString = (secs < 10) ? "0" + secs.toString() : secs.toString();
            lessonTimerLabel.innerText = `${mins}:${secsString}`;
        }
    }, 1000);
}

function startHallpassTimer() {
    let timeInMS = 15*60000;
    let mins = parseInt(timeInMS / 60000);
    let secs = (timeInMS - mins * 60000) / 1000;

    hallpassTimerId = window.setInterval(() => {
        timeInMS -= 1000;
        mins = parseInt(timeInMS / 60000);
        secs = (timeInMS - mins * 60000) / 1000;

        if (mins == 0 && secs == 0) {
            // play alarm sound
            const alarmSound = new Audio('mixkit-classic-alarm-995.wav');
            alarmSound.play();
            hallpassTimerLabel.innerText = `${mins}:${secs}`;
            clearInterval(hallpassTimerId);
        }
        else if (mins > 0 && secs == 0) {
            mins -= 1;
            secs = 59;
            hallpassTimerLabel.innerText = `${mins}:${secs}`;
        }
        else {
            const secsString = (secs < 10) ? "0" + secs.toString() : secs.toString();
            hallpassTimerLabel.innerText = `${mins}:${secsString}`;
        }
    }, 1000);
}

function gradeButtonClick() {
    const button = event.srcElement;
    const color = button.style.backgroundColor;
    const studentID = button.parentElement.id;
    const student = findStudentWith(studentID);

    if (color == "green") {
        // remove letter grade
        button.style.backgroundColor = "";
        const index = student["grades"].indexOf(button.textContent);
        student.grades.splice(index, 1);
    }
    else {
        // add letter grade
        button.style.backgroundColor = "green";
        student.grades.push(button.textContent);
    }
}

function findStudentWith(studentID) {
    for (i in students) {
        for (student of students[i]) {
            if (student.id == studentID) {
                return student;
            }
        }
    }
    return null;
}

function uploadButtonClicked() {
    const button = event.srcElement;
    const period = button.parentElement.id;
    const index = periodStrings.indexOf(period);
    const studentsInPeriod = students[index];
    let ranges = [];
    let values = [];
    for (student of studentsInPeriod) {
        const row = student.row;
        // any row less than 3 should not be written to on the data tracker
        if (row < 3) {
            continue;
        }

        let arr = [];
        const attendance = getAttendance(student);
        arr.push(attendance);
        const exitTicketGrade = getExitTicketGrade(student);
        arr.push(exitTicketGrade);
        const participationGrade = getParticipationGrade(student);
        arr.push(participationGrade);
        values.push(arr);

        const col = getColumn();
        const range = `${col}${row}:${col}${row+2}`;
        ranges.push(range);
    }

    batchUpdateValues("1jFT3SCoOuMwJnsRJxuD7D2Eq6hKgne6nEam1RdLlPmM",
                      ranges,
                      values,
                      "RAW", 
                      (res) => {
                        resetGrades(studentsInPeriod);                               
                      });
}

function getAttendance(student) {
    const div = document.getElementById(student.id);
    const attendance = [];
    for (child of div.childNodes) {
        if (child.tagName == "SELECT") {
            const index = child.selectedIndex;
            const selectedOption = child.options[index];
            const value = selectedOption.value;
            // check if user selected a value for the attendance
            try {
                if (value === "") throw "Please select a value for the attendance";  
                attendance.push(value);
            }
            catch (err) {
                // TODO: show this message in a pop-up
                console.log(err);
            }
        }
    }

    return attendance;
}

function getExitTicketGrade(student) {
    const div = document.getElementById(student.id);
    const grade = [];
    for (child of div.childNodes) {
        if (child.tagName == "INPUT") {
            try {
                const value = child.value;
                if (value !== "" && Number(value) < 0) throw "Invalid: Exit Ticket grade must be an integer between 0 and 4.";
                if (value !== "" && Number(value) > 4) throw "Invalid: Exit Ticket grade must be an integer between 0 and 4.";
                if (value !== "") {
                    grade.push(Number(value));
                }
            }
            catch (err) {
                // TODO: show this message in a pop-up
                console.log(err);
            }
        }
    }

    return grade;
}

function getParticipationGrade(student) {
    const studentsLetters = student.grades;
    const letters = ['G', 'R', 'A', 'D', 'E', 'S'];
    const grades = letters.reduce((str, letter) => {
        if (studentsLetters.includes(letter)) {
            return str + letter;
        }
        return str;
    }, "");

    return (grades == "")? [] : [grades];
}

function getColumn() {
    const date1 = new Date("08/07/2023");
    const date2 = new Date();
        
    // calculate the time difference of two dates
    const difference_in_time = date2.getTime() - date1.getTime();

    // calculate the no. of days between two dates
    const difference_in_days = Math.floor(difference_in_time / (1000 * 3600 * 24));

    // calculate the no. of wekeends between two dates
    const no_weekends = Math.floor(difference_in_days / 7);

    // the number of columns away the current one is from column Z
    const total = 70 + difference_in_days - no_weekends - 90;
    // To display the final no. of days (result)
    // console.log("difference = " + difference_in_days + 
    //             "\nweekends = " + no_weekends +
    //             "\ntotal = " + total);

    // Note: every column name will have two letters, since we are past 8/30/23
    let column_name = "";
    const index_of_first = Math.floor(total / 26);
    const index_of_second = total % 26;
    column_name += String.fromCharCode(65 + index_of_first);
    column_name += String.fromCharCode(65 + index_of_second - 1);
        
    return column_name;
}

function resetGrades(students) {
    // clear the grades array for each student
    for (i in students) {
        students[i].grades = []
        // update the colors of the grades buttons   
        const div = document.getElementById(students[i].id)
        for (node of div.childNodes) {
            if (node.tagName === "BUTTON") {
                node.style.backgroundColor = "";
            }
            else if (node.tagName === "INPUT") {
                node.value = "";
            }
            else if (node.tagName === "SELECT") {
                node.selectedIndex = 0;
            }
        }
    }    
}

function resetButtonClicked() {
    clearInterval(lessonTimerId);
    clearInterval(hallpassTimerId);
    setupLessonTimer()
    setupHallpassTimer()
    lessonTimerLabel.style.pointerEvents = "auto";
}