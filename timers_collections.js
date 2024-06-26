const timers_collections_container = document.querySelector('.timers-collections-container');
const timers_collection_container = document.querySelector('.timers-collection-container');
const add_timer_button = document.getElementById('add-timer-button');

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
let isDragging = false;
let currentElement = null;
let emptyRect = null;
let originalRect = null;
let flex_item_top_original = null;
let startX, startY, offsetX, offsetY;
let timer_flex_items = null;
/*
    {
    collection_id: {
      timer_id: {
        ...
      },
      ...
    },
    ...
  }
*/
const request_updates_for_timers = {};
const TIMERS_COLLECTIONS_LIMIT = 10;
const TIMERS_LIMIT = 10;
const MAX_DST_TO_RIGHT_SIDE_OF_SCREEN_IN_PX = 50;

getTimersCollections();
setupAddTimerButton();

function getTimersCollections() {
    createLoader();
    get(`${protocol}://${domain}/users/me/timers_collections`, (collections) => {
        id_to_collection = collections;
        addTimerCollectionsToContainer(collections);
        removeLoader();
    });
}

function setupAddTimerButton() {
    add_timer_button.style.pointerEvents = (selected_timers_collection)? "auto" : "none";
}

function addTimerCollectionsToContainer(collections) {
    for (collection_id of Object.keys(collections)) {
        addCollectionToContainer(collection_id, id_to_collection[collection_id]);
        if (selected_timers_collection && selected_timers_collection.id === collection_id) {
            // add the timers of the current collection to the timers collection container
            addTimersToContainer(id_to_collection[collection_id].timers);
            setTimerFlexItems();
            addMouseDownListersToTimers(id_to_collection[collection_id].timers);
        }
    }
}

function addCollectionToContainer(id, collection) {
    const name = collection.name;
    const background_color = (selected_timers_collection && selected_timers_collection.id === id)? '#444' : 'black';
    timers_collections_container.innerHTML += `
        <div class="timers-collections-flex-item" id="${id}" onclick="collectionSelected()" style="background-color:${background_color};">
            <label>${name}</label>
            <div class="timer-dropdown">
                <i class="fa-solid fa-ellipsis" onclick="ellipsisButtonClicked()"></i>
                <div class="timer-dropdown-content">
                    <a id="delete-collection-button" href="#" onclick="deleteTimersCollectionButtonClicked()">Delete from list</a>
                    <a id="edit-collection-button" href="#" onclick="editTimersCollectionButtonClicked()">Edit</a>
                </div>
            </div>
        </div>
    `;
}

function addTimersToContainer(timers) {
    for (timer of timers) {
        addTimerToContainer(timer);
    }
}

function setTimerFlexItems() {
    timer_flex_items = document.getElementsByClassName('timers-collection-flex-item');
}

function addMouseDownListersToTimers(timers) {
    for (timer of timers) {
        addMouseDownListener(timer.id);
    }
}

function addTimerToContainer(timer) {
    timers_collection_container.innerHTML += `
        <div class="timers-collection-flex-item" id="timer-${timer.id}" style="background-color:${timer.background_color};color:${timer.text_color};left:0px;top:0px;">
            <i class="fa-solid fa-bars" style="cursor: grab;"></i>
            <label>${timer.name} (${timer.minutes} minutes)</label>
            <div class="timer-dropdown">
                <i class="fa-solid fa-ellipsis" onclick="ellipsisButtonClicked()"></i>
                <div class="timer-dropdown-content">
                    <a id="delete-timer-button" href="#" onclick="deleteTimerButtonClicked()">Delete from list</a>
                    <a id="edit-timer-button" href="#" onclick="editTimerButtonClicked()">Edit</a>
                </div>
            </div>
        </div>
    `;
}

function addMouseDownListener(timer_id) {
    const flex_item = document.getElementById(`timer-${timer_id}`);
    const menu_icon = flex_item.querySelector('.fa-bars');
    menu_icon.addEventListener('mousedown', onMouseDown);
}

