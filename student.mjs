import { hash } from './hash.mjs';
import { validateExitTicketGrade } from './validate_student.mjs';
import { sortParticipationGrades } from './participation_letters.mjs';

const url = new URL(location.href); 
const studentID = Number(url.searchParams.get("id"));
const period = url.searchParams.get("period");

const h1 = document.querySelector('h1');
const weekInput = document.getElementById('week');
const goalLabel = document.getElementById('goal');
const container = document.getElementsByClassName('days-flex-container')[0];
const studentNotesContainer = document.getElementById('student-notes-container');
const student_profile_image = document.querySelector('.student-profile-image-container').querySelector('img');

const MAX_IMAGE_SIZE = 1000000
const WEEKDAYS = 5;
const original = {};

let year;
let week;
let dates = [];
/*
[
    [[],[],[]], [[],[],[]], [[],[],[]], [[],[],[]], [[],[],[]]
]
*/
let studentData = [];
let selected_students = [];
let student;
let selected_image_file = null;

// add click listeners to buttons
document.getElementById('edit-math-goal-button').addEventListener('click', editMathGoalButtonClicked);
document.getElementById('week').addEventListener('change', onWeekChanged);
document.getElementById('edit-image-button').addEventListener('click', editImageButtonClicked);
document.getElementById('upload').addEventListener('click', uploadButtonClicked);
document.getElementById('add-note-button').addEventListener('click', addNoteButtonClicked);

setStudent();
setWeek();
setDates();
createDays();
setDatesForDays();
getDataForCurrentWeek();
getStudentNotes();

function setStudent() {
    selected_students = JSON.parse(localStorage.getItem('selected_students'));
    const index = (period < 5)? period - 1 : period - 2;
    for (const s of selected_students[index]) {
        if (s['id'] === studentID) {
            student = s;
            break;
        }
    }
    h1.innerText = student['name'];
    const goal = student['goal'];
    goalLabel.innerText = goal;
    student_profile_image.src = student['profile_image_url'];
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
                <select class="attendance-select">
                    <option value="">--Attendance--</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Tardy">Tardy</option>
                    <option value="Left Early">Left Early</option>
                    <option value="No Session">No Session</option>
                    <option value="No School">No School</option>
                </select>
                <input class="exit-ticket-input" type='number' min='0' max='4'>
                <button class="grade-button">G</button>
                <button class="grade-button">R</button>
                <button class="grade-button">A</button>
                <button class="grade-button">D</button>
                <button class="grade-button">E</button>
                <button class="grade-button">S</button>
            </div>
        `;
    }
    const attendanceSelects = document.querySelectorAll('.attendance-select');
    attendanceSelects.forEach( select => select.addEventListener('change', onAttendanceValueChanged) );
    const exitTicketInputs = document.querySelectorAll('.exit-ticket-input');
    exitTicketInputs.forEach( input => input.addEventListener('change', onExitTicketGradeChanged) );
    const gradeButtons = document.querySelectorAll('.grade-button');
    gradeButtons.forEach( button => button.addEventListener('click', gradeButtonClick) );
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
        console.error(err.message);
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
        for (const button of buttons) {
            const letter = button.innerText;
            if (grades.includes(letter)) {
                button.style.backgroundColor = "green";
            }
        }
    }
}

function hashData(key, data) {
    original[key] = hash(data);
}

function getStudentNotes() {
    get(`${protocol}://${domain}/students/${studentID}/notes`, (notes) => {
        addNotesToContainer(notes);
    });
}

function addNotesToContainer(notes) {
    for (const note of notes) {
        addNoteToContainer(note);
    }
}

function addNoteToContainer(student_note) {
    const date = parseISOString(student_note['date']);
    const formattedDate = formatDate(date);
    studentNotesContainer.innerHTML += `
        <div class="notes-flex-item" id="note-${student_note.id}">
            <div class="notes-flex-item-header">
                <label>${formattedDate}</label>
                <div class="note-dropdown">
                    <i class="fa-solid fa-ellipsis"></i>
                    <div class="note-dropdown-content">
                        <a id="delete-note-button" href="#">Delete from list</a>
                        <a id="edit-note-button" href="#">Edit</a>
                    </div>
                </div>
            </div>
            <p>${student_note['note']}</p>
        </div>
    `;
    const ellipsisButton = studentNotesContainer.querySelector('.fa-ellipsis');
    ellipsisButton.addEventListener('click', ellipsisButtonClicked);
    const deleteNoteButton = div.getElementById('delete-note-button');
    deleteNoteButton.addEventListener('click', deleteNoteButtonClicked);
    const editNoteButton = div.getElementById('edit-note-button');
    editNoteButton.addEventListener('click', editNoteButtonClicked);
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
                studentData[i][2] = sortParticipationGrades(studentData[i][2][0]);
            }

            if (isStudentDataUpdated(dates[i], studentData[i])) {
                const column = getColumn(dates[i]);
                columns.push(column);
                daysModified.push(studentData[i]);
            }
        }
        
        if (daysModified.length > 0) {
            const dailyDataBody = JSON.stringify({columns: columns, values: daysModified});
            const headers = {
                "Content-Type": "application/json",
            };
            patch(`${protocol}://${domain}/students/${studentID}/dailydata`, dailyDataBody, headers);
        }
    }
    catch (err) {
        alert(err.message);
    }
}

