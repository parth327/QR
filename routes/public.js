const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const QRCode = require('qrcode');

const config = require('../config');
const db = require('../db');

const router = express.Router();

// ---- Photo upload setup ----
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) return cb(null, true);
  cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed for the photo.'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ---- QR code output folder ----
const qrDir = path.join(__dirname, '..', 'public', 'qrcodes');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

// GET /  -> redirect to register (friendly root)
router.get('/', (req, res) => {
  res.redirect('/register');
});

// GET /register -> show the public registration form (no login required)
router.get('/register', (req, res) => {
  res.render('register', { error: null, formData: {} });
});

// POST /register -> save details + generate unique QR code
router.post('/register', (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return res.render('register', { error: err.message, formData: req.body });
    }

    const { name, dob, gender, phone, email, location, address, education, occupation, notes } = req.body;

    if (!name || !name.trim() || !phone || !phone.trim() || !location || !location.trim()) {
      return res.render('register', {
        error: 'Please fill in all required fields (Name, Phone, Location).',
        formData: req.body,
      });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const record = {
      id,
      name: name.trim(),
      dob: dob || '',
      gender: gender || '',
      phone: phone.trim(),
      email: (email || '').trim(),
      location: location.trim(),
      address: (address || '').trim(),
      education: (education || '').trim(),
      occupation: (occupation || '').trim(),
      notes: (notes || '').trim(),
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      qrCode: `/qrcodes/${id}.png`,
      createdAt,
    };

    db.addRecord(record);

    const viewUrl = `${config.baseUrl}/view/${id}`;
    const qrPath = path.join(qrDir, `${id}.png`);

    QRCode.toFile(qrPath, viewUrl, { width: 400, margin: 2 }, (qrErr) => {
      if (qrErr) {
        console.error('QR generation failed:', qrErr);
        return res.status(500).send('Record saved, but QR code generation failed. Please contact admin.');
      }
      res.redirect(`/success/${id}`);
    });
  });
});

// GET /success/:id -> confirmation page showing the generated QR
router.get('/success/:id', (req, res) => {
  const record = db.getRecordById(req.params.id);
  if (!record) return res.status(404).render('404', { message: 'Record not found.' });
  const viewUrl = `${config.baseUrl}/view/${record.id}`;
  res.render('success', { record, viewUrl });
});

// GET /view/:id -> public page shown when the QR code is scanned
router.get('/view/:id', (req, res) => {
  const record = db.getRecordById(req.params.id);
  if (!record) return res.status(404).render('404', { message: 'This QR code does not match any record.' });
  res.render('view-record', { record, isAdmin: !!(req.session && req.session.isAdmin) });
});

module.exports = router;
