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
        for (period in data) {
            createPeriodHeader(period);
            createPeriod(data[period]);
        }
      }).catch(function(err) {
        console.log(err);
      });
}

function createPeriodHeader(period) {
    container.innerHTML += `
        <div class="period-header-container" id="${periodStrings[period]}">
            <h1 class="period-header">${periodStrings[period]}</h1>
            <button class="upload" onclick="uploadButtonClicked()">Upload</button>
        </div>   
    `
}

function createPeriod(students) {
    const flexContainer = document.createElement("div");
    flexContainer.classList.add("flex-container");
    container.appendChild(flexContainer);
    for (student of students) {
        const row = student['sheets_row'];
        idToRow[student['id']] = row;
        rowToStudentData[row] = [[],[],[]];
        const firstName = student['name'].split(",")[1];
        flexContainer.innerHTML += `
            <div class="flex-item" id=${student['id']}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png">
                <a href="student.html?title=${firstName}"><h3>${firstName}</h3></a>
                <select onchange="onAttendanceValueChanged()">
                    <option value="">--Attendance--</option>
                    <option value="Present">Present</option>
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
        const periodDiv = periodHeader.nextElementSibling;
        // throws error if no date is selected
        const col = getColumn();

        const ranges = [];
        const values = [];
        for (child of periodDiv.childNodes) {
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
        post('http://localhost:8000/students/dailydata', body);
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
        const date1 = new Date("08/07/2023");
        // throws error if no date is selected
        const date2 = getDate();

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
        const index_of_first = Math.floor((total - 1) / 26);
        const index_of_second = (total % 26 == 0)? 26 : total % 26;
        column_name += String.fromCharCode(65 + index_of_first);
        column_name += String.fromCharCode(65 + index_of_second - 1);
            
        return column_name;
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

function post(url, body) {
    fetch(url, {method: "POST", body: body, headers: {
        "Content-Type": "application/json",
      }}).then(function(response) {
        return response.json();
      }).then(function(data) {
        if (data['authorizationUrl']) {
            window.location.href = data['authorizationUrl'];
        }
        else {
            const period = data['period'];
            resetGrades(period);
        }
      }).catch(function(err) {
        console.log('Fetch Error :-S', err);
      });
}

function resetGrades(period) {
    const periodHeader = document.getElementById(period);
    const periodDiv = periodHeader.nextElementSibling;
    // clear student data for every student of that period
    for (div of periodDiv.childNodes) {
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