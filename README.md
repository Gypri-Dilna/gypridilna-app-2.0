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

## 🖨️ Brother b-PAC Tiskový Agent (Instalace pro PC u tiskárny Brother PT-D460BTVP)

Pro automatický tisk štítků z libovolného zařízení (mobil, tablet, PC) na fyzickou tiskárnu **Brother PT-D460BTVP** slouží Tiskový Agent běžíci na pozadí Windows na počítači, ke kterému je tiskárna připojena.

### 📦 Stažení Balíčku Tiskového Agenta

Můžete si stáhnout hotový balíček se všemi potřebnými soubory:
- 📥 **[Stáhnout Gypri_PrintAgent_Package.zip](https://github.com/dilna-netizen/gypridilna-app-2.0/raw/main/Gypri_PrintAgent_Package.zip)**

### 🚀 Návod na instalaci v 2 krocích:

1. **Rozbalte ZIP balíček** do libovolné trvalé složky na PC u tiskárny (např. `C:\GypriPrintAgent\`).
2. **Dvakrát klikněte na soubor `setup_autostart.bat`**.

---

#### 📌 Co balíček obsahuje:
- `print_agent.py` - HTTP server (port 5001) komunikující s ovladačem Brother b-PAC 3.x COM SDK.
- `setup_autostart.bat` - 1-kliknutí instalátor do *Po spuštění Windows* (Startup).
- `install_print_agent_autostart.vbs` - VBScript launcher pro tichý běh bez černého terminálového okna.
- `templates/` - Šablony štítků v formátu `.lbx` pro 18 mm (`label_18mm.lbx`) a 9 mm (`label_9mm.lbx`) pásky TZe.

#### ❓ Chybová hlášení:
Pokud při startu Windows chybí v systému ovladač Brother b-PAC SDK, Tiskový Agent zobrazí chybové okno s instrukcí ke stažení zdarma *b-PAC Client Component* z webu Brother.

---

© 2026 Gypri Dílna. Platforma pro správu dílny a přístupový systém.
