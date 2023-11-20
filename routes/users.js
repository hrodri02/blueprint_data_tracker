const {OAuth2Client} = require('google-auth-library');
const express = require('express');
const router = express.Router();
const config = require('config');
const db = require('../db/database');
const dbDebugger = require('debug')('app:db');
const sessionDebugger = require('debug')('app:session');

router.post('/signup', async (req, res) => {
    const client = new OAuth2Client();
    const token = req.body['credential'];

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.get('google.client_id'),
      });
      const payload = ticket.getPayload();
      const googleUserID = payload['sub'];
      const email = payload['email'];
      const name = payload['name'];
      // check if user is in DB
      let user = await getFellow(googleUserID);
      // if user is new, save them in the DB
      if (user == null) {
        const id = await insertFellow(googleUserID, email, name);
        user = await getFellow(id);
      }
      
      req.session.user = user;
      res.redirect('/');
    }
    catch (err) {
      dbDebugger(err.message);
      res.status(400).send({error: err.message});
    }
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
  req.session.destroy((err) => {
    if (err) {
      sessionDebugger(err.message);
    }
    res.end();
  });
});

module.exports = router;