function onMouseDown(event) {
    isDragging = true;
    event.preventDefault();

    const menu_icon = event.target;
    currentElement = menu_icon.parentElement;
    currentElement.style.zIndex = 2;
    flex_item_top_original = parseFloat(currentElement.style.top);
    emptyRect = currentElement.getBoundingClientRect();
    originalRect = emptyRect;
    
    startX = event.clientX;
    startY = event.clientY;

    offsetX = startX - parseFloat(currentElement.style.left);
    offsetY = startY - parseFloat(currentElement.style.top);
    menu_icon.style.cursor = 'grabbing';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(event) {
    if (isDragging && currentElement) {
        const timer_flex_item = getIntersectingFlexItem();
        if (timer_flex_item) {
            moveTimerFlexItemToEmptyRect(timer_flex_item);
        }

        const moveX = event.clientX - offsetX;
        const moveY = event.clientY - offsetY;
        const original_x = originalRect.left;
        const new_x = original_x + moveX;
        if (new_x > window.innerWidth - MAX_DST_TO_RIGHT_SIDE_OF_SCREEN_IN_PX) {
            currentElement.style.left = `${window.innerWidth - MAX_DST_TO_RIGHT_SIDE_OF_SCREEN_IN_PX - original_x}px`;
        }
        else {
            currentElement.style.left = `${moveX}px`;
        }
        currentElement.style.top = `${moveY}px`;
    }
}

function getIntersectingFlexItem() {
    const flex_item_rect = currentElement.getBoundingClientRect();
    let timer_flex_item = null, max_area_percent = 0;
    for (item of timer_flex_items) {
        if (item === currentElement)
            continue;
        const b = item.getBoundingClientRect();
        if (isIntersecting(flex_item_rect, b)) {
            const intersection_area_percent = getIntersectionAreaPercentange(flex_item_rect, b);
            if (intersection_area_percent > 0.5 && intersection_area_percent > max_area_percent) {
                max_area_percent = intersection_area_percent;
                timer_flex_item = item;
            }
        }
    }
    return timer_flex_item;
}

function isIntersecting(a, b) {
    // b is to the right of a
    if (b.left > a.left + a.width)
        return false;

    // b is to the left of a
    if (a.left > b.left + b.width)
        return false;
    
    // b is above a
    if (a.top > b.top + b.height)
        return false;

    // b is below a
    if (b.top > a.top + a.height)
        return false;

    return true;
}

function getIntersectionAreaPercentange(a, b) {
    let width = 0, height = 0;
    // b is more to the right than a
    if (a.right <= b.right) {
        width = a.right - b.left;
    }
    else {
        width = b.right - a.left;
    }

    // b is lower than a
    if (b.bottom >= a.bottom) {
        height = a.bottom - b.top;
    }
    else {
        height = b.bottom - a.top;
    }

    return (width * height) / (a.width * a.height);
}

function moveTimerFlexItemToEmptyRect(flex_item) {
    const b_rect = flex_item.getBoundingClientRect();
    const item_top = parseFloat(flex_item.style.top);
    flex_item.style.top = `${emptyRect.top - b_rect.top + item_top}px`;
    emptyRect = b_rect;
}

function onMouseUp(event) {
    if (isDragging) {
        const menu_icon = event.target;
        const flex_item = currentElement;
        
        flex_item.style.left = '0px';
        const y_translation = emptyRect.top - originalRect.top;

        flex_item.style.top = `${y_translation + flex_item_top_original}px`;
        isDragging = false;
        currentElement.style.zIndex = 1;
        currentElement = null;
        menu_icon.style.cursor = 'grab';

        const sorted_flex_items = sortTimerFlexItemsByTop();
        updateOrderIdsOfSelectedTimers(sorted_flex_items);
        updateTimersOfIdToCollection();
        saveSelectedTimersCollectionInLocalStorage();
        saveUpdatedTimersToUpload();

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mousemup', onMouseUp);
    }
}

function sortTimerFlexItemsByTop() {
    const arr = [];
    for (item of timer_flex_items) {
        const item_id = Number(item.id.split('-')[1]);
        arr.push({
            top: item.getBoundingClientRect().top,
            item_id: item_id
        });
    }
    arr.sort((a, b) => a.top - b.top);
    return arr;
}

function updateOrderIdsOfSelectedTimers(sorted_flex_items) {
    const timers = selected_timers_collection.timers;
    for (timer of timers) {
        for (i in sorted_flex_items) {
            if (sorted_flex_items[i].item_id === timer.id) {
                timer.order_id = parseInt(i);
            }
        }
    }
    timers.sort((a, b) => a.order_id - b.order_id);
}

function updateTimersOfIdToCollection() {
    const timers = selected_timers_collection.timers;
    id_to_collection[selected_timers_collection.id].timers = timers;
}

function saveSelectedTimersCollectionInLocalStorage() {
    localStorage.setItem('selected_timers_collection', JSON.stringify(selected_timers_collection));
}

function saveUpdatedTimersToUpload() {
    const collection_id = selected_timers_collection.id;
    if (!(collection_id in request_updates_for_timers))
        request_updates_for_timers[collection_id] = {};

    const timers = selected_timers_collection.timers;
    for (timer of timers) {
        request_updates_for_timers[collection_id][timer.id] = timer;
    }
}

function uploadUpdatedTimers() {
    const body = JSON.stringify(request_updates_for_timers);
    const headers = { "Content-Type": "application/json" };
    patch(`${protocol}://${domain}/users/me/timers_collections/timers`, body, headers);
}

function collectionSelected() {
    const div = event.srcElement;
    if (div.tagName !== "DIV") {
        return;
    }
    // enable add timer button
    add_timer_button.style.pointerEvents = "auto";

    // unselect current collection 
    if (selected_timers_collection) {
        const selected_div = document.getElementById(selected_timers_collection.id);
        selected_div.style.backgroundColor = "black";
        removeTimersFromContainer();
    }
    // change the background color of div
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
    setTimerFlexItems();
    addMouseDownListersToTimers(timers_collection.timers);
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
    const num_collections = Object.keys(id_to_collection).length;
    if (num_collections < TIMERS_COLLECTIONS_LIMIT) {
        createTimersCollectionPopup('Add New Timers Collection', 'Create', 'createTimersCollection()');
    }
    else {
        alert(`You cannot have more than ${TIMERS_COLLECTIONS_LIMIT} collections.`);
    }
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
    createLoader();
    post(`${protocol}://${domain}/users/me/timers_collections`, body, (timers_collection) => {
        addCollectionToContainer(timers_collection.id, timers_collection);
        id_to_collection[timers_collection.id] = {"name": timers_collection.name, "timers": []};
        removeLoader();
        closePopup(); 
    });
}

function addTimerButtonClicked() {
    const collection_id = selected_timers_collection.id;
    const num_timers = id_to_collection[collection_id].timers.length;
    if (num_timers < TIMERS_LIMIT) {
        createTimerPopup('Add New Timer', 'Create', 'createTimer()');
    }
    else {
        alert(`You cannot create more than ${TIMERS_LIMIT} timers per collection.`);
    }
}

function createTimerPopup(header_name, button_name, button_function, 
                          name = '', mins = '', text_color = '#000', background_color = '#000') {
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="popup-top-nav">
            <h3>${header_name}</h3>
            <button class="cancel-button" onclick="closePopup()"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="popup-body">
            <div class="popup-input-container">
                <div class"popup-input-flex-item>
                    <label for='timer-name'>Name:</label>
                    <input id='timer-name' name='timer-name' type="text" minlength="1" value="${name}">
                </div>
                <div class"popup-input-flex-item>
                    <label for='timer-mins'>Minutes:</label>
                    <input id='timer-mins' name='timer-mins' type="number" min="1" value="${mins}">
                </div>
                <div class"popup-input-flex-item>
                    <label for='timer-text-color'>Text color:</label>
                    <input id='timer-text-color' name='timer-text-color' type="color" value="${text_color}">
                </div>
                <div class"popup-input-flex-item>
                    <label for='timer-background-color'>Background color:</label>
                    <input id='timer-background-color' name='timer-background-color' type="color" value="${background_color}">
                </div>
            </div>
            <div class="popup-body-bottom">
                <button onclick="${button_function}">${button_name}</button>
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
    
    createLoader();
    post(`${protocol}://${domain}/users/me/timers_collections/${collection_id}/timers`, body, (timer) => {
        id_to_collection[collection_id].timers.push(timer);
        selected_timers_collection.timers.push(timer);
        localStorage.setItem('selected_timers_collection', JSON.stringify(selected_timers_collection));
        addTimerToContainer(timer);
        setTimerFlexItems();
        addMouseDownListener(timer.id);
        removeLoader();
        closePopup();
    });
}

function ellipsisButtonClicked() {
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

function deleteTimersCollectionButtonClicked() {
    const dropdown = event.srcElement.parentElement;
    dropdown.style.display = "none";

    const collection_id = dropdown.parentElement.parentElement.id;
    createLoader();
    deleteRequest(`${protocol}://${domain}/users/me/timers_collections/${collection_id}`, () => {
        // remove collection from dictionary
        delete id_to_collection[collection_id];
        // remove collection from UI
        const div = document.getElementById(collection_id);
        timers_collections_container.removeChild(div);
        removeLoader();
        // if it is the selected collection
        if (selected_timers_collection && selected_timers_collection.id === collection_id) {
            // disable add timer button
            add_timer_button.style.pointerEvents = "none";
            // remove timers of collection from UI
            removeTimersFromContainer();
            // update selected collection 
            selected_timers_collection = null;
            localStorage.removeItem('selected_timers_collection');
        }
    });
}

function editTimersCollectionButtonClicked() {
    const dropdown = event.srcElement.parentElement;
    dropdown.style.display = "none";
    const collection_id = dropdown.parentElement.parentElement.id;
    const collection_name = id_to_collection[collection_id].name;
    createTimersCollectionPopup('Edit Timers Collection',
                                'Update',
                                `updateTimersCollection(${collection_id})`,
                                collection_name);
}

function createTimersCollectionPopup(header_name, button_name, button_function, collection_name = '') {
    const blackContainer = document.createElement('div');
    blackContainer.classList.add('black-container');
    document.body.appendChild(blackContainer);
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="popup-top-nav">
            <h3>${header_name}</h3>
            <button class="cancel-button" onclick="closePopup()"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="popup-body">
            <div class="popup-input-container">
                <label for='timers-collection-name'>Name:</label>
                <input id='timers-collection-name' name='timers-collection-name' type="text" minlength="1" value='${collection_name}'>
            </div>
            <div class="popup-body-bottom">
                <button onclick="${button_function}">${button_name}</button>
            </div>
        </div>
    `;
    div.classList.add("popup-container");
    document.body.appendChild(div);
}

function updateTimersCollection(collection_id) {
    const input = document.getElementById('timers-collection-name');
    const name = input.value;
    const fellow_id = JSON.parse(localStorage.getItem('fellow_id'));
    const body = JSON.stringify({
        id: collection_id,
        name: name,
        fellow_id: fellow_id
    });
    
    const headers = {
        "Content-Type": "application/json",
    };
    createLoader();
    put(`${protocol}://${domain}/users/me/timers_collections/${collection_id}`, body, headers, (updated_collection) => {
        // update dictionary
        id_to_collection[updated_collection.id].name = updated_collection.name;
        if (updated_collection.id === Number(selected_timers_collection.id)) {
            selected_timers_collection.name = updated_collection.name;
            localStorage.setItem('selected_timers_collection', JSON.stringify(selected_timers_collection));
        }
        // update UI
        const div = document.getElementById(updated_collection.id);
        const label = div.getElementsByTagName('label')[0];
        label.innerText = updated_collection.name;
        removeLoader();
        // hide popup
        closePopup();
    });
}

