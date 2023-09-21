 // TODO(developer): Set to client ID and API key from the Developer Console
 const CLIENT_ID = '';
 const API_KEY = '';

 // Discovery doc URL for APIs used by the quickstart
 const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

 // Authorization scopes required by the API; multiple scopes can be
 // included, separated by spaces.
 const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

 let tokenClient;
 let gapiInited = false;
 let gisInited = false;

 /**
  * Callback after api.js is loaded.
  */
 function gapiLoaded() {
   gapi.load('client', initializeGapiClient);
 }

 /**
  * Callback after the API client is loaded. Loads the
  * discovery doc to initialize the API.
  */
 async function initializeGapiClient() {
   await gapi.client.init({
     apiKey: API_KEY,
     discoveryDocs: [DISCOVERY_DOC],
   });
   gapiInited = true;
   getAuth();
 }

 /**
  * Callback after Google Identity Services are loaded.
  */
 function gisLoaded() {
   tokenClient = google.accounts.oauth2.initTokenClient({
     client_id: CLIENT_ID,
     redirect_uri: 'http://localhost:8000',
     ux_mode: 'redirect',
     scope: SCOPES,
   });
   gisInited = true;
   getAuth();
 }

 /**
  * Enables user interaction after all libraries are loaded.
  */
 function getAuth() {
   if (gapiInited && gisInited) {
     handleAuthClick();
   }     
 }

 /**
  *  Sign in the user upon button click.
  */
 function handleAuthClick() {
   tokenClient.callback = async (resp) => {
     if (resp.error !== undefined) {
       throw (resp);
     }
     readFromSheet();
   };

   if (gapi.client.getToken() === null) {
     // Prompt the user to select a Google Account and ask for consent to share their data
     // when establishing a new session.
     tokenClient.requestAccessToken({prompt: 'consent'});
   } else {
     // Skip display of account chooser and consent dialog for an existing session.
     tokenClient.requestAccessToken({prompt: ''});
   }
 }

 /**
  *  Sign out the user upon button click.
  */
 function handleSignoutClick() {
   const token = gapi.client.getToken();
   if (token !== null) {
     google.accounts.oauth2.revoke(token.access_token);
     gapi.client.setToken('');
   }
 }

 /**
  * Print the names and majors of students in a sample spreadsheet:
  * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
  */
 async function readFromSheet() {
   let response;
   try {
     response = await gapi.client.sheets.spreadsheets.values.get({
       spreadsheetId: '1jFT3SCoOuMwJnsRJxuD7D2Eq6hKgne6nEam1RdLlPmM',
       range: 'Daily Data!B3:B300',
     });
   } catch (err) {
      console.log(err);
      return;
   }

   const range = response.result;
   if (!range || !range.values || range.values.length == 0) {
    //  document.getElementById('content').innerText = 'No values found.';
     return;
   }
   
   // convert 2D array to 1D array
   let students = [];
   for (i in range.values) {
    students = students.concat(range.values[i]);
   }

   // set sheet row for each student
   for (i in periods) {
      for (j in periods[i]) {
        const student = periods[i][j];
        const name = student.last_name + ", " + student.first_name;
        const index = containsSubstring(students, name);
        student.row = index + 3;
      }
   }
}

function containsSubstring(array, str) {
  let i = 0;
  for (substr of array) {
    if (str.includes(substr)) {
      return i;
    }
    i++;
  }
  return -1;
}

/*
  {
    "valueInputOption": "VALUE_INPUT_OPTION",
    "data": [
      {
        "range": "Sheet1!A1:A4",
        "majorDimension": "COLUMNS",
        "values": [
          ["Item", "Wheel", "Door", "Engine"]
        ]
      },
      {
        "range": "Sheet1!B1:D2",
        "majorDimension": "ROWS",
        "values": [
          ["Cost", "Stocked", "Ship Date"],
          ["$20.50", "4", "3/1/2016"]
        ]
      }
    ]
  }
*/
function batchUpdateValues(spreadsheetId, ranges, values, valueInputOption, callback) {
  const data = [];

  for (i in values) {
    data.push({
      range: "Daily Data!" + ranges[i],
      values: values[i],
    });
  }
  
  const body = {
    data: data,
    valueInputOption: valueInputOption,
  };
  try {
    gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: body,
    }).then((response) => {
      const result = response.result;
      console.log(`${result.totalUpdatedCells} cells updated.`);
      if (callback) callback(response);
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
}