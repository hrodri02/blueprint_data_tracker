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

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
            res.send(chunk);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        res.send(`problem with request: ${e.message}`);
    });

    req.end();
});

module.exports.aws = router;