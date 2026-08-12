# 🛠️ Gypri Dílna 2.0 — Platforma pro správy dílny a přístupový systém

Ucelená, vysoce výkonná webová platforma pro komplexní řízení dílny, která integruje **RFID Přístupový systém brány**, **SQL Inventář zásob**, **Interaktivní 2D minimapu dílny**, **Tiskový engine štítků Brother PT-D460BTVP**, **Mobilní QR Skener s propojením na PC** a **Google OAuth 2.0 přihlašování**.

---

## ✨ Hlavní Moduly a Funkce Aplikace

### 1. 📊 Přehled (Dashboard)
- **Stav přístupové brány**: Okamžitý přehled o stavu RFID brány (Zamknuto / Odemknuto / Servisní režim).
- **Dálkové otevírání**: Možnost odemknout bránu na dálku jedním kliknutím přímo z prohlížeče.
- **Přehled zásob & Upozornění**: Karty s nízko-zásobovými položkami, celkovým počtem položek a indikátory.
- **Stream přístupových logů**: Živý přehled posledních průchodů na čip.

### 2. 🔑 Vstup a Čipy (RFID Přístupový Systém)
- **Správa RFID čipů**: Přidávání, úprava, blokování a mazání přístupových čipů.
- **Jednorázové a časové čipy**: Podpora jednorázových vstupů nebo omezení platnosti do přesného data a času.
- **Ochrana diakritiky**: Automatické odstraňování háčků a čárek ve jméně držitele čipu v reálném čase.
- **Export logů**: Prohlížeč historie vstupů s možností exportu do CSV souboru.

### 3. 📦 Inventář Zásob & 2D Minimapa
- **SQL Správa položek**: Kompletní evidence nářadí, materiálů a spotřebního zboží s minimálním množstvím a kategoriemi.
- **Automatická sekvence lokací**: Generování kódu lokace (např. `11-0001`) s automatickým sekvenčním číslováním.
- **2D Interaktivní Mapa dílny**: Vektorová mapa s 5 zónami (CNC Obrábění, Svařovna, Elektronika, 3D Tiskárna, Vstupní brána) s možností přemisťování pinů položek ($x, y$).
- **Dávkový tisk štítků**: Tisková fronta pro hromadný tisk s nastavením velikosti pásky (18 mm / 9 mm).

### 4. 📷 QR Skener & Vzdálené Skenování do PC
- **Lokální QR Skener**: Integrované skenování fotoaparátem s hardwarovým ostřením a zoomem.
- **Skenovat do PC (Vzdálený režim)**: Možnost skenovat QR kódy mobilem a okamžitě je přenášet do otevřené relace na počítači bez prodlevy!

### 5. 🔐 Přihlášení, Bezpečnost & Google OAuth 2.0
- **Google OAuth 2.0**: Přihlašování jediným kliknutím přes Google účet.
- **Google Profilový Avatar**: Automatické ukládání a zobrazování profilové fotky z Google v aplikaci.
- **Flexibilní přihlášení**: Přihlášení pomocí e-mailu nebo uživatelského jména se skládacím formulářem pro heslo.
- **Správa uživatelů (RBAC)**: Detailní přístupová práva pro jednotlivé uživatele (`service_mode`, `add_chips`, `view_logs`, `remote_opening`, `erase_logs`, `inventory_edit`).
- **Centrální konfigurace**: Ukládání Google Client ID na serveru (`/api/config`), takže Google přihlášení funguje automaticky na všech mobilech a zařízeních.

---

## 🖨️ Brother b-PAC Tiskový Agent (Tiskárna PT-D460BTVP)

Pro automatický tisk štítků z libovolného zařízení (mobil, tablet, PC) na fyzickou tiskárnu **Brother PT-D460BTVP** slouží Tiskový Agent běžící na pozadí Windows na počítači, ke kterému je tiskárna připojena.

### 📦 Stažení Balíčku Tiskového Agenta

Můžete si stáhnout hotový balíček se všemi potřebnými soubory:
- 📥 **[Stáhnout Gypri_PrintAgent_Package.zip](https://github.com/dilna-netizen/gypridilna-app-2.0/raw/main/Gypri_PrintAgent_Package.zip)**

### 🚀 Návod na instalaci v 2 krocích:

1. **Rozbalte ZIP balíček** do libovolné trvalé složky na PC u tiskárny (např. `C:\GypriPrintAgent\`).
2. **Dvakrát klikněte na soubor `setup_autostart.bat`**.

#### 📌 Co balíček obsahuje:
- `print_agent.py` - HTTP server (port 5001) komunikující s ovladačem Brother b-PAC 3.x COM SDK.
- `setup_autostart.bat` - 1-kliknutí instalátor do *Po spuštění Windows* (Startup).
- `install_print_agent_autostart.vbs` - VBScript launcher pro tichý běh bez černého terminálového okna.
- `templates/` - Šablony štítků ve formátu `.lbx` pro 18 mm (`label_18mm.lbx`) a 9 mm (`label_9mm.lbx`) pásky TZe.

---

## 🚀 Rychlý Start Pro Vývoj a Server

### 1. Spuštění Backend Serveru (Flask / Python)

```bash
# Instalace závislostí
pip install -r requirements.txt

# Spuštění produkčního/vývojového serveru na portu 5000
python3 app.py
```

### 2. Sestavení Frontend Aplikace (Vite + React)

```bash
# Instalace NPM balíčků
npm install

# Spuštění vývojového serveru (port 3000)
npm run dev

# Nebo produkční build
npx vite build --emptyOutDir false
```

---

## 🔑 Výchozí Administrátorský Účet (První Spuštění)

- **Uživatelské jméno**: `admin`
- **Heslo**: `rfid_admin_pass`

---

© 2026 Gypri Dílna. Platforma pro správu dílny a přístupový systém. Built for High-Efficiency Workshop Operations.
