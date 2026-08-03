# Gypri Dílna 2.0 — Unified Workshop Platform

A modern, fast, multi-platform application (Android, Windows Desktop, Web) and local backend for the **Gypri Dílna** technical workshop. Integrates RFID Access Control, Inventory Management with `XY-ZAAA` storage coordinates, Interactive 2D Workshop Minimap, Brother USB Label Printing, Mobile QR Scanning, and RBAC User Management.

---

## 🚀 System Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                       GYPRI DÍLNA UNIFIED PLATFORM                      │
 ├───────────────────────────────┬─────────────────────────────────────────┤
 │  FLUTTER FRONTEND (APP)       │  LOCAL BACKEND SERVER (UBUNTU / PC)     │
 │  • Android Mobile / Scanners  │  • Python FastAPI (AsyncIO)             │
 │  • Windows Desktop PCs        │  • SQLite DB with WAL mode              │
 │  • Web Browsers               │  • RBAC & Security Audit Logs           │
 ├───────────────────────────────┼─────────────────────────────────────────┤
 │  WORKSHOP HARDWARE & PERIPHERALS                                       │
 │  • ESP32 RFID Readers (HTTP POST/GET polling)                          │
 │  • Brother PT-D460BTVP Label Printer (USB to PC)                       │
 └─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Prerequisites

* **Python 3.10+** (For local server backend)
* **Flutter SDK 3.0+** (For running/building Flutter Desktop, Mobile, or Web)
* **Git**
* **Brother PT-D460BTVP Drivers** installed on the Windows PC connected to the printer.

---

## ⚡ Quick Start Guide

### Step 1: Run the Local Backend Server (FastAPI)

1. Open PowerShell or Terminal and navigate to the project directory:
   ```powershell
   cd "d:\Documents\GD App 2.0\backend"
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate      # Windows PowerShell
   # source venv/bin/activate   # Linux/macOS (Ubuntu Server)
   ```

3. Install required Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Start the FastAPI local server:
   ```powershell
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. The server will start automatically:
   * **API Base URL:** `http://localhost:8000` (or `http://<SERVER_IP>:8000` on workshop LAN)
   * **Interactive OpenAPI/Swagger Documentation:** `http://localhost:8000/docs`
   * **Default Admin Credentials:**
     * Username: `admin`
     * Password: `password`

---

### Step 2: Run the Flutter Multi-Platform Frontend Application

1. Open a new terminal window and navigate to the `frontend` folder:
   ```powershell
   cd "d:\Documents\GD App 2.0\frontend"
   ```

2. Fetch Flutter packages:
   ```powershell
   flutter pub get
   ```

3. Run on your target platform:

   * **Windows Desktop PC (Workshop Workstation):**
     ```powershell
     flutter run -d windows
     ```

   * **Web Browser (Chrome / Edge):**
     ```powershell
     flutter run -d chrome
     ```

   * **Android Mobile / Scanner Device:**
     Connect your Android phone via USB with USB Debugging enabled, then run:
     ```powershell
     flutter run -d android
     ```

   * **Build Standalone APK for Android:**
     ```powershell
     flutter build apk --release
     ```
     The compiled APK will be output to `frontend/build/app/outputs/flutter-apk/app-release.apk`.

---

## 📦 Features & Workflows

### 1. Storage Coordinate System (`XY-ZAAA`)
* Storage locations follow the standard format: `(RACK)(POSITION)-(BOX)(3-DIGIT ITEM ID)`.
* If no box exists, Box defaults to `0`.
* **Examples:**
  * Rack 6, Position 1, No Box (0), Item 1 $\rightarrow$ **`61-0001`**
  * Rack 6, Position 1, Box 2, Item 1 $\rightarrow$ **`61-2001`**

### 2. Item Onboarding & Brother USB Printing (PC Workflow)
1. Open the Flutter Windows Desktop app $\rightarrow$ Click **Print Label / Item Onboarding**.
2. Input Item Name, Rack, Position, Box, and Note.
3. Preview the generated vector label formatted for **18mm tape** (QR code + Name + `XY-ZAAA` code).
4. Click **Print 18mm Label via USB** to send the job to the Brother PT-D460BTVP printer.
5. Stick label on item $\rightarrow$ Webcam scans QR code $\rightarrow$ Auto photo snapshot taken $\rightarrow$ Item committed to database.

### 3. Mobile QR Camera Scanner (Android)
* Tap the center Floating Action Button (**FAB Scanner**) on the mobile app.
* Scan any printed item QR code (`GD:INV:<UUID>` or `61-0001`).
* Instantly auto-navigates to the full **Item Detail Screen** showing photo snapshot, `XY-ZAAA` location badge, and interactive 2D minimap pin on target rack.

### 4. Interactive 2D Workshop Minimap
* Zoomable, pan-able 2D floorplan canvas showing workshop layout grid.
* Selecting an item automatically drops an animated pulsing pin onto its target Rack (e.g. Rack 6).
* Tapping any Rack on the floorplan filters the item list to items stored in that rack.

### 5. ESP32 Hardware Integration (100% Backward Compatible)
* ESP32 readers send access requests to: `POST http://<SERVER_IP>:8000/api/check-access`
* ESP32 readers poll for remote door unlock: `GET http://<SERVER_IP>:8000/api/override-status`
* ESP32 readers poll for service mode status: `GET http://<SERVER_IP>:8000/api/service-mode-status`

---

## 🖥️ Production Deployment on Ubuntu Server (24/7)

To run the backend on your Ubuntu Server 24/7 using `systemd`:

1. Copy the `backend/` directory to `/opt/gypri-dilna-backend`.
2. Create a systemd service file at `/etc/systemd/system/gypri-dilna.service`:
   ```ini
   [Unit]
   Description=Gypri Dilna 2.0 FastAPI Server
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/opt/gypri-dilna-backend
   ExecStart=/opt/gypri-dilna-backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable gypri-dilna
   sudo systemctl start gypri-dilna
   ```

---

## 📄 License & Brand Guidelines
Created for **Gypri Dílna**. All design system tokens follow Gypri Dílna brand guidelines using Montserrat typography, `CircuitMint` (`#3AA69A`), and `GraphiteCore` (`#2F353E`).
