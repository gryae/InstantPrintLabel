# InstantPrintLabel 🚀
> **Stateless, Database-Free Packing Label Generator & Printer**

A highly optimized, completely database-free (stateless) utility to parse Excel packing list sheets in-memory and generate beautiful thermal label previews matching **100mm × 100mm** printer dimensions.

---

## Key Features ✨
- **100% Database-Free (Stateless)**: Bypasses MySQL connection checks completely. The application runs immediately in memory with zero database footprint.
- **Bilingual Interface**: Built-in dynamic localization supporting Indonesian (ID) and English (EN) session toggles.
- **Smart Excel Parser**: Parses `PACKINGLIST` worksheets automatically, resolving merged cells and range annotations (e.g. `1-3` to Box 1, 2, 3).
- **Intelligent DO Reset**: Automatically detects if a `NO DO` column is present and resets box numbering back to `1` for each DO boundary (or lets you run sequentially).
- **Industrial Layout**: Features a high-contrast preview structured perfectly for thermal label printer margins.

---

## Prerequisites 📋
To deploy this application on another server PC, ensure you have the following installed:
1. **Node.js** (Version 16 or newer recommended)
2. **NPM** (packaged automatically with Node.js)
3. **PM2** installed globally on the server PC:
   ```bash
   npm install -g pm2
   ```

---

## Installation & Deployment Guide (PM2) 🛠️

Follow these simple steps to deploy and run `InstantPrintLabel` on your server PC:

### 1. Clone the Repository
Clone the repository from GitHub to your desired server directory:
```bash
git clone https://github.com/gryae/InstantPrintLabel.git
cd InstantPrintLabel
```

### 2. Install Dependencies
Run npm to install all required in-memory parsing and server packages:
```bash
npm install
```

### 3. Setup Environment Configuration
Copy the template `.env.example` file to `.env`:
```bash
# On Linux/macOS
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```
*(Note: Since this setup is completely stateless, you do not need to configure any MySQL credentials in `.env`. You can optionally adjust the server port, e.g., `PORT=3001`)*

---

## Launching the Server with PM2 🚀

Run the following commands to manage the server process continuously using PM2:

### 🚀 Start the Application
Launch the Node.js app under PM2 supervision:
```bash
pm2 start src/app.js --name "instant-print-label"
```

### 📊 Check Process Status
Monitor active PM2 processes:
```bash
pm2 status
```

### 📋 View Live Logs
View standard output and parser logs in real-time:
```bash
pm2 logs instant-print-label
```

### 🔄 Restart the Server
If you edit translations or templates, easily restart the process:
```bash
pm2 restart instant-print-label
```

### ⏹️ Stop the Application
```bash
pm2 stop instant-print-label
```

---

## System Auto-Start Setup (Highly Recommended) 🔄
Ensure the application auto-launches automatically whenever the server PC restarts:

1. **Generate the PM2 startup script:**
   ```bash
   pm2 startup
   ```
   *(On Linux, this will output a command containing `sudo env PATH=...`. Copy and paste that exact output line into your terminal to run it).*

2. **Save the currently running process list:**
   ```bash
   pm2 save
   ```

---

## How to Login 🔑
Access the web dashboard in your browser (e.g. `http://localhost:3000`):
- **Nama Checker**: *Any name of your choice* (will be printed dynamically as "CHECK BY: [NAME]").
- **Password**: `password123`
