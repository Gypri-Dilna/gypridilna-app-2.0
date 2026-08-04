# Gypri Dílna Management Platform 2.0 (GD App 2.0)

Unified, high-performance Workshop Management Platform integrating **RFID Access Control**, **SQL Inventory Management**, **2D Interactive Workshop Minimap**, **Brother PT-D460BTVP Label Printing Engine**, and **Camera QR Code Scanner**.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19 (Vite + TypeScript + Tailwind CSS)
- **Backend**: Python FastAPI with SQLite (SQLAlchemy ORM)
- **Label Printer Engine**: Customized for Brother PT-D460BTVP (18 mm TZe continuous tape format)
- **Hardware Integration**: Serial COM (9600 baud) for RFID Arduino/ESP32 & direct HTTP endpoints (`/api/check-access`, `/api/override-status`, `/api/service-mode`)

---

## 🚀 Key Modules Built

1. **Dashboard (Executive Workshop Control Center)**:
   - Live RFID Gate Status & Remote Unlock trigger
   - Low Stock Alert Cards & Inventory Metrics
   - Mini Interactive Floorplan Widget
   - Real-time Gate Access Log Stream

2. **Refactored RFID Access Control**:
   - Backward-compatible REST endpoints for physical RFID readers
   - Gate Service Mode toggle (permanent unlock mode)
   - RFID Chip Management (Allow/Block, 1-time access, Expiration date, Learn Mode)
   - Audit Log Viewer & CSV exporter

3. **Workshop Inventory Catalog**:
   - Fast SQL-backed CRUD operations for tools, parts, and consumables
   - Instant filtering by category, low-stock status, and location code (e.g. `A1-RACK-02`)
   - Brother PT-D460BTVP 18 mm Tape Label Generator & Direct Thermal Print Trigger

4. **Interactive 2D Workshop Minimap**:
   - Vector floorplan covering 5 main workshop zones (Woodworking CNC, Metal Welding Lab, Electronics Bench, 3D Printing Lab, Entrance Gate)
   - Dynamic marker/pin placement with item coordinates ($x, y$)
   - Visual click-to-relocate pin editor for admins

5. **Camera QR Code Scanner**:
   - Web browser camera integration using `html5-qrcode`
   - Instant item lookup and quick stock check-in / check-out buttons

6. **Embedded WebConnect Module**:
   - Lightweight iframe container for secondary web tools (OctoPrint 3D printer web UI, CNC router controller, documentation)

7. **User & RBAC Security**:
   - Fine-grained user permissions (`service_mode`, `add_chips`, `view_logs`, `remote_opening`, `erase_logs`, `inventory_edit`)
   - Password hashing with bcrypt & session persistence ("Remember Me")

---

## 💻 Quick Start & Launch Instructions

### 1. Start Python FastAPI Backend Server

```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment (optional)
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Launch FastAPI backend on port 5000
python -m uvicorn app.main:app --host 127.0.0.1 --port 5000 --reload
```

> **Backend API Docs**: Interactive Swagger documentation will be available at [http://localhost:5000/docs](http://localhost:5000/docs)

### 2. Start React Frontend Dev Server

```bash
# In project root directory (D:\Documents\GD App 2.0)
npm install

# Start Vite development server
npm run dev
```

> Open browser at [http://localhost:3000](http://localhost:3000)

---

## 🔐 Default Admin Credentials

- **Username**: `admin`
- **Password**: `rfid_admin_pass`

---

## 🖨️ Brother PT-D460BTVP Print Setup

1. Connect Brother PT-D460BTVP via USB or Bluetooth to client PC.
2. In the Web App, click **Label** on any inventory item to open the 18 mm print engine modal.
3. Click **Print Label Now**. In the browser print dialog:
   - Select **Brother PT-D460BTVP** as the destination printer.
   - Set Paper Size to **18 mm Tape / User Defined (64 mm x 18 mm)**.
   - Margins: **None**.

---

© 2026 Gypri Dílna. Built for High-Efficiency Workshop Operations.
