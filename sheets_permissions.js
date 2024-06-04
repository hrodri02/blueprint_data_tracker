const domain = 'localhost:8000';
const protocol = 'http';

function yesButtonClicked() {
    get(`${protocol}://${domain}/google/auth`);
}

function noButtonClicked() {
    // TODO: go to the students page
    /*
        When user first goes to students page, they won't see any students or
        prompted to finish the account setup.

        If they visit it again they will be prompted to finish the account setup.
        If they chose to accept they can be redirected to the sheets permissions
        page, otherwise the prompt will close. 
    */
    window.location.href = `${protocol}://${domain}`;
}