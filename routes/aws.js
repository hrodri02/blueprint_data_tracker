const express = require('express');
const router = express.Router();

router.get('/ec2-public-ipv4', (req, res) => {
    const token='curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"';

    const options = {
        hostname: 'http://169.254.169.254',
        port: 80,
        path: '/latest/meta-data/public-ipv4',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-aws-ec2-metadata-token': token,
        },
    };

    const request = http.request(options, (response) => {
        console.log(`STATUS: ${response.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
            response.send(chunk);
        });
        response.on('end', () => {
            console.log('No more data in response.');
        });
    });

    request.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        response.send(`problem with request: ${e.message}`);
    });

    request.end();
});

module.exports.aws = router;