const url = new URL(location.href); 
const studentID = Number(url.searchParams.get("id"));
const period = url.searchParams.get("period");

const h1 = document.querySelector('h1');
const weekInput = document.getElementById('week');
const goalLabel = document.getElementById('goal');
const container = document.getElementsByClassName('days-flex-container')[0];
const studentNotesContainer = document.getElementById('student-notes-container');

const WEEKDAYS = 5;

let year;
let week;
let dates = [];
/*
[
    [[],[],[]], [[],[],[]], [[],[],[]], [[],[],[]], [[],[],[]]
]
*/
let studentData = [];
let student;
const original = {};

setStudent();
setWeek();
setDates();
createDays();
setDatesForDays();
getDataForCurrentWeek();
getStudentNotes();

function setStudent() {
    const students = JSON.parse(localStorage.getItem('selected_students'));
    const index = (period < 5)? period - 1 : period - 2;
    for (s of students[index]) {
        if (s['id'] === studentID) {
            student = s;
            break;
        }
    }
    h1.innerText = student['name'];
    const goal = student['goal'];
    goalLabel.innerText = goal;
    hashData('goal', goal);
}

function setWeek() {
    const today = new Date();
    year = today.getFullYear();
    const startDate = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today - startDate) / (24 * 60 * 60 * 1000));
    week = Math.ceil(days / 7);
    weekInput.value = (week < 10)? `${year}-W0${week}` : `${year}-W${week}`;
}

function setDates() {
    const monday = new Date(`1/1/${year}`);
    const friday = new Date(`1/1/${year}`);
    const daysBeforeWeek = (week - 1) * 7;
    monday.setDate(monday.getDate() + daysBeforeWeek);
    friday.setDate(friday.getDate() + daysBeforeWeek + 4);

    let date = monday;
    while (date.getMonth() < friday.getMonth() || (date.getMonth() === friday.getMonth() && date.getDate() <= friday.getDate())) {
        const new_date = new Date(date);
        dates.push(new_date);
        date.setDate(date.getDate() + 1);
    }
}

