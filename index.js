const periodStrings = ["First", "Second", "Third", "Fourth", "Sixth", "Seventh"];
const lessonParts = ["Do Now", "Number Talk", "Launch", "Engage", "Summary", "Exit Ticket"]
const classNames = ["doNow", "numberTalk", "launch", "engage", "summary", "exitTicket"];
const colors = ["blue", "orange", "yellow", "green", "lightblue", "red"];
const timesInMS = [5*60000, 8*60000, 5*60000, 15*60000, 5*60000, 5*60000];
// const timesInMS = [5*1000, 8*1000, 5*1000, 15*1000, 5*1000, 5*1000];

const periods = [
    // 1st period
    [
        new Student(0, "Joseph", "Logwood", 1),
        new Student(1, "Makaiden", "Vongphrachanh", 1),
        new Student(2, "Carly", "Guerrero", 1),
    ],
    // 2nd period
    [
        new Student(3, "Uavalu", "Kauvaka", 2),
        new Student(4, "Navie", "Davis", 2),
        new Student(5, "Prince", "Leggett", 2),
    ],
    // 3rd period
    [
        new Student(6, "Benjamin", "Inthavong", 3),
        new Student(7, "Emmanuel", "Garcia Ponce", 3),
        new Student(8, "Alexandra", "Covian Perez", 3),
        new Student(9, "Emeri", "Hewitt", 3),
        new Student(10, "Alexa", "Padilla Garcia", 3),
        new Student(11, "Elias", "The-Boy", 3),
    ],
    // 4th period
    [
        new Student(12, "John", "Solozano", 4),
        new Student(13, "David", "Hernandez", 4),
        new Student(14, "Juliana", "Ignacio Tinajero", 4),
        new Student(15, "Zacchaeus", "Evans", 4),
        new Student(16, "Saniyah", "Sims", 4),
    ],
    // 6th period
    [
        new Student(17, "Nhi", "Truong", 6),
        new Student(18, "Brenda", "Calmo Calmo", 6),
        new Student(19, "Luis", "Chang Chilel", 6),
        new Student(20, "Caleb", "Pablo", 6),
        new Student(21, "Alex", "Pablo Ramirez", 6),
        new Student(22, "Lawrence", "Ward", 6),
    ],
    // 7th period
    [
        new Student(23, "Carlos", "Moran Flores", 6),
        new Student(24, "Arodi", "Granados Funes", 6),
        new Student(25, "John", "Martin-Garcia", 6),
        new Student(26, "Tysean", "Kelly", 6),
        new Student(27, "Khloe", "Pierce", 6),
        new Student(28, "Rebecca", "Chales Pablo", 6),
    ]
]

const div = document.querySelector("div");
const lessonLabel = document.querySelector("h1");
const lessonTimerLabel = document.getElementById("timerLabel");
const hallpassTimerLabel = document.getElementById("hallpassTimerLabel");
const startButton = document.getElementById("start");
let lessonTimerId = null;
let bathroomTimerId = null;

setupLessonTimer();
setupBathroomTimer();
setupPeriods();

function setupLessonTimer() {
    div.style.background = colors[0];
    lessonLabel.innerText = lessonParts[0];    
    const timeInMS = timesInMS[0];
    const mins = parseInt(timeInMS / 60000);
    const secs = (timeInMS - mins * 60000) / 1000;
    const secsString = (secs < 10) ? "0" + secs.toString() : secs.toString();
    lessonTimerLabel.innerText = `${mins}:${secsString}`;
}

function setupBathroomTimer() {
    const timeInMS = 15*60000;
    const mins = parseInt(timeInMS / 60000);
    const secs = (timeInMS - mins * 60000) / 1000;
    const secsString = (secs < 10) ? "0" + secs.toString() : secs.toString();
    hallpassTimerLabel.innerText = `${mins}:${secsString}`;
}

function setupPeriods() {
    const container = document.getElementsByClassName("container")[0];
    for (period in periods) {
        setupPeriodHeader(container, period);
        
        // add students of the current period
        const students = periods[period];
        for (student of students) {
            const div = document.createElement("div");
            div.classList.add("item");
            setupStudentImage(div, student);
            setupStudentName(div, student);
            setupAttendanceDropDownMenu(div);
            addBreakHTMLElement(div);
            setupGradeInput(div);
            addBreakHTMLElement(div);
            setupGradesButtons(div);
            container.appendChild(div);
        }
    }
}

