const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db/database');

router.get('/', (req, res) => {
    const user = req.session.user;
    if (user) {
        if (user.sheets_permissions && user.sheet_id) {
            const filePath = path.join(__dirname, '../public/students.html');
            res.sendFile(filePath);  
        }
        else if (user.sheets_permissions)
        {
            res.sendFile(path.join(__dirname, '../public/sheet_url.html'));
        }
        else {
            res.sendFile(path.join(__dirname, '../public/sheets_permissions.html'));
        }
    }
    else {
        res.sendFile(path.join(__dirname, '../public/signup.html'));
    }
});

module.exports = router;