function createDays() {
    for (let i = 0; i < WEEKDAYS; i++) {
        container.innerHTML += `
            <div class="flex-item" id="${i}">
                <h3></h3>
                <select onchange="onAttendanceValueChanged()">
                    <option value="">--Attendance--</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Tardy">Tardy</option>
                    <option value="Left Early">Left Early</option>
                    <option value="No Session">No Session</option>
                    <option value="No School">No School</option>
                </select>
                <input type='number' min='0' max='4' onchange="onExitTicketGradeChanged()">
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

function setDatesForDays() {
    const divs = container.getElementsByClassName('flex-item');
    for (let i = 0; i < WEEKDAYS; i++) {
        const div = divs[i];
        const h3 = div.getElementsByTagName('h3')[0];
        h3.innerText = convertDateToMonthAndDay(dates[i]);
    }
}

function convertDateToMonthAndDay(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

function getDataForCurrentWeek() {
    const monday = new Date(`1/1/${year}`);
    const friday = new Date(`1/1/${year}`);
    const daysBeforeWeek = (week - 1) * 7;
    monday.setDate(monday.getDate() + daysBeforeWeek);
    friday.setDate(friday.getDate() + daysBeforeWeek + 4);
    // get spreadsheet columns for monday and friday
    try {
        const firstColumn = getColumn(monday);
        const lastColumn = getColumn(friday);
        getStudentData(firstColumn, lastColumn);
    }
    catch (err) {
        removeLoader();
        alert(err.message);
    }
}

function getColumn(date) {
    try {
        // throws error if no date is selected
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

/*
[["Present","Present","Present","Present","Tardy"],
 ["","4"],
 ["GRADE","GRADES","GRADES","GRADES","GRADES"]]
*/
function getStudentData(start, end) {
    fetch(`${protocol}://${domain}/students/${studentID}/dailydata?start=${start}&end=${end}`)
    .then(function(response) {
        removeLoader();
        if (!response.ok) {
            if (response.status == 401) {
                window.location.href = `https://${domain}/signup.html`;
            }
            else {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        }
        else {
            return response.json();
        }
    })
    .then(function(data) {
        const rows = data.length;
        for (let i = 0; i < WEEKDAYS; i++) {
            studentData.push([]);
            // Attendance
            (rows > 0 && i < data[0].length && data[0][i] !== '') ? studentData[i].push([data[0][i]]) : 
                                                                    studentData[i].push([]);
            // ET grade
            (rows > 1 && i < data[1].length && data[1][i] !== '') ? studentData[i].push([Number(data[1][i])]) : 
                                                                    studentData[i].push([]);
            // Letter grades
            (rows > 2  && i < data[2].length && data[2][i] !== '') ? studentData[i].push([data[2][i]]) : 
                                                                        studentData[i].push([]);
            updateDayWithDayData(i, studentData[i]);
            const date = convertDateToMonthAndDay(dates[i]);
            hashData(date, studentData[i]);
        }
        console.log(studentData);
    })
    .catch(function(err) {
        console.log(err);
    });
}

function updateDayWithDayData(dayIndex, data) {
    const div = document.getElementById(dayIndex);
    const select = div.getElementsByTagName('select')[0];
    if (data[0].length > 0) {
        select.value = data[0][0];
    }
    const input = div.getElementsByTagName('input')[0];
    if (data[1].length > 0) {
        input.value = data[1][0];
    }
    const buttons = div.getElementsByTagName('button');
    if (data[2].length > 0) {
        const grades = data[2][0];
        for (button of buttons) {
            const letter = button.innerText;
            if (grades.includes(letter)) {
                button.style.backgroundColor = "green";
            }
        }
    }
}

function hashData(key, data) {
    const json = JSON.stringify(data);
    const hash = rawToHex(json);
    // console.log(`json: ${json}\nhash: ${hash}`);
    original[key] = hash;
}

// Convert a raw string to a hex string
function rawToHex(raw) {
    let hex = "";
    let hexChars = "0123456789abcdef";
    for (let i = 0; i < raw.length; i++) {
        let c = raw.charCodeAt(i);
        hex += (
        hexChars.charAt((c >>> 4) & 0x0f) +
        hexChars.charAt(c & 0x0f));
    }
    return hex;
}

function getStudentNotes() {
    get(`${protocol}://${domain}/students/${studentID}/notes`, (notes) => {
        addNotesToContainer(notes);
    });
}

function addNotesToContainer(notes) {
    for (note of notes) {
        addNoteToContainer(note);
    }
}

function addNoteToContainer(student_note) {
    const date = parseISOString(student_note['date']);
    const formattedDate = formatDate(date);
    studentNotesContainer.innerHTML += `
        <div class="notes-flex-item">
            <p>${student_note['note']}</p>
            <label>${formattedDate}</label>
        </div>
    `;
}

function parseISOString(s) {
    var b = s.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

function formatDate(date) {
    const options = {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
    };
    const formattedDate = date.toLocaleString("default", options);
    return formattedDate;
}

function uploadButtonClicked() {
    try {
        const columns = [];
        const daysModified = [];
        for (let i = 0; i < studentData.length; i++) {
            if (studentData[i][1].length > 0) {
                const etGrade = studentData[i][1][0];
                validateExitTicketGrade(etGrade);
            }
            if (studentData[i][2].length > 0) {
                sortParticipationGrades(i);
            }

            if (isStudentDataUpdated(dates[i], studentData[i])) {
                const column = getColumn(dates[i]);
                columns.push(column);
                daysModified.push(studentData[i]);
            }
        }
        
        if (isStudentGoalUpdated()) {
            const goal = goalLabel.value;
            hashData('goal', goal);
            const studentGoalBody = JSON.stringify({goal: goal});
            patch(`${protocol}://${domain}/students/${studentID}`, studentGoalBody);
        }

        if (daysModified.length > 0) {
            const dailyDataBody = JSON.stringify({columns: columns, values: daysModified});
            patch(`${protocol}://${domain}/students/${studentID}/dailydata`, dailyDataBody);
        }
    }
    catch (err) {
        alert(err.message);
    }
}

function validateExitTicketGrade(value) {
    try {    
        if (value < 0) throw new Error("Invalid: Exit Ticket grade must be an integer between 0 and 4.");
        if (value > 4) throw new Error("Invalid: Exit Ticket grade must be an integer between 0 and 4.");
    }
    catch (err) {
        alert(err);
    }
}

function sortParticipationGrades(i) {
    const studentsLetters = studentData[i][2][0];
    const letters = ['G', 'R', 'A', 'D', 'E', 'S'];
    const grades = letters.reduce((str, letter) => {
        if (studentsLetters.includes(letter)) {
            return str + letter;
        }
        return str;
    }, "");

    studentData[i][2] = (grades === "")? [] : [grades];
}

function getColumnsForDates() {
    const columns = [];
    for (date of dates) {
        const column = getColumn(date);
        columns.push(column);
    }
    return columns;
}

function isStudentDataUpdated(date, data) {
    const json = JSON.stringify(data);
    const hash = rawToHex(json);
    // console.log(`json: ${json}\nhash: ${hash}`);
    const monthDay = convertDateToMonthAndDay(date);
    if (original[monthDay] === hash) {
        console.log(`${monthDay}: data is the same.`);
    }
    else {
        console.log(`${monthDay}: data changed.`);
    }
    return original[monthDay] !== hash;
}

function isStudentGoalUpdated() {
    const data = goalLabel.value;
    const json = JSON.stringify(data);
    const hash = rawToHex(json);
    // console.log(`json: ${json}\nhash: ${hash}`);
    if (original['goal'] === hash) {
        console.log(`goal is the same.`);
    }
    else {
        console.log(`goal changed.`);
    }
    return original['goal'] !== hash;
}

function onAttendanceValueChanged() {
    const select = event.srcElement;
    const id = select.parentElement.id;
    if (select.value !== '') {
        studentData[id][0] = [select.value];
    }
    else {
        studentData[id][0] = [];
    }
    console.log(studentData);
}

function onExitTicketGradeChanged() {
    const input = event.srcElement;
    const id = input.parentElement.id;
    if (input.value !== '') {
        studentData[id][1] = [Number(input.value)];
    }
    else {
        studentData[id][1] = [];
    }
    console.log(studentData);
}

function gradeButtonClick() {
    const button = event.srcElement;
    const color = button.style.backgroundColor;
    const id = button.parentElement.id;

    let grades = studentData[id][2][0];
    if (color == "green") {
        button.style.backgroundColor = "";
        // remove letter grade
        const index = grades.indexOf(button.textContent);
        grades = grades.slice(0, index) + grades.slice(index + 1);
    }
    else {
        button.style.backgroundColor = "green";
        // add letter grade
        grades += button.textContent
    }
    studentData[id][2] = [grades];
    console.log(studentData);
}

function patch(url, body) {
    fetch(url, {method: "PATCH", body: body, headers: {
        "Content-Type": "application/json",
      }}).then(function(response) {
        return response.json();
      }).then(function(data) {
        if (data['authorizationUrl']) {
            window.location.href = data['authorizationUrl'];
        }
        else {
            console.log(data);
        }
      }).catch(function(err) {
        console.log('Fetch Error :-S', err);
      });
}

function onWeekChanged() {
    const parts = weekInput.value.split('-');
    year = parts[0];
    week = Number(parts[1].substring(1));
    dates = [];
    studentData = [];
    resetDays();
    setDates();
    setDatesForDays();
    getDataForCurrentWeek();
}

function resetDays() {
    const divs = container.getElementsByClassName('flex-item');
    for (div of divs) {
        const select = div.getElementsByTagName('select')[0];
        select.value = "";
        const etInput = div.getElementsByTagName('input')[0];
        etInput.value = "";
        for (button of div.getElementsByTagName('button')) {
            button.style.backgroundColor = "";
        }
    }
}

function addNoteButtonClicked() {
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="popup-top-nav">
            <h3>Add New Note</h3>
            <button class="cancel-button" onclick="cancelAddNewNote()"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="add-new-note-container">
            <textarea id='student-note' name='note'></textarea>
            <div class="upload-note-button-container">
                <button onclick="uploadNote()">Upload Note</button>
            </div>
        </div>
    `;
    div.classList.add("popup-container");
    document.body.appendChild(div);
}

function cancelAddNewNote() {
    const blackContainer = document.querySelector('.black-container');
    document.body.removeChild(blackContainer);
    const div = document.querySelector('.popup-container');
    document.body.removeChild(div);
}

function uploadNote() {
    uploadNoteButtonClicked();
    cancelAddNewNote();
}

function uploadNoteButtonClicked() {
    const studentNoteTextArea = document.getElementById('student-note');
    const note = studentNoteTextArea.value;
    const date = new Date();
    const body = JSON.stringify({
        'note': note,
        'date': date.toISOString()
    });
    post(`${protocol}://${domain}/students/${studentID}/notes`, body, (notes) => {
        studentNotesContainer.innerHTML = '';
        addNotesToContainer(notes);
    });
}