const periodStrings = ["First", "Second", "Third", "Fourth", "Sixth", "Seventh"];
const lessonParts = ["Do Now", "Number Talk", "Launch", "Engage", "Summary", "Exit Ticket"]
const classNames = ["doNow", "numberTalk", "launch", "engage", "summary", "exitTicket"];
const colors = ["blue", "orange", "yellow", "green", "lightblue", "red"];
const timesInMS = [5*60000, 8*60000, 5*60000, 15*60000, 5*60000, 5*60000];
// const timesInMS = [1000, 1000, 1000, 1000, 1000, 1000];

const periods = [
    // 1st period
    [{"id": 0, "period": 1, "first_name": "Joseph", "last_name": "Logwood", "grades": []}, 
    {"id": 1, "period": 1, "first_name": "Makaiden", "last_name": "Vongphrachanh", "grades": []},
    {"id": 2, "period": 1, "first_name": "Carly", "last_name": "Guerrero", "grades": []},
    ],
    // 2nd period
    [{"id": 3, "period": 2, "first_name": "Uavalu", "last_name": "Kauvaka", "grades": []},
    {"id": 4, "period": 2, "first_name": "Navie", "last_name": "Davis", "grades": []},
    {"id": 5, "period": 2, "first_name": "Prince", "last_name": "Leggett","grades": []}
    ],
    // 3rd period
    [{"id": 6, "period": 3, "first_name": "Benjamin", "last_name": "Inthavong", "grades": []}, 
    {"id": 7, "period": 3, "first_name": "Emmanuel", "last_name": "Garcia Ponce","grades": []}, 
    {"id": 8, "period": 3, "first_name": "Alexandra", "last_name": "Covian Perez","grades": []},
    {"id": 9, "period": 3, "first_name": "Emeri", "last_name": "Hewitt","grades": []},
    {"id": 10, "period": 3, "first_name": "Alexa", "last_name": "Padilla Garcia","grades": []}
    ],
    // 4th period
    [{"id": 11, "period": 4, "first_name": "John", "last_name": "Solozano","grades": []},
    {"id": 12, "period": 4, "first_name": "David", "last_name": "Hernandez","grades": []},
    {"id": 13, "period": 4, "first_name": "Juliana", "last_name": "Ignacio Tinajero","grades": []},
    {"id": 14, "period": 4, "first_name": "Zacchaeus", "last_name": "Evans","grades": []},
    {"id": 15, "period": 4, "first_name": "Saniyah", "last_name": "Sims","grades": []},
    ],
    // 6th period
    [{"id": 16, "period": 6, "first_name": "Nhi", "last_name": "Truong","grades": []}, 
    {"id": 17, "period": 6, "first_name": "Brenda", "last_name": "Calmo Calmo","grades": []}, 
    {"id": 18, "period": 6, "first_name": "Luis", "last_name": "Chang Chilel","grades": []},
    {"id": 19, "period": 6, "first_name": "Caleb", "last_name": "Pablo","grades": []},
    {"id": 20, "period": 6, "first_name": "Alex", "last_name": "Pablo Ramirez","grades": []},
    {"id": 21, "period": 6, "first_name": "Lawrence", "last_name": "Ward","grades": []},
    ],
    // 7th period
    [{"id": 22, "period": 7, "first_name": "Carlos", "last_name": "Moran Flores","grades": []}, 
    {"id": 23, "period": 7, "first_name": "Arodi", "last_name": "Granados Funes","grades": []}, 
    {"id": 24, "period": 7, "first_name": "John", "last_name": "Martin-Garcia","grades": []},
    {"id": 25, "period": 7, "first_name": "Tysean", "last_name": "Kelly","grades": []},
    {"id": 26, "period": 7, "first_name": "Khloe", "last_name": "Pierce","grades": []},
    {"id": 27, "period": 7, "first_name": "Rebecca", "last_name": "Chales Pablo","grades": []},
    ]
]

const div = document.querySelector("div");
const lessonLabel = document.querySelector("h1");
const lessonTimerLabel = document.getElementById("timerLabel");
const bathroomTimerLabel = document.getElementById("bathroomTimerLabel");
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
    bathroomTimerLabel.innerText = `${mins}:${secsString}`;
}

function setupPeriods() {
    const container = document.getElementsByClassName("container")[0];
    for (period in periods) {
        // add period header
        const div = document.createElement("div");
        div.classList.add("header");
        div.id = periodStrings[period];
        const h1 = document.createElement("h1");
        // h1.style.backgroundColor = "black";
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
        
        // add students of the current period
        const students = periods[period];
        for (i in students) {
            const div = document.createElement("div");
            div.classList.add("item");
            div.id = students[i]["id"];
            const img = document.createElement("img");
            img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png";
            div.appendChild(img);
    
            const h3 = document.createElement("h3");
            const name = document.createTextNode(students[i]["first_name"]);
            h3.appendChild(name);
            div.appendChild(h3);
    
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
    
            container.appendChild(div);
        }
    }
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
            bathroomTimerLabel.innerText = `${mins}:${secs}`;
            clearInterval(bathroomTimerId);
        }
        else if (mins > 0 && secs == 0) {
            mins -= 1;
            secs = 59;
            bathroomTimerLabel.innerText = `${mins}:${secs}`;
        }
        else {
            const secsString = (secs < 10) ? "0" + secs.toString() : secs.toString();
            bathroomTimerLabel.innerText = `${mins}:${secsString}`;
        }
    }, 1000);
}

function gradeButtonClick() {
    const button = event.srcElement;
    const color = button.style.backgroundColor;
    const studentID = button.parentElement.id;
    const student = findStudentWith(studentID);

    if (color == "green") {
        button.style.backgroundColor = "";
        const index = student["grades"].indexOf(button.textContent);
        student["grades"].splice(index, 1);
    }
    else {
        button.style.backgroundColor = "green";
        student["grades"].push(button.textContent);
    }
}

function findStudentWith(studentID) {
    for (i in periods) {
        for (student of periods[i]) {
            if (student["id"] == studentID) {
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
    students = periods[index];
    let ranges = [];
    let values = [];
    for (i in students) {
        let arr = [];
        arr.push(["Present"]);
        arr.push([0]);
        const grades = convertGradeArrayToString(students[i]["grades"]);
        arr.push([grades]);
        values.push(arr);

        const row = students[i]["row"];
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

function convertGradeArrayToString(arr) {
    const letters = ['G', 'R', 'A', 'D', 'E', 'S'];
    const grades = letters.reduce((str, letter) => {
        if (arr.includes(letter)) {
            return str + letter;
        }
        return str;
    }, "");

    return grades;
}

function getColumn() {
    const date1 = new Date("08/07/2023");
    const date2 = new Date("09/18/2023");
        
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
        students[i]["grades"] = []
        // update the colors of the grades buttons   
        const div = document.getElementById(students[i]["id"])
        for (node of div.childNodes) {
            if (node.tagName === "BUTTON") {
                node.style.backgroundColor = "";
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