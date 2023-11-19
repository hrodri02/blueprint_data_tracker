const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, '../public/students.html'));  
    }
    else {
        res.sendFile(path.join(__dirname, '../public/signup.html'));
    }
});

module.exports = router;