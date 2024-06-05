async function post(url, body = JSON.stringify({}), callback = () => {}) {
    let json;
    try {
        const res = await fetch(url, {method: "POST", body: body, headers: {
            "Content-Type": "application/json",
        }});
        if (res.ok) {
            const contentType = res.headers.get('Content-Type');
            if (contentType === 'application/json; charset=utf-8') {
                json = await res.json();
            }
            else if (contentType === 'text/html; charset=UTF-8') {
                const html = await res.text();
                callback(html);
            }
        }
        else {
            throw new Error(`${url}: ${res.status} ${res.statusText}`);
        }
    }
    catch (error) {
        console.log(error);
        alert(`${url}: ${error}`);
    }
    
    if (json) {
        if (json['error_message']) {
            alert(url, json['error_message']);
        }
        else {
            callback(json);
        }
    }       
}

async function put(url, body = JSON.stringify({}), headers, callback = () => {}) {
    try {
        const res = await fetch(url, {method: "PUT", body: body, headers: headers});
        const json = await res.json();
        if (res.ok) {
            callback(json);
        } else {
            throw new Error(`${res.status} ${json['error_message']}`);
        }
    }
    catch (error) {
        console.log(`${url}: ${error}`);
        alert(error);
    }
}

/*
How to display custom server error message in the response body using fetch api
*/
async function patch(url, body = JSON.stringify({}), headers, callback = () => {}) {
    try {
        const res = await fetch(url, {method: "PATCH", body: body, headers: headers});
        const json = await res.json();
        if (res.ok) {
            callback(json);
        } else {
            throw new Error(`${res.status} ${json['error_message']}`);
        }
    }
    catch (error) {
        console.log(`${url}: ${error}`);
        alert(error);
    }
}

async function get(url, callback = () => {}) {
    let json;
    try {
        const res = await fetch(url);
        console.log(res);
        if (res.ok) {
            const contentType = res.headers.get('Content-Type');
            console.log('GET content type:', contentType);
            if (contentType === 'application/json; charset=utf-8') {
                json = await res.json();
            }    
            else if (contentType === 'text/html; charset=UTF-8') {
                console.log('GET - content type is text/html');
                callback();
            }
        }
        else {
            throw new Error(`${url}: ${res.status} ${res.statusText}`);
        }
    }
    catch (error) {
        alert(`${url}: ${error}`);
    }

    if (json) {
        if (json['error_message']) {
            alert(url, json['error_message']);
        }
        // case 1: user tried to access sheets, but has not given the app permission
        else if (json['authorizationUrl']) {
            window.location.href = json['authorizationUrl'];    
        }
        else {
            callback(json);
        }
    }
}

async function deleteRequest(url, callback = () => {}) {
    let json;
    try {
        const res = await fetch(url, {method: "DELETE"});
        removeLoader();
        if (res.ok) {
            json = await res.json();
        }
        else {
            throw new Error(`${url} ${res.status} ${res.statusText}`);
        }
    }
    catch (error) {
        alert(`${url}: ${error}`);
    }

    if (json) {
        if (json['error_message']) {
            alert(url, json['error_message']);
        }
        else {
            callback(json);
        }
    }
}