function deleteTimerButtonClicked() {
    const dropdown = event.srcElement.parentElement;
    dropdown.style.display = "none";

    const collection_id = selected_timers_collection.id;
    const flex_item = dropdown.parentElement.parentElement;
    const timer_id = Number(flex_item.id.split('-')[1]);
    createLoader();
    deleteRequest(`${protocol}://${domain}/users/me/timers_collections/${collection_id}/timers/${timer_id}`, () => {
        removeTimerFromCollection(collection_id, timer_id);
        removeLoader();
    });
}

function removeTimerFromCollection(collection_id, timer_id) {
    // remove timer from dictionary
    const timers = id_to_collection[collection_id].timers;
    const new_timers = timers.filter(function(timer) {
        return timer.id !== timer_id;
    });
    id_to_collection[collection_id].timers = new_timers;
    // remove timer from selected_timers_collection
    selected_timers_collection.timers = new_timers;
    // save updated collection in storage
    localStorage.setItem('selected_timers_collection', JSON.stringify(selected_timers_collection));
    // remove timer from UI
    const flex_item = document.getElementById(`timer-${timer_id}`);
    timers_collection_container.removeChild(flex_item);
}

function editTimerButtonClicked() {
    const dropdown = event.srcElement.parentElement;
    dropdown.style.display = "none";

    const div = dropdown.parentElement.parentElement;
    const timer_id = Number(div.id.split('-')[1]);
    const target_timer = getSelectedTimer(timer_id);
    createTimerPopup('Edit Timer', 'Update', `updateTimer(${timer_id})`,
                     target_timer.name, target_timer.minutes, target_timer.text_color, target_timer.background_color);
}

