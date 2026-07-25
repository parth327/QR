const express = require('express');
const fs = require('fs');
const path = require('path');

const config = require('../config');
const db = require('../db');
const requireAdmin = require('../middleware/requireAdmin');
const { verifyPassword } = require('../utils/auth');

const router = express.Router();

// GET /admin/login
router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin/dashboard');
  res.render('admin-login', { error: null });
});

// POST /admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!config.adminPasswordHash) {
    return res.render('admin-login', {
      error: 'Admin password is not configured on the server. Check the .env file.',
    });
  }

  const validUsername = username === config.adminUsername;
  const validPassword = validUsername && verifyPassword(password, config.adminPasswordHash);

  if (validUsername && validPassword) {
    req.session.isAdmin = true;
    req.session.adminUsername = username;
    return res.redirect('/admin/dashboard');
  }

  res.render('admin-login', { error: 'Invalid username or password.' });
});

// POST /admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// GET /admin/dashboard -> list of all saved records + their QR codes
router.get('/dashboard', requireAdmin, (req, res) => {
  const search = (req.query.search || '').trim().toLowerCase();
  let records = db.getAllRecords();

  if (search) {
    records = records.filter((r) =>
      [r.name, r.location, r.education, r.phone, r.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(search))
    );
  }

  res.render('admin-dashboard', {
    records,
    total: db.countRecords(),
    search: req.query.search || '',
    adminUsername: req.session.adminUsername,
    baseUrl: config.baseUrl,
  });
});

// GET /admin/record/:id -> view single record details (admin view, reuses view-record page)
router.get('/record/:id', requireAdmin, (req, res) => {
  const record = db.getRecordById(req.params.id);
  if (!record) return res.status(404).render('404', { message: 'Record not found.' });
  res.render('view-record', { record, isAdmin: true });
});

// POST /admin/delete/:id -> delete a record and its files
router.post('/delete/:id', requireAdmin, (req, res) => {
  const record = db.getRecordById(req.params.id);
  if (record) {
    if (record.photo) {
      const photoPath = path.join(__dirname, '..', 'public', record.photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
    if (record.qrCode) {
      const qrPath = path.join(__dirname, '..', 'public', record.qrCode);
      if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
    }
    db.deleteRecord(req.params.id);
  }
  res.redirect('/admin/dashboard');
});

module.exports = router;