function getColumnsForDates() {
    const columns = [];
    for (const date of dates) {
        const column = getColumn(date);
        columns.push(column);
    }
    return columns;
}

function isStudentDataUpdated(date, data) {
    const current_hash = hash(data);
    // console.log(`json: ${json}\nhash: ${hash}`);
    const monthDay = convertDateToMonthAndDay(date);
    if (original[monthDay] === current_hash) {
        console.log(`${monthDay}: data is the same.`);
    }
    else {
        console.log(`${monthDay}: data changed.`);
    }
    return original[monthDay] !== current_hash;
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
    for (const div of divs) {
        const select = div.getElementsByTagName('select')[0];
        select.value = "";
        const etInput = div.getElementsByTagName('input')[0];
        etInput.value = "";
        for (const button of div.getElementsByTagName('button')) {
            button.style.backgroundColor = "";
        }
    }
}

function editImageButtonClicked() {
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="popup-top-nav">
            <h3>Select an image</h3>
            <button class="cancel-button"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="popup-body">
            <div class="popup-input-container">
                <input class="file-input" type="file" accept="image/jpeg">
            </div>
            <div class="popup-body-bottom">
            </div>
        </div>
    `;
    div.classList.add("popup-container");
    document.body.appendChild(div);
    const fileInput = document.querySelector('.file-input');
    fileInput.addEventListener('change', onFileChange);
    addEventListenerToCancelButton();
}

function addEventListenerToCancelButton() {
    const button = document.querySelector('.cancel-button');
    button.addEventListener('click', closePopup);
}

function onFileChange() {
    let files = event.target.files || event.dataTransfer.files;
    if (!files.length) return;
    createImage(files[0])
}

function createImage(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (!e.target.result.includes('data:image/jpeg')) {
        return alert('Wrong file type - JPG only.')
      }
      if (e.target.result.length > MAX_IMAGE_SIZE) {
        return alert('Image is loo large.')
      }
      selected_image_file = e.target.result;
      showSelectedImage();
    }
    reader.readAsDataURL(file);
}

function showSelectedImage() {
    const input_container = document.querySelector('.popup-input-container');
    input_container.innerHTML = `
        <img src="${selected_image_file}"/>
    `;
    const bottom_container = document.querySelector('.popup-body-bottom');
    bottom_container.innerHTML = `
        <button id='remove-image-button'>Remove image</button>
        <button id='upload-image-button'>Upload image</button>
    `;
    const removeImageButton = div.getElementById('remove-image-button');
    removeImageButton.addEventListener('click', removeImage);
    const uploadImageButton = div.getElementById('upload-image-button');
    uploadImageButton.addEventListener('click', uploadImage);
}

function removeImage() {
    const input_container = document.querySelector('.popup-input-container');
    input_container.innerHTML = `
        <input type="file" accept="image/jpeg">
    `;
    const bottom_container = document.querySelector('.popup-body-bottom');
    bottom_container.innerHTML = ``;
    const fileInput = document.querySelector('.file-input');
    fileInput.addEventListener('change', onFileChange);
}

async function uploadImage() {
    createLoader();
    try {
        const {uploadURL, key} = await getPresignedURLAndkey();
        const blob_data = convertBase64ImageDataToArrayOfASCIICharacters();
        await uploadImageToS3(uploadURL, blob_data);
        uploadStudentProfileImageURL(key);
    }
    catch (e) {
        console.log(e);
        removeLoader();
        closePopup();
    }
}

function convertBase64ImageDataToArrayOfASCIICharacters() {
    const parts = selected_image_file.split(',');
    const image_data = parts[1];
    const binary = atob(image_data);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    const blob_data = new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    return blob_data;
}

async function getPresignedURLAndkey() {
    const img_url = student['profile_image_url'];
    let getSignedURL = `${API_GATEWAY_ENPOINT}/signedURL?action=put`;
    if (img_url.startsWith(S3_BUCKET_ENDPOINT)) {
        const key = getKeyOfImageURL(img_url);
        getSignedURL += `&key=${key}`;    
    }
    const response = await fetch(getSignedURL);
    const json = await response.json();
    return json;
}

function getKeyOfImageURL(img_url) {
    const key = img_url.replace(`${S3_BUCKET_ENDPOINT}/`, "");
    return key;
}

async function uploadImageToS3(uploadURL, blob_data) {
    await fetch(uploadURL, {
        method: 'PUT',
        body: blob_data
    });
}

function uploadStudentProfileImageURL(key) {
    const img_url = `${S3_BUCKET_ENDPOINT}/${key}`;
    student['profile_image_url'] = img_url;
    const body = JSON.stringify(student);
    const headers = {'Content-Type': 'application/json'};
    patch(`${protocol}://${domain}/students/${studentID}`, body, headers, () => {
        removeLoader();
        updateStudentImage();
        closePopup();
    });
}