function getSelectedTimer(timer_id) {
    let target_timer = null;
    for (timer of selected_timers_collection.timers) {
        if (timer.id === timer_id) {
            target_timer = timer;
        }
    }
    return target_timer;
}

function updateTimer(timer_id) {
    const name_input = document.getElementById('timer-name');
    const name = name_input.value;
    const mins_input = document.getElementById('timer-mins');
    const mins = Number(mins_input.value);
    const text_color_input = document.getElementById('timer-text-color');
    const text_color = text_color_input.value;
    const background_color_input = document.getElementById('timer-background-color');
    const background_color = background_color_input.value;

    const body = JSON.stringify({
        name: name,
        minutes: mins,
        text_color: text_color,
        background_color: background_color
    });
    
    const headers = {
        "Content-Type": "application/json",
    };
    createLoader();
    patch(`${protocol}://${domain}/users/me/timers_collections/${collection_id}/timers/${timer_id}`, body, headers, (timer) => {
        // update data structures
        const timers = selected_timers_collection.timers;
        for (i in timers) {
            if (timers[i].id === timer_id) {
                timers[i] = timer;
            }
        }
        localStorage.setItem('selected_timers_collection', JSON.stringify(selected_timers_collection));

        const timers_in_dict = id_to_collection[collection_id].timers;
        for (i in timers_in_dict) {
            if (timers_in_dict[i].id === timer_id) {
                timers_in_dict[i] = timer;
            }
        }
        // update UI
        const div = document.getElementById(`timer-${timer_id}`);
        div.style.color = timer.text_color;
        div.style.backgroundColor = timer.background_color;
        const label = div.getElementsByTagName('label')[0];
        label.innerText = `${timer.name} (${timer.minutes} minutes)`;
        removeLoader();
        closePopup(); 
    });
}

window.addEventListener('beforeunload', uploadUpdatedTimers);