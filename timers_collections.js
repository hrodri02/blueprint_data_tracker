const timers_collections_container = document.querySelector('.timers-collections-container');
const timers_collection_container = document.querySelector('.timers-collection-container');
/*
{
    id: {name: "", timers: []}
}
*/
let id_to_collection;
/*
{
    id:     0
    name:   ""
    timers: []
}
*/
let selected_timers_collection = JSON.parse(localStorage.getItem('selected_timers_collection'));

getTimersCollections();

function getTimersCollections() {
    get(`${protocol}://${domain}/users/me/timers_collections`, (collections) => {
        id_to_collection = collections;
        console.log(id_to_collection);
        addTimerCollectionsToContainer(collections);
    });
}

function addTimerCollectionsToContainer(collections) {
    for (collection_id of Object.keys(collections)) {
        addCollectionToContainer(collection_id, id_to_collection[collection_id]);
        if (selected_timers_collection && selected_timers_collection.id === collection_id) {
            // add the timers of the current collection to the timers collection container
            addTimersToContainer(id_to_collection[collection_id].timers);
        }
    }
}

function addCollectionToContainer(id, collection) {
    const name = collection.name;
    const background_color = (selected_timers_collection && selected_timers_collection.id === id)? '#444' : 'black';
    timers_collections_container.innerHTML += `
        <div class="timers-collections-flex-item" id="${id}" onclick="collectionSelected()" style="background-color:${background_color};">
            <label>${name}</label>
        </div>
    `;
}

function addTimersToContainer(timers) {
    for (timer of timers) {
        addTimerToContainer(timer);
    }
}

function addTimerToContainer(timer) {
    timers_collection_container.innerHTML += `
        <div class="timers-collection-flex-item" id="timer-${timer.id}" style="background-color:${timer.background_color};color:${timer.text_color}">
            <label>${timer.name} (${timer.minutes} minutes)</label>
            <div class="timer-dropdown">
                <i class="fa-solid fa-ellipsis" onclick="ellipsisTimerButtonClicked()"></i>
                <div class="timer-dropdown-content">
                    <a id="delete-timer-button" href="#" onclick="deleteTimerButtonClicked()">Delete from list</a>
                    <a id="edit-timer-button" href="#" onclick="editTimerButtonClicked()">Edit</a>
                </div>
            </div>
        </div>
    `;
}

function collectionSelected() {
    // unselect current collection 
    if (selected_timers_collection) {
        const selected_div = document.getElementById(selected_timers_collection.id);
        selected_div.style.backgroundColor = "black";
        removeTimersFromContainer();
    }
    // change the background color of div
    const div = event.srcElement;
    const collection_id = div.id;
    const collection_name = id_to_collection[collection_id].name;
    const collection_timers = id_to_collection[collection_id].timers;
    div.style.backgroundColor = "#444";
    // update selected timers collection
    const timers_collection = {
        id: collection_id,
        name: collection_name,
        timers: collection_timers
    };
    localStorage.setItem('selected_timers_collection', JSON.stringify(timers_collection));
    selected_timers_collection = timers_collection;
    addTimersToContainer(timers_collection.timers);
}

function removeTimersFromContainer() {
    const flex_items = timers_collection_container.getElementsByClassName('timers-collection-flex-item');
    const init_length = flex_items.length;
    for (let i = 0; i < init_length; i++) {
        const child = flex_items[0];
        timers_collection_container.removeChild(child); 
    } 
}

function addTimersCollectionButtonClicked() {
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="popup-top-nav">
            <h3>Add New Timers Collection</h3>
            <button class="cancel-button" onclick="closePopup()"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="popup-body">
            <div class="popup-input-container">
                <label for='timers-collection-name'>Name:</label>
                <input id='timers-collection-name' name='timers-collection-name' type="text" minlength="1">
            </div>
            <div class="popup-body-bottom">
                <button onclick="createTimersCollection()">Create</button>
            </div>
        </div>
    `;
    div.classList.add("popup-container");
    document.body.appendChild(div);
}

function closePopup() {
    const blackContainer = document.querySelector('.black-container');
    document.body.removeChild(blackContainer);
    const div = document.querySelector('.popup-container');
    document.body.removeChild(div);
}

function createTimersCollection() {
    const input = document.getElementById('timers-collection-name');
    const name = input.value;
    const body = JSON.stringify({
        name: name
    });

    post(`${protocol}://${domain}/users/me/timers_collections`, body, (timers_collection) => {
        addCollectionToContainer(timers_collection.id, timers_collection);
        id_to_collection[timers_collection.id].timers = [];
        closePopup(); 
    });
}