function updateStudentImage() {
    student_profile_image.src = student['profile_image_url'];
}

function editMathGoalButtonClicked() {
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="popup-top-nav">
            <h3>Edit Math Goal</h3>
            <button class="cancel-button"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="popup-body">
            <div class="popup-input-container">
                <input type="text" id="new-goal" maxlength="100" value="${student['goal']}" style="width:90%;">
            </div>
            <div class="popup-body-bottom">
                <button id='upload-goal-button'>Confirm</button>
            </div>
        </div>
    `;
    div.classList.add("popup-container");
    document.body.appendChild(div);
    const uploadGoalButton = document.getElementById('upload-goal-button');
    uploadGoalButton.addEventListener('click', uploadGoal);
    addEventListenerToCancelButton();
}

function uploadGoal() {
    const newGoalInput = document.getElementById('new-goal');
    const goal = newGoalInput.value;
    if (isStudentGoalUpdated(goal)) {
        hashData('goal', goal);

        const body = JSON.stringify({goal: goal});
        const headers = {
            "Content-Type": "application/json",
        };
        patch(`${protocol}://${domain}/students/${studentID}`, body, headers, (updated_student) => {
            goalLabel.innerText = updated_student['goal'];
            closePopup();
        });
    }
}

function isStudentGoalUpdated(goal) {
    const current_hash = hash(goal);
    // console.log(`json: ${json}\nhash: ${hash}`);
    if (original['goal'] === current_hash) {
        console.log(`goal is the same.`);
    }
    else {
        console.log(`goal changed.`);
    }
    return original['goal'] !== current_hash;
}

function addNoteButtonClicked() {
    createStudentNotePopup('Add New Note', 'Upload Note');
    const noteBottomButton = document.getElementById('note-bottom-button');
    noteBottomButton.addEventListener('click', uploadNoteButtonClicked);
}

function closePopup() {
    const blackContainer = document.querySelector('.black-container');
    document.body.removeChild(blackContainer);
    const div = document.querySelector('.popup-container');
    document.body.removeChild(div);
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
        closePopup();
    });
}

function ellipsisButtonClicked() {
    const div = event.srcElement.parentElement;
    const dropdown = div.getElementsByClassName('note-dropdown-content')[0];
    const style = window.getComputedStyle(dropdown);
    if (style.display === "none") {
        dropdown.style.display = "block";
    }
    else {
        dropdown.style.display = "none";
    }
}

function deleteNoteButtonClicked() {
    const dropdown = event.srcElement.parentElement;
    dropdown.style.display = "none";
    
    const note_id_str = dropdown.parentElement.parentElement.parentElement.id;
    const note_id = Number(note_id_str.split('-')[1]);
    createLoader();
    deleteRequest(`${protocol}://${domain}/students/${studentID}/notes/${note_id}`, () => {
        // remove note from UI
        const div = document.getElementById(note_id_str);
        studentNotesContainer.removeChild(div);
        removeLoader();
    });
}

function editNoteButtonClicked() {
    const dropdown = event.srcElement.parentElement;
    dropdown.style.display = "none";

    const note_flex_item = dropdown.parentElement.parentElement.parentElement;
    const note_id_str = note_flex_item.id;
    const note_id = Number(note_id_str.split('-')[1]);
    const note_text = note_flex_item.querySelector('p').innerText;
    createStudentNotePopup('Edit Note', 'Upload Note', note_text);
    const noteBottomButton = document.getElementById('note-bottom-button');
    noteBottomButton.addEventListener('click', () => uploadEditedNote(note_id));
}

function uploadEditedNote(note_id) {
    const studentNoteTextArea = document.getElementById('student-note');
    const note = studentNoteTextArea.value;
    const date = new Date();
    const body = JSON.stringify({
        id: note_id,
        note: note,
        date: date.toISOString()
    });
    const headers = { "Content-Type": "application/json" };
    createLoader();
    put(`${protocol}://${domain}/students/${studentID}/notes/${note_id}`, body, headers, (updated_note) => {
        // update UI
        const note_flex_item = document.getElementById(`note-${note_id}`);
        const p = note_flex_item.querySelector('p');
        p.innerText = updated_note.note;
        const date = parseISOString(updated_note.date);
        const formattedDate = formatDate(date);
        const date_label = note_flex_item.querySelector('label');
        date_label.innerText = formattedDate;
        closePopup();
        removeLoader();
    });
}

function createStudentNotePopup(header_name, button_name, note_text = '') 
{
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="popup-top-nav">
            <h3>${header_name}</h3>
            <button class="cancel-button"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="popup-body">
            <textarea id='student-note' name='note'>${note_text}</textarea>
            <div class="popup-body-bottom">
                <button id='note-bottom-button'>${button_name}</button>
            </div>
        </div>
    `;
    div.classList.add("popup-container");
    document.body.appendChild(div);
    addEventListenerToCancelButton();
}