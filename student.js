const url = new URL(location.href); 
const studentID = url.searchParams.get("id");
const studentName = url.searchParams.get("title");

const h1 = document.querySelector('h1');
h1.innerText = studentName;

const container = document.getElementsByClassName('days-flex-container')[0];
const monday = new Date();
const friday = new Date();

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

/*
[["Present","Present","Present","Present","Tardy"],
 ["","4"],
 ["GRADE","GRADES","GRADES","GRADES","GRADES"]]
*/
function createDays() {
    const days = createDaysArr();
    for (let i = 0; i < days.length; i++) {
        container.innerHTML += `
            <div class="flex-item" id="${i}">
                <h3>${days[i]}</h3>
                <select>
                    <option value="">--Attendance--</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Tardy">Tardy</option>
                    <option value="Left Early">Left Early</option>
                    <option value="No Session">No Session</option>
                    <option value="No School">No School</option>
                </select>
                <input type='number' min='0' max='4'>
                <button>G</button>
                <button>R</button>
                <button>A</button>
                <button>D</button>
                <button>E</button>
                <button>S</button>
            </div>
        `
    }
}

function createDaysArr() {
    const days = [];
    const date = new Date(monday);
    while (date.getDate() <= friday.getDate()) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        days.push(`${month}/${day}`);
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function getDataForCurrentTimePeriod() {
    // get time period
    const columnForMonday = getColumn(monday);
    const columnForFriday = getColumn(friday);
    getStudentData(columnForMonday, columnForFriday);
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
        const rows = data.length;
        if (rows > 0) {
            for (i in data[0]) {
                const dayData = [];
                // Attendance
                dayData.push(data[0][i]);
                // ET grade
                (rows > 1 && i < data[1].length) ? dayData.push(data[1][i]) : dayData.push("");
                // Letter grades
                (rows > 2  && i < data[2].length) ? dayData.push(data[2][i]) : dayData.push("");
                updateDay(i, dayData);
            }
        }
    })
    .catch(function(err) {
        console.log(err);
    });
}

function updateDay(i, dayData) {
    const div = document.getElementById(i);
    const select = div.getElementsByTagName('select')[0];
    select.value = dayData[0];
    const input = div.getElementsByTagName('input')[0];
    input.value = dayData[1];
    const buttons = div.getElementsByTagName('button');
    const grades = dayData[2];
    for (button of buttons) {
        const letter = button.innerText;
        if (grades.includes(letter)) {
            button.style.backgroundColor = "green";
        }
    }
}