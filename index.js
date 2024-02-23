const periodStrings = ["First", "Second", "Third", "Fourth", "Sixth", "Seventh"];
const classNames = ["doNow", "numberTalk", "launch", "engage", "summary", "exitTicket"];
const backgroundColors = ["blue", "orange", "yellow", "green", "lightblue", "red"];
const textColors = ["", "black", "black", "", "black", ""];
const timesInMS = [5*60000, 8*60000, 5*60000, 15*60000, 5*60000, 5*60000];
// const timesInMS = [5*1000, 8*1000, 5*1000, 15*1000, 5*1000, 5*1000];
const numLessonParts = 6;

const lessonTimerLabel = document.getElementById("timerLabel");
const hallpassTimerLabel = document.getElementById("hallpassTimerLabel");
const container = document.getElementsByClassName("container")[0];
const studentsContainer = document.getElementsByClassName("students-container")[0];
const dateControl = document.querySelector('input[type="date"]');
let lessonTimerId = null;
let hallpassTimerId = null;
/*
    rowToStudentData = {
        0: [
                [],
                [],
                [],    
            ]
    }
*/
const rowToStudentData = {};
const idToRow = {};

setupDate();
getStudents();
getColumnNames();

function setupDate() {
    const today = new Date();
    // Get year, month, and day part from the date
    const year = today.toLocaleString("default", { year: "numeric" });
    const month = today.toLocaleString("default", { month: "2-digit" });
    const day = today.toLocaleString("default", { day: "2-digit" });

    // Generate yyyy-mm-dd date string
    const formattedDate = year + "-" + month + "-" + day;
    dateControl.value = formattedDate;
}

