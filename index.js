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
const newStudent = {};

setupDate();
getCurrentUser();
getMyStudents();
getAllStudents()
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

function getCurrentUser() {
    get('http://localhost:8000/users/me', (data) => {
        localStorage.setItem('fellow_id', JSON.stringify(data['fellow_id']));
    });
}

function getMyStudents() {
    get('http://localhost:8000/students/fellow', (data) => {
        removeLoader();
        localStorage.setItem('selected_students', JSON.stringify(data));
        for (period in data) {
            createPeriodHeader(period);
            createPeriod(data[period]);
        }
    });
}

function getAllStudents() {
    get('http://localhost:8000/students', (data) => {
        localStorage.setItem('all_students', JSON.stringify(data));
    });
}

function getColumnNames() {
    get('http://localhost:8000/google/columnsForDates', (data) => {
        const dateToColumn = JSON.parse(localStorage.getItem('dateToColumn'));
        if (dateToColumn === null) {
            localStorage.setItem('dateToColumn', JSON.stringify(data));
        }
    });
}

function createPeriodHeader(period) {
    studentsContainer.innerHTML += `
        <div class="period-header-container" id="${periodStrings[period]}">
            <h1 class="period-header">${periodStrings[period]}</h1>
            <div class="dropdown">
                <button class="dropbtn"><i class="fas fa-bars"></i></button>
                <div class="dropdown-content">
                <a href="#" onclick="uploadButtonClicked()">Upload</a>
                <a href="#" onclick="addNewStudentButtonClicked(${period})">Add new student</a>
                <a href="#" onclick="addExistingStudentButtonClicked(${period})">Add existing student</a>
                </div>
            </div>
        </div>   
    `;
}

