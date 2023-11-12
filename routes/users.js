const {OAuth2Client} = require('google-auth-library');
const express = require('express');
const router = express.Router();
const CLIENT_ID = process.env.CLIENT_ID;
const db = require('../db/database');
const dbDebugger = require('debug')('app:db');
const fsDebugger = require('debug')('app:fs');
const fs = require('fs');
const path = require('path');

router.post('/signup', async (req, res) => {
    const client = new OAuth2Client();
    const token = req.body['credential'];
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleUserID = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    // check if user is in DB
    let user = await getFellow(googleUserID);
    // if user is new, save them in the DB
    if (user == null) {
        try {
            const id = await insertFellow(googleUserID, email, name);
            user = await getFellow(id);
        }
        catch (err) {
            dbDebugger(err);
        }
    }

    req.session.user = user;

    // TODO: move hostname to a varaible
    res.redirect('http://localhost:8000/students.html');
});

async function getFellow(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM fellows WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err.message);
        }
        else {
          resolve(row);
        }
      });
    });
}

async function insertFellow(id, email, name) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO fellows(id, email, name) VALUES(?, ?, ?)';
      db.run(sql, [id, email, name], (err, row) => {
        if (err) {
          reject(err.message);
        }
        else {
          resolve(this.lastID);
        }
      });
    });
}

router.get('/signout', (req, res) => {
  req.session.destroy();
  const tokenFile = path.join(__dirname, '../refreshToken.txt');
  fs.unlink(tokenFile, (err) => {
    if (err) {
      fsDebugger(err);
    }
    else {
      fsDebugger('Deleted refresh token');
    }
  });
  res.send();
});

module.exports = router;