getInstanceIPAddress();

function getInstanceIPAddress() {
    console.log('getInstanceIPAddress');
    get('http://instance-data/latest/meta-data/public-ipv4', (data) => {
        console.log(data);
    });
}

function get(url, callback = () => {}) {
    fetch(url).then(function(response) {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        else {
            return response.json();
        }
      }).then(function(data) {
        callback(data);
      }).catch(function(err) {
        console.log(err);
      });
}