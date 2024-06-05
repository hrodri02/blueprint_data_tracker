function yesButtonClicked() {
    get(`${protocol}://${domain}/google/auth`);
}

function noButtonClicked() {
    window.location.href = `${protocol}://${domain}`;
}