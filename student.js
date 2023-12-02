const url = new URL(location.href); 
const studentID = url.searchParams.get("id");
const studentName = url.searchParams.get("title");
const studentGoal = url.searchParams.get("goal");

const h1 = document.querySelector('h1');
h1.innerText = studentName;

const textInput = document.getElementById('goal');
const container = document.getElementsByClassName('days-flex-container')[0];
const monday = new Date();
const friday = new Date();
const columns = [];
/*
[
    [[],[],[]], [[],[],[]], [[],[],[]], [[],[],[]], [[],[],[]]
]
*/
const studentData = [];

setMinDate();
setMaxDate();
createDays();
getDataForCurrentTimePeriod();

function setMinDate() {
    const day = monday.getDay();
    if (day === 0) {
        monday.setDate(monday.getDate() - 7 + 1);
    }
    else {
        monday.setDate(monday.getDate() - day + 1);
    }
}

function setMaxDate() {
    const day = friday.getDay();
    if (day === 6) {
        friday.setDate(friday.getDate() - 1);
    }
    else if (day === 0) {
        friday.setDate(friday.getDate() - 2);
    }
    else {
        const offset = 5 - friday.getDay();
        friday.setDate(friday.getDate() + offset);
    }
}

function createDays() {
    const days = createDaysArr();
    for (let i = 0; i < days.length; i++) {
        container.innerHTML += `
            <div class="flex-item" id="${i}">
                <h3>${days[i]}</h3>
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
        `
    }
}

function createDaysArr() {
    const days = [];
    const date = new Date(monday);
    while (date.getMonth() < friday.getMonth() || (date.getMonth() === friday.getMonth() && date.getDate() <= friday.getDate())) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        days.push(`${month}/${day}`);
        const column = getColumn(date);
        columns.push(column);
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function getDataForCurrentTimePeriod() {
    // get time period
    const firstColumn = columns[0];
    const lastColumn = columns[columns.length - 1];
    getStudentData(firstColumn, lastColumn);
}

function getColumn(date2) {
    try {
        const date1 = new Date("08/07/2023");
        // throws error if no date is selected

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

/*
[["Present","Present","Present","Present","Tardy"],
 ["","4"],
 ["GRADE","GRADES","GRADES","GRADES","GRADES"]]
*/
function getStudentData(start, end) {
    fetch(`http://localhost:8000/students/${studentID}/dailydata?start=${start}&end=${end}`)
    .then(function(response) {
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
    })
    .then(function(data) {
        const goal = data['goal'];
        textInput.value = goal;
        const dailyData = data['studentData'];
        const rows = dailyData.length;
        if (rows > 0) {
            for (i in dailyData[0]) {
                studentData.push([]);
                // Attendance
                studentData[i].push([dailyData[0][i]]);
                // ET grade
                (rows > 1 && i < dailyData[1].length && dailyData[1][i] !== '') ? studentData[i].push([Number(dailyData[1][i])]) : 
                                                                        studentData[i].push([]);
                // Letter grades
                (rows > 2  && i < dailyData[2].length && dailyData[2][i] !== '') ? studentData[i].push([dailyData[2][i]]) : 
                                                                         studentData[i].push([]);
                updateDay(i);
            }
            console.log(studentData);
        }
    })
    .catch(function(err) {
        console.log(err);
    });
}

function updateDay(i) {
    const div = document.getElementById(i);
    const select = div.getElementsByTagName('select')[0];
    select.value = studentData[i][0][0];
    const input = div.getElementsByTagName('input')[0];
    if (studentData[i][1].length > 0) {
        input.value = studentData[i][1][0];
    }
    const buttons = div.getElementsByTagName('button');
    if (studentData[i][2].length > 0) {
        const grades = studentData[i][2][0];
        for (button of buttons) {
            const letter = button.innerText;
            if (grades.includes(letter)) {
                button.style.backgroundColor = "green";
            }
        }
    }
}

function uploadButtonClicked() {
    try {
        const goal = textInput.value;
        const divs = container.getElementsByTagName("div");
        for (let i = 0; i < divs.length; i++) {
            if (studentData[i][1].length > 0) {
                const etGrade = studentData[i][1][0];
                validateExitTicketGrade(etGrade);
            }
            if (studentData[i][2].length > 0) {
                sortParticipationGrades(i);
            }
        }
        const body = JSON.stringify({goal: goal, columns: columns, values: studentData});
        put(`http://localhost:8000/students/${studentID}/dailydata`, body);
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

function put(url, body) {
    fetch(url, {method: "PUT", body: body, headers: {
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