function setupPeriodHeader(container, period) {
    // add period header
    const div = document.createElement("div");
    div.classList.add("header");
    div.id = periodStrings[period];
    const h1 = document.createElement("h1");
    const headerText = document.createTextNode(`${periodStrings[period]} Period`);
    const uploadButton = document.createElement("button");
    uploadButton.classList.add("upload");
    uploadButton.onclick = uploadButtonClicked;
    const buttonText = document.createTextNode("Upload");
    uploadButton.appendChild(buttonText);
    h1.appendChild(headerText);
    div.appendChild(h1);
    div.appendChild(uploadButton);
    container.appendChild(div);
}

function setupStudentImage(div, student) {
    div.id = student.id;
    const img = document.createElement("img");
    img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png";
    div.appendChild(img);
}

function setupStudentName(div, student) {
    const h3 = document.createElement("h3");
    const name = document.createTextNode(student.first_name);
    h3.appendChild(name);
    div.appendChild(h3);
}

function setupAttendanceDropDownMenu(div) {
    const select = document.createElement("select");
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text = "--Attendance--";
    select.options.add(defaultOption);
    const presentOption = document.createElement("option");
    presentOption.value = "Present";
    presentOption.text = "Present";
    select.options.add(presentOption);
    const tardyOption = document.createElement("option");
    tardyOption.value = "Tardy";
    tardyOption.text = "Tardy";
    select.options.add(tardyOption);
    const leftEarlyOption = document.createElement("option");
    leftEarlyOption.value = "Left Early";
    leftEarlyOption.text = "Left Early";
    select.options.add(leftEarlyOption);
    const absentOption = document.createElement("option");
    absentOption.value = "Absent";
    absentOption.text = "Absent";
    select.options.add(absentOption);
    const noSessionOption = document.createElement("option");
    noSessionOption.value = "No Session";
    noSessionOption.text = "No Session";
    select.options.add(noSessionOption);
    const noSchoolOption = document.createElement("option");
    noSchoolOption.value = "No School";
    noSchoolOption.text = "No School";
    select.options.add(noSchoolOption);
    div.appendChild(select);
}

function addBreakHTMLElement(div) {
    const br = document.createElement("br");
    div.append(br);
}

function setupGradeInput(div) {
    const gradeInput = document.createElement("input");
    gradeInput.type = "number";
    gradeInput.min = 0;
    gradeInput.max = 4;
    div.appendChild(gradeInput);
}

function setupGradesButtons(div) {
    const g = document.createElement("button");
    g.textContent = "G";
    g.onclick = gradeButtonClick;
    div.appendChild(g);
    const r = document.createElement("button");
    r.textContent = "R";
    r.onclick = gradeButtonClick;
    div.appendChild(r);
    const a = document.createElement("button");
    a.textContent = "A";
    a.onclick = gradeButtonClick;
    div.appendChild(a);
    const d = document.createElement("button");
    d.textContent = "D";
    d.onclick = gradeButtonClick;
    div.appendChild(d);
    const e = document.createElement("button");
    e.textContent = "E";
    e.onclick = gradeButtonClick;
    div.appendChild(e);
    const s = document.createElement("button");
    s.textContent = "S";
    s.onclick = gradeButtonClick;
    div.appendChild(s);
}

function startButtonClicked() {
    startLessonTimer();
    startBathroomTimer();
    startButton.disabled = true;
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
            if (i == lessonParts.length - 1) {
                clearInterval(lessonTimerId);
            }
            else {
                // play alarm sound
                const alarmSound = new Audio('mixkit-classic-alarm-995.wav');
                alarmSound.play();
                // update the lesson part
                i++;
                lessonLabel.innerText = lessonParts[i];
                // update background color
                div.style.background = colors[i];
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

function startBathroomTimer() {
    let timeInMS = 15*60000;
    let mins = parseInt(timeInMS / 60000);
    let secs = (timeInMS - mins * 60000) / 1000;

    bathroomTimerId = window.setInterval(() => {
        timeInMS -= 1000;
        mins = parseInt(timeInMS / 60000);
        secs = (timeInMS - mins * 60000) / 1000;

        if (mins == 0 && secs == 0) {
            hallpassTimerLabel.innerText = `${mins}:${secs}`;
            clearInterval(bathroomTimerId);
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
    for (i in periods) {
        for (student of periods[i]) {
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
    const students = periods[index];
    let ranges = [];
    let values = [];
    for (student of students) {
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
                        resetGrades(students);                               
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
    clearInterval(bathroomTimerId);
    setupLessonTimer()
    setupBathroomTimer()
    startButton.disabled = false;
}