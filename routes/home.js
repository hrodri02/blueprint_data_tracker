const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db/database');

router.get('/', (req, res) => {
    const user = req.session.user;
    if (user) {
        const filePath = path.join(__dirname, '../public/students.html');
        res.sendFile(filePath);
    }
    else {
        res.sendFile(path.join(__dirname, '../public/signup.html'));
    }
});

module.exports = router;