const express = require('express');
const session = require('express-session');
const path = require('path');

const config = require('./config');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files (uploaded photos, generated QR codes, css)
app.use(express.static(path.join(__dirname, 'public')));

// Sessions (used for admin login only)
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      httpOnly: true,
    },
  })
);

// Routes
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { message: 'Page not found.' });
});

app.listen(config.port, () => {
  console.log('==================================================');
  console.log(`  QR Registration App running!`);
  console.log(`  Local:      http://localhost:${config.port}`);
  console.log(`  Register:   http://localhost:${config.port}/register`);
  console.log(`  Admin:      http://localhost:${config.port}/admin/login`);
  console.log('==================================================');
});