function addTimerButtonClicked() {
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="popup-top-nav">
            <h3>Add New Timer</h3>
            <button class="cancel-button" onclick="closePopup()"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="popup-body">
            <div class="popup-input-container">
                <div class"popup-input-flex-item>
                    <label for='timer-name'>Name:</label>
                    <input id='timer-name' name='timer-name' type="text" minlength="1">
                </div>
                <div class"popup-input-flex-item>
                    <label for='timer-mins'>Minutes:</label>
                    <input id='timer-mins' name='timer-mins' type="number" min="1">
                </div>
                <div class"popup-input-flex-item>
                    <label for='timer-text-color'>Text color:</label>
                    <input id='timer-text-color' name='timer-text-color' type="color">
                </div>
                <div class"popup-input-flex-item>
                    <label for='timer-background-color'>Background color:</label>
                    <input id='timer-background-color' name='timer-background-color' type="color">
                </div>
            </div>
            <div class="popup-body-bottom">
                <button onclick="createTimer()">Create</button>
            </div>
        </div>
    `;
    div.classList.add("popup-container");
    document.body.appendChild(div);
}

function createTimer() {
    const name_input = document.getElementById('timer-name');
    const name = name_input.value;
    const mins_input = document.getElementById('timer-mins');
    const mins = Number(mins_input.value);
    const text_color_input = document.getElementById('timer-text-color');
    const text_color = text_color_input.value;
    const background_color_input = document.getElementById('timer-background-color');
    const background_color = background_color_input.value;

    const collection_id = selected_timers_collection.id;
    const order_id = selected_timers_collection.timers.length;
    const body = JSON.stringify({
        name: name,
        minutes: mins,
        text_color: text_color,
        background_color: background_color,
        timers_collection_id: collection_id,
        order_id: order_id
    });
    
    post(`${protocol}://${domain}/users/me/timers_collections/${collection_id}/timers`, body, (timer) => {
        selected_timers_collection.timers.push(timer);
        localStorage.setItem('selected_timers_collection', JSON.stringify(selected_timers_collection));
        addTimerToContainer(timer);
        closePopup(); 
    });
}

function ellipsisTimerButtonClicked() {
    const div = event.srcElement.parentElement;
    const dropdown = div.getElementsByClassName('timer-dropdown-content')[0];
    const style = window.getComputedStyle(dropdown);
    if (style.display === "none") {
        dropdown.style.display = "block";
    }
    else {
        dropdown.style.display = "none";
    }
}

function deleteTimerButtonClicked() {
    const dropdown = event.srcElement.parentElement;
    dropdown.style.display = "none";

    const collection_id = selected_timers_collection.id;
    const flex_item = dropdown.parentElement.parentElement;
    const timer_id = Number(flex_item.id.split('-')[1]);
    deleteRequest(`${protocol}://${domain}/users/me/timers_collections/${collection_id}/timers/${timer_id}`, () => {
        // remove timer from dictionary
        const timers = id_to_collection[collection_id].timers;
        const new_timers = timers.filter(function(timer) {
            return timer.id !== timer_id;
        });
        id_to_collection[collection_id].timers = new_timers;
        console.log(id_to_collection[collection_id].timers);
        // remove timer from selected_timers_collection
        selected_timers_collection.timers = new_timers;
        // save updated collection in storage
        localStorage.setItem('selected_timers_collection', JSON.stringify(selected_timers_collection));
        // remove timer from UI
        timers_collection_container.removeChild(flex_item);
    });
}

function editTimerButtonClicked() {
    const dropdown = event.srcElement.parentElement;
    dropdown.style.display = "none";
}