function getStudents() {
    fetch('http://localhost:8000/students').then(function(response) {
        removeLoader();
        if (!response.ok) {
            if (response.status == 401) {
                window.location.href = 'http://localhost:8000/signup.html';
            }
            else {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        }
        else {
            return response.json();
        }
      }).then(function(data) {
        localStorage.setItem('students', JSON.stringify(data));
        for (period in data) {
            createPeriodHeader(period);
            createPeriod(data[period]);
        }
      }).catch(function(err) {
        console.log(err);
      });
}

function getColumnNames() {
    fetch('http://localhost:8000/google/columnsForDates').then(function(response) {
        removeLoader();
        if (!response.ok) {
            if (response.status == 401) {
                window.location.href = 'http://localhost:8000/signup.html';
            }
            else {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        }
        else {
            return response.json();
        }
      }).then(function(data) {
        const dateToColumn = JSON.parse(localStorage.getItem('dateToColumn'));
        if (dateToColumn === null) {
            localStorage.setItem('dateToColumn', JSON.stringify(data));
        }
      }).catch(function(err) {
        console.log(err);
      });
}

function createPeriodHeader(period) {
    studentsContainer.innerHTML += `
        <div class="period-header-container" id="${periodStrings[period]}">
            <h1 class="period-header">${periodStrings[period]}</h1>
            <button class="upload" onclick="uploadButtonClicked()">Upload</button>
        </div>   
    `;
}

function createPeriod(students) {
    const flexContainer = document.createElement("div");
    flexContainer.classList.add("flex-container");
    studentsContainer.appendChild(flexContainer);
    for (student of students) {
        const row = student['sheets_row'];
        const id = student['id'];
        const period = student['period'];
        idToRow[id] = row;
        rowToStudentData[row] = [[],[],[]];
        const firstName = student['name'].split(",")[1];
        flexContainer.innerHTML += `
            <div class="flex-item" id=${id}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png">
                <a href="student.html?id=${id}&period=${period}"><h3>${firstName}</h3></a>
                <select onchange="onAttendanceValueChanged()">
                    <option value="">--Attendance--</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Tardy">Tardy</option>
                    <option value="Left Early">Left Early</option>
                    <option value="No Session">No Session</option>
                    <option value="No School">No School</option>
                </select>
                <input type="number" min="0" max="4" onchange="onExitTicketGradeChanged()">
                <button onclick="gradeButtonClick()">G</button>
                <button onclick="gradeButtonClick()">R</button>
                <button onclick="gradeButtonClick()">A</button>
                <button onclick="gradeButtonClick()">D</button>
                <button onclick="gradeButtonClick()">E</button>
                <button onclick="gradeButtonClick()">S</button>
            </div>
        `;
    }
}

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

function onAttendanceValueChanged() {
    const select = event.srcElement;
    const studentID = select.parentElement.id;
    const row = idToRow[studentID];
    if (select.value !== '') {
        rowToStudentData[row][0] = [select.value];
    }
    else {
        rowToStudentData[row][0] = [];
    }
}

function onExitTicketGradeChanged() {
    const input = event.srcElement;
    const studentID = input.parentElement.id;
    const row = idToRow[studentID];
    if (input.value !== '') {
        rowToStudentData[row][1] = [Number(input.value)];
    }
    else {
        rowToStudentData[row][1] = [];
    }
}

function gradeButtonClick() {
    const button = event.srcElement;
    const color = button.style.backgroundColor;
    const studentID = button.parentElement.id;
    const row = idToRow[studentID];

    const grades = rowToStudentData[row][2];
    if (color == "green") {
        button.style.backgroundColor = "";
        // remove letter grade
        const index = grades.indexOf(button.textContent);
        grades.splice(index, 1);
    }
    else {
        button.style.backgroundColor = "green";
        // add letter grade
        grades.push(button.textContent);
    }
}

function uploadButtonClicked() {
    try {
        const button = event.srcElement;
        const period = button.parentElement.id;
        const periodHeader = document.getElementById(period);
        const divs = periodHeader.nextElementSibling.getElementsByTagName('div');
        // throws error if no date is selected
        const col = getColumn();
        const ranges = [];
        const values = [];
        for (let i = 0; i < divs.length; i++) {
            const child = divs[i];
            const studentID = child.id;
            const row = idToRow[studentID];
            // any row less than 3 should not be written to on the data tracker
            if (row < 3) {
                continue;
            }

            validateExitTicketGrade(studentID);
            sortParticipationGrades(studentID);
            values.push(rowToStudentData[row]);

            const range = `${col}${row}:${col}${row+2}`;
            ranges.push(range);
        }

        const body = JSON.stringify({period: period,ranges: ranges, values: values});
        post('http://localhost:8000/students/dailydata', body, (data) => {
            const period = data['period'];
            resetGrades(period);
        });
    }
    catch (err) {
        alert(err.message);
    }
}

function validateExitTicketGrade(studentID) {
    const row = idToRow[studentID];
    const value = rowToStudentData[row][1];

    try {    
        if (value < 0) throw new Error("Invalid: Exit Ticket grade must be an integer between 0 and 4.");
        if (value > 4) throw new Error("Invalid: Exit Ticket grade must be an integer between 0 and 4.");
    }
    catch (err) {
        alert(err);
    }
}

function sortParticipationGrades(studentID) {
    const row = idToRow[studentID];
    const studentsLetters = rowToStudentData[row][2];
    const letters = ['G', 'R', 'A', 'D', 'E', 'S'];
    const grades = letters.reduce((str, letter) => {
        if (studentsLetters.includes(letter)) {
            return str + letter;
        }
        return str;
    }, "");

    rowToStudentData[row][2] = (grades === "")? [] : [grades];
}

function getColumn() {
    try {
        // throws error if no date is selected
        const date = getDate();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        const dateString = `${month}/${day}/${year}`;
        const dateToColumn = JSON.parse(localStorage.getItem('dateToColumn'));
        if (dateString in dateToColumn) {
            return dateToColumn[dateString];
        }
        throw new Error(`There is no column for ${dateString}`);
    }
    catch (err) {
        throw err;
    }
}

function getDate() {
    const dateString = dateControl.value;
    try {
        if (dateString === '') throw new Error("Please select a date.");
        const dateParts = dateString.split('-');
        const year = Number(dateParts[0]);
        const month = Number(dateParts[1]) - 1;
        const day = Number(dateParts[2]);
        const date = new Date(year, month, day);
        return date;
    }
    catch (err) {
        throw err;
    }
}

function post(url, body = JSON.stringify({}), callback = (data) => {}) {
    fetch(url, {method: "POST", body: body, headers: {
        "Content-Type": "application/json",
      }}).then(function(response) {
        return response.json();
      }).then(function(data) {
        if (data['authorizationUrl']) {
            window.location.href = data['authorizationUrl'];
        }
        else {
            callback(data);
        }
      }).catch(function(err) {
        console.log('Fetch Error :-S', err);
      });
}

function resetGrades(period) {
    const periodHeader = document.getElementById(period);
    const periodDiv = periodHeader.nextElementSibling;
    const divs = periodDiv.getElementsByTagName('div'); 
    // clear student data for every student of that period
    for (div of divs) {
        const studentID = div.id;
        const row = idToRow[studentID];
        rowToStudentData[row][0] = [];
        rowToStudentData[row][1] = [];
        rowToStudentData[row][2] = [];
        // update the colors of the grades buttons
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

function signoutButtonClicked() {
    fetch('http://localhost:8000/users/signout')
}

function removeLoader() {
    const loader = document.querySelector('.loader');
    loader.classList.add('loader-hidden');
    loader.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'visibility') {
            document.body.removeChild(loader);
        }
    });
}

function synchronizeButtonClicked() {
    const body = JSON.stringify({});
    post('http://localhost:8000/google/synchronizeStudentRows', body, (data) => {
        updateStudentsUI(data);
    });
}

function updateStudentsUI(students) {
    studentsContainer.innerHTML = '';
    for (period in students) {
        createPeriodHeader(period);
        createPeriod(students[period]);
    }
}