function createPeriod(students) {
    const flexContainer = document.createElement("div");
    flexContainer.classList.add("flex-container");
    studentsContainer.appendChild(flexContainer);
    for (student of students) {
        addStudentToPeriodContainer(student, flexContainer);
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
        hideDropDown(event);
        const a = event.srcElement;
        const periodHeader = a.parentElement.parentElement.parentElement;
        const period = periodHeader.id;
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

function addNewStudentButtonClicked(periodIndex) {
    hideDropDown(event);
    createAddNewStudentUI();
    setPeriodOfNewStudent(periodIndex);
    setFellowOfNewStudent();
}

function createAddNewStudentUI() {
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="add-new-student-top-nav">
            <h3>Add New Student</h3>
            <button class="cancel-button" onclick="cancelAddNewStudent()"><i class="fa-solid fa-x"></i></button>        
        </div>
        <div class="add-new-student-form-container">
            <form>
                <label for="name">Name:</label><br>
                <input placeholder="Name" onchange="onNameChanged()"></input><br>
                <label for="sheetsRow">Sheets Row:</label><br>
                <input placeholder="Sheets Row" onchange="onSheetsRowChanged()"></input><br>
                <button onclick="addNewStudent()">Submit</button>
            </form>
        </div>
    `;
    div.classList.add("addNewStudent");
    document.body.appendChild(div);
}

function setPeriodOfNewStudent(periodIndex) {
    newStudent['period'] = (periodIndex < 4)? periodIndex + 1 : periodIndex + 2;
}

function setFellowOfNewStudent() {
    const fellow_id = JSON.parse(localStorage.getItem('fellow_id'));
    newStudent['fellow_id'] = fellow_id;
}

function addNewStudent() {
    event.preventDefault();
    uploadNewStudent();
    cancelAddNewStudent();
}

function uploadNewStudent() {
    const studentJSON = body = JSON.stringify(newStudent);
    post('http://localhost:8000/students', studentJSON, (res) => {
        console.log(res);
    })
}

function cancelAddNewStudent() {
    const blackContainer = document.querySelector('.black-container');
    document.body.removeChild(blackContainer);
    const div = document.querySelector('.addNewStudent');
    document.body.removeChild(div);
}

function addExistingStudentButtonClicked(periodIndex) {
    hideDropDown(event);
    displayStudentsForPeriod(periodIndex);
}

function hideDropDown(event) {
    // Prevent the page from scrolling up after clicking on an anchor
    event.preventDefault();
    const a = event.srcElement;
    const dropdownContent = a.parentElement;
    dropdownContent.style.display = 'none';
    const dropdown = dropdownContent.parentElement;
    dropdown.addEventListener('mouseover', () => {
        dropdownContent.style.display = 'block';
    });  

    dropdown.addEventListener('mouseleave', () => {
        dropdownContent.style.display = 'none';
    });  
}

function displayStudentsForPeriod(periodIndex) {
    const all_students = JSON.parse(localStorage.getItem('all_students'));
    const selected_students = JSON.parse(localStorage.getItem('selected_students'));
    const unselected_students = all_students[periodIndex].filter((student) => !containsStudent(student, selected_students[periodIndex]));
    createAddExistingStudentsUI(unselected_students);
}

function containsStudent(student, students) {
    for (s of students) {
        if (s['id'] === student['id']) {
            return true;
        }
    }
    return false;
}

function createAddExistingStudentsUI(students) {
    addBlackContainer();

    const div = document.createElement('div');
    div.classList.add("add-existing-student");
    addHeaderToPopUp(div);

    const studentsDiv = document.createElement('div');
    studentsDiv.classList.add('add-existing-student-body');
    addStudentsToContainer(students, studentsDiv);
    addButtonToStudentsContainer(studentsDiv)
    div.appendChild(studentsDiv);

    document.body.appendChild(div);
}

function addBlackContainer() {
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
}

function addHeaderToPopUp(div) {
    div.innerHTML = `
        <div class="add-existing-student-top-nav">
            <h3>Add Existing Student</h3>
            <button class="cancel-button" onclick="cancelAddExistingStudent()"><i class="fa-solid fa-x"></i></button>        
        </div>
    `;
}

function addStudentsToContainer(students, div) {
    for (student of students) {
        const studentDiv = document.createElement('div');
        studentDiv.innerHTML = `
            <input type="checkbox" id="${student['id']}" name="${student['id']}" value="${student['period']}">
            <label>${student['name']}</label><br>
        `;
        div.appendChild(studentDiv);
    }
}

function addButtonToStudentsContainer(div) {
    const button = document.createElement('button');
    button.innerHTML = "Submit";
    button.onclick = addExistingStudents;
    div.appendChild(button);
}

/*
TODO:
    1. Only reset the selected students when a user logs out and logs back in
*/
function addExistingStudents() {
    const studentsDiv = document.querySelector('.add-existing-student-body');
    const divs = studentsDiv.getElementsByTagName('div');
    for (div of divs) {
        const input = div.getElementsByTagName('input')[0];
        if (input.checked) {
            const period = Number(input.value);
            const studentID = Number(input.id);
            const periodIndex = (period > 5)? period - 2 : period - 1;
            const targetStudent = getSelectedStudent(studentID, periodIndex);
            saveSelectedStudentToLocalStorage(targetStudent, periodIndex);
            const container = getStudentsContainerForPeriod(periodIndex);
            addStudentToPeriodContainer(targetStudent, container);
        }
    }
    cancelAddExistingStudent();
}

function getSelectedStudent(id, periodIndex) {
    const students = JSON.parse(localStorage.getItem('all_students'));
    const studentsOfPeriod = students[periodIndex];
    const targetStudent = studentsOfPeriod.filter((student) => student['id'] === id)[0];
    return targetStudent;
}

function saveSelectedStudentToLocalStorage(student, periodIndex) {
    const selected_students = JSON.parse(localStorage.getItem('selected_students'));
    selected_students[periodIndex].push(student);
    localStorage.setItem('selected_students', JSON.stringify(selected_students));
}

function getStudentsContainerForPeriod(periodIndex) {
    const periodString = periodStrings[periodIndex];
    const periodHeader = document.getElementById(periodString);
    const container = periodHeader.nextElementSibling;
    return container;
}

function cancelAddExistingStudent() {
    const blackContainer = document.querySelector('.black-container');
    document.body.removeChild(blackContainer);
    const div = document.querySelector('.add-existing-student');
    document.body.removeChild(div);
}

function addStudentToPeriodContainer(student, container) {
    const row = student['sheets_row'];
    const id = student['id'];
    const period = student['period'];
    idToRow[id] = row;
    rowToStudentData[row] = [[],[],[]];
    const firstName = student['name'].split(",")[1];
    container.innerHTML += `
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

function post(url, body = JSON.stringify({}), callback = () => {}) {
    fetch(url, {method: "POST", body: body, headers: {
        "Content-Type": "application/json",
      }}).then(function(response) {
        return response.json();
      }).then(function(res) {
        if (res['authorizationUrl']) {
            window.location.href = res['authorizationUrl'];
        }
        else if (res['error_message']) {
            alert(res['error_message']);
        }
        else {
            callback(res);
        }
      }).catch(function(err) {
        console.log('Fetch Error :-S', err);
      });
}

function get(url, callback = () => {}) {
    fetch(url).then(function(response) {
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
        callback(data);
      }).catch(function(err) {
        console.log(err);
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

function createLoader() {
    const loader = document.createElement("div");
    loader.classList.add('loader');
    document.body.appendChild(loader);
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
    createLoader();
    post('http://localhost:8000/google/synchronizeDB', body, (data) => {
        removeLoader();
        saveUpdatatedStudents(data);
        updateStudentsUI();
    });
}

function saveUpdatatedStudents(students) {
    localStorage.setItem('all_students', JSON.stringify(students));
    const selectedStudents = JSON.parse(localStorage.getItem('selected_students'));
    const numPeriods = selectedStudents.length;
    for (let period = 0; period < numPeriods; period++) {
        for (i in selectedStudents[period]) {
            const selectedStudent = selectedStudents[period][i];
            const studentsOfPeriod = students[period];
            for (updatedStudent of studentsOfPeriod) {
                if (updatedStudent['id'] === selectedStudent['id']) {
                    selectedStudents[period][i] = updatedStudent;
                }
            }
        }
    }
    localStorage.setItem('selected_students', JSON.stringify(selectedStudents));
}

function updateStudentsUI() {
    studentsContainer.innerHTML = '';
    const selectedStudents = getSelectedStudents();
    for (period in selectedStudents) {
        createPeriodHeader(period);
        createPeriod(selectedStudents[period]);
    }
}

function getSelectedStudents() {
    return JSON.parse(localStorage.getItem('selected_students'));
}

function onNameChanged() {
    const input = event.srcElement;
    newStudent['name'] = input.value;
}

function onSheetsRowChanged() {
    const input = event.srcElement;
    newStudent['sheets_row'] = input.value;
}