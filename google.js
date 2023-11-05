const fs = require('fs').promises;
const {google} = require('googleapis');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:8000/oauth2callback'
);

oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
        // TODO: - store refresh token in a database
        try { 
        fs.writeFile('refreshToken.txt', tokens.refresh_token); 
        console.log("File has been saved.");
        } catch (error) { 
        console.error(err); 
        } 
    }
    // console.log(tokens.access_token);
});

module.exports = oauth2Client;