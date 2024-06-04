const domain = 'localhost:8000';
const protocol = 'http';
const sheetUrlInput = document.getElementById('input-url');
const tutorNameInput = document.getElementById('tutor-name');

async function submitButtonClicked() {
    const urlText = sheetUrlInput.value;
    const tutorName = tutorNameInput.value;
    const put_body = JSON.stringify({'url': urlText, 'tutor_name': tutorName});
    const put_headers = {
        "Content-Type": "application/json",
        "x-context": "/"
    }
    createLoader();
    patch(`${protocol}://${domain}/users/me`, put_body, put_headers, () => {
        const post_body = JSON.stringify({});
        post(`${protocol}://${domain}/users/me/students`, post_body, () => {
            removeLoader();
            window.location.href = `${protocol}://${domain}`;
        });    
    });
}

function finishLaterButtonClicked() {
    window.location.href = `${protocol}://${domain}`;
}