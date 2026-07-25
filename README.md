# QR Registration App

A simple, ready-to-run web app:

1. Share a public link → user fills in Name, Location, Education, Phone, Photo, etc. (no login needed).
2. On save, a **unique QR code** is generated for that person's record.
3. Anyone who **scans the QR code** sees that person's saved details on a profile page.
4. An **admin** can log in to see the full list of registrations and every QR code.

No external database required — records are stored in a local JSON file
(`data/records.json`), and photos/QR images are stored as plain files. Good for
demos, events, small teams. (See "Moving to a real database" below if you outgrow it.)

---

## 1. Requirements

- [Node.js](https://nodejs.org) version 16 or higher installed on your computer.

## 2. Setup (one-time)

Open a terminal in this folder and run:

```bash
npm install
```

This downloads the small set of packages the app uses (Express, EJS, QRCode, Multer, etc. — all plain JavaScript, no compilers needed).

Then create your environment file:

```bash
cp .env.example .env
```

Open `.env` in a text editor. By default:
- **Admin username:** `admin`
- **Admin password:** `admin123`

### ⚠️ Change the admin password before real use
Run:
```bash
npm run create-admin
```
It will ask for a username and password, then print two lines. Paste those lines into your `.env` file (replacing the existing `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` lines), then restart the server.

## 3. Run the app

```bash
npm start
```

You'll see:
```
QR Registration App running!
Local:      http://localhost:3000
Register:   http://localhost:3000/register
Admin:      http://localhost:3000/admin/login
```

- Share **`http://localhost:3000/register`** as the public registration link.
- Go to **`http://localhost:3000/admin/login`** to view all records as admin.

## 4. Important: set APP_BASE_URL so QR codes work when scanned

The QR code stores a link like `http://localhost:3000/view/<id>`. That link only works
on the same computer. For someone to scan the QR with their **phone** and see the profile,
the link inside the QR must point to an address their phone can actually reach:

- **Same WiFi network (quick testing):** find your computer's local IP (e.g. `192.168.1.25`)
  and set in `.env`:
  ```
  APP_BASE_URL=http://192.168.1.25:3000
  ```
- **Deployed online** (Render, Railway, a VPS, etc.): set it to your real domain:
  ```
  APP_BASE_URL=https://yourapp.com
  ```

Restart the server after changing `.env`. Any QR codes generated *after* the change will
use the new address (older ones already saved keep the address they were created with).

## 5. How it works / project structure

```
server.js               Main entry point
config.js                Reads settings from .env
db.js                    Simple JSON-file based storage (data/records.json)
routes/public.js         Registration form, save + QR generation, public profile view
routes/admin.js          Admin login, dashboard/list, delete
middleware/requireAdmin  Blocks admin pages unless logged in
utils/auth.js            Secure password hashing (Node's built-in crypto, no bcrypt needed)
utils/create-admin.js    CLI tool to generate a new admin password hash
views/                   All the HTML pages (EJS templates)
public/uploads/          Uploaded profile photos
public/qrcodes/          Generated QR code images (one PNG per record)
data/records.json        All saved registration records
```

### Admin capabilities
- Login page (`/admin/login`)
- Dashboard listing every record with a QR thumbnail, search by name/location/education/phone/email
- View any individual record's full profile
- Download any QR code
- Delete a record (also removes its photo + QR file)

### Public flow
- `/register` — the form (share this link)
- On submit → saves the record → generates `/qrcodes/<id>.png` → redirects to `/success/<id>`
- `/success/<id>` — shows the new QR code with a download button
- `/view/<id>` — the page a QR scan opens, showing that person's details

## 6. Security notes before going live publicly

- Change the default admin password (`npm run create-admin`).
- Set a strong random `SESSION_SECRET` in `.env`.
- Serve over HTTPS in production (e.g. behind Render/Railway/Nginx with SSL).
- Consider adding rate-limiting on `/register` if the link will be public, to avoid spam submissions.
- Anyone with the QR code / link can view that person's details — don't collect
  more sensitive info (like ID numbers) than you need, since the page has no access control.

## 7. Moving to a real database (optional, later)

Everything reads/writes through `db.js`. If you outgrow the JSON file (many thousands
of records, multiple servers, etc.), you only need to rewrite the functions in `db.js`
to use a real database (Postgres, MongoDB, etc.) — no other file needs to change.

## 8. Deploying online

Any Node.js host works (Render, Railway, Fly.io, a VPS with PM2, etc.):
1. Push this project to the host.
2. Set the environment variables from `.env` in the host's dashboard.
3. Set `APP_BASE_URL` to the real public URL the host gives you.
4. Run `npm install && npm start` (most hosts do this automatically).

Enjoy!
