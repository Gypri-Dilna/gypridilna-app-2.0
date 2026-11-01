# 🛠️ Gypri Dílna 2.0 — Platforma pro správu dílny a přístupový systém

<div align="center">

[![Stáhnout mobilní aplikaci pro Android](https://img.shields.io/badge/📱_Stáhnout_Android_Aplikaci-APK_(16.9_MB)-00C853?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Gypri-Dilna/gypridilna-app-2.0/raw/main/Gypri_Dilna_MobileApp.apk)
&nbsp;
[![Platforma Android](https://img.shields.io/badge/Platforma-Android_8.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Gypri-Dilna/gypridilna-app-2.0/raw/main/Gypri_Dilna_MobileApp.apk)
&nbsp;
[![Bleskové NFC Otevírání](https://img.shields.io/badge/NFC_Unlock-Podporováno-3aa398?style=for-the-badge&logo=contactless-payment&logoColor=white)](https://github.com/Gypri-Dilna/gypridilna-app-2.0/raw/main/Gypri_Dilna_MobileApp.apk)

<br/>

### 📲 **[👉 KLIKNĚTE ZDE PRO STAŽENÍ MOBILNÍ APLIKACE (Gypri_Dilna_MobileApp.apk) 👈](https://github.com/Gypri-Dilna/gypridilna-app-2.0/raw/main/Gypri_Dilna_MobileApp.apk)**
*Nativní mobilní aplikace s podporou bleskového NFC odemykání brány a čtením RFID karet pro správce.*

<hr/>

</div>


Ucelená, vysoce výkonná webová platforma pro komplexní řízení dílny vyvinutá pro **Gypri Dílnu**. Integruje **RFID přístupový systém vstupní brány**, **SQL inventář zásob a nářadí**, **vektorový interaktivní SVG plán dílny**, **automatizovaný tiskový engine štítků Brother PT-D460BTVP**, **mobilní QR skener s živým propojením na PC relaci** a **Google OAuth 2.0 přihlašování**.

---

## ✨ Hlavní Moduly a Funkce Aplikace

### 1. 📊 Přehled (Dashboard)
- **Stav přístupové brány**: Okamžitý přehled o stavu RFID brány (*Zamknuto* / *Odemknuto* / *Servisní režim trvale otevřeno*).
- **Dálkové otevírání**: Možnost odemknout vstupní bránu na dálku jedním kliknutím přímo z prohlížeče (včetně bezpečnostního slide-to-unlock tlačítka).
- **Přehled zásob & Upozornění**: Rychlé metriky – položky s nízkým stavem zásob pod minimem, celkový počet položek, aktivní RFID čipy a indikátory servisního režimu.
- **Stream přístupových logů**: Živý přehled posledních průchodů na čip v reálném čase.

### 2. 🔑 Vstup a Čipy (RFID Přístupový Systém)
- **Správa RFID čipů**: Přidávání, úprava oprávnění, blokování a mazání přístupových čipů.
- **Časově omezené a jednorázové čipy**: Podpora jednorázových vstupů (čip se po prvním průchodu automaticky zneplatní) nebo omezení platnosti do přesného data a času.
- **Ochrana diakritiky**: Automatické čištění háčků a čárek ve jméně držitele čipu v reálném čase pro maximální kompatibilitu s hardwarem.
- **Export logů**: Detailní prohlížeč historie průchodů a systémových událostí s možností okamžitého exportu do CSV.

### 3. 📦 Inventář Zásob & Vektorový Plán Dílny
- **SQL Správa položek**: Kompletní evidence nářadí, materiálů a spotřebního zboží s kategoriemi, jednotkami, minimálním množstvím a umístěním.
- **Standardizované kódy lokací (`XY-ZAAA`)**:
  - `X`: Číslo regálu / stěny (1–9)
  - `Y`: Sektor / police
  - `Z`: Číslo boxu / přepravky (0 = volně na polici)
  - `AAA`: Unikátní 3-ciferné ID položky v daném boxu (např. `91-0001` = Regál 9, Sektor 1, volně, položka 001).
- **Automatické sekvenční číslování**: Aplikace při zakládání nové položky automaticky najde nejnižší volné ID v daném boxu a vyplňuje případné mezery po smazaných položkách.
- **Interaktivní SVG Plán Dílny & Zvýraznění**:
  - Půdorys dílny v reálném měřítku s přesně zakreslenými regály 1 až 9 (včetně sektorů 41A–43B, stěnových regálů 61–67, 81–83 a nově přidaných zón 91 na východní stěně a 92 na západní stěně).
  - Při zobrazení položky se její regál a police dynamicky **červeně zvýrazní** a do středu elementu se umístí **pulzující navigační bod**.
  - Zvětšení plánu do celoobrazovkového lightboxu jediným kliknutím.
  - Provázání s reálnou fotografií police (`loc_XY.jpg`).
- **Výběrový režim & Tisková fronta**:
  - Možnost hromadného výběru položek včetně podpory klávesy **Shift** (výběr celého rozsahu položek jedním klikem).
  - Přidání vybraných položek do tiskové fronty a hromadný tisk s optimalizací odstřihu pásky (*Chain printing*).

### 4. 📷 QR Skener & Vzdálené Skenování do PC (Remote Scanner)
- **Mobilní QR Skener**: Rychlé skenování štítků fotoaparátem mobilního telefonu s hardwarovým autofokusem a svítilnou.
- **Vzdálený režim (Skenovat do PC)**: Naskenujte QR kód mobilem v dílně a položka se okamžitě bez prodlevy otevře na obrazovce vašeho stolního počítače.

### 5. 🔐 Přihlášení, Bezpečnost & Role (RBAC)
- **Google OAuth 2.0**: Přihlášení jedním kliknutím přes školní/firemní Google účet.
- **Profilové avatary**: Automatické načítání profilové fotografie z Google.
- **Klasické přihlášení**: Možnost přihlášení kombinací uživatelského jména nebo e-mailu a hesla.
- **Detailní systém oprávnění (RBAC)**:
  - `service_mode` — Přepínání servisního trvalého odemknutí brány
  - `add_chips` — Správa a přidávání RFID čipů
  - `view_logs` — Prohlížení přístupových logů
  - `remote_opening` — Dálkové otevírání brány z webu
  - `erase_logs` — Mazání historie logů
  - `inventory_edit` — Editace položek ve skladu dílny

### 6. 📱 Nativní Mobilní Aplikace (Android APK & NFC)
- **Instalační balíček**: Přímo ke stažení **[Gypri_Dilna_MobileApp.apk](https://github.com/Gypri-Dilna/gypridilna-app-2.0/raw/main/Gypri_Dilna_MobileApp.apk)** (16.9 MB) pro telefony se systémem Android.
- **Rychlé NFC odemčení brány (Quick NFC Door Unlock)**: Přiložením odemčeného telefonu k NFC štítku na krabičce se automaticky probudí nativní aplikace, odešle autorizovaný signál k odemčení brány, přehraje animaci a zavibruje.
- **Skenování RFID čipů telefonem pro administrátory**: V modulu Správa čipů stačí přiložit novou kartu nebo přívěsek k zádům telefonu – aplikace automaticky přečte UID přes NFC bez nutnosti cokoli přepisovat ručně.
- **Uživatelská konfigurace**: Možnost nastavit adresu serveru dílny, otestovat konektivitu a zapnout/vypnout NFC funkce.

---


## 🖨️ Brother b-PAC Tiskový Agent (PT-D460BTVP)

Pro automatický tisk štítků přímo z webové aplikace na tiskárnu **Brother PT-D460BTVP** slouží Tiskový Agent, který běží jako tichá služba na pozadí Windows na počítači připojeném k tiskárně přes USB.

### 📦 Stažení Balíčku Tiskového Agenta

Hotový instalační balíček se všemi komponenty, ovladačem i šablonami:
- 📥 **[Stáhnout Gypri_PrintAgent_Package.zip](https://github.com/Gypri-Dilna/gypridilna-app-2.0/raw/main/Gypri_PrintAgent_Package.zip)**

### 🚀 Zprovoznění v 1 kroku:

1. Stáhněte a rozbalte `Gypri_PrintAgent_Package.zip`.
2. Spusťte **`Instalovat_bPAC.exe`**.

Instalátor provede vše automaticky:
- Zkontroluje 64-bitovou architekturu Windows a Pythonu.
- Automaticky nainstaluje knihovnu `pywin32` a `requests`.
- Spustí instalaci oficiální knihovny **Brother b-PAC 3.4 Client Component (`bPAC3CCISetup_64.msi`)**.
- Vytvoří stálou systémovou složku v `%LOCALAPPDATA%\GypriDilna\PrintAgent` a zkopíruje tam skript i šablony (takže stažený ZIP můžete po instalaci bez obav smazat).
- Zeptá se, zda chcete zapnout **automatický start po zapnutí Windows** (stisknutím klávesy `Enter` potvrdíte Ano).
- Zeptá se, zda chcete agenta rovnou **spustit na pozadí** (naslouchá na portu `5001`).

#### 📁 Co balíček obsahuje:
| Soubor | Účel |
|---|---|
| `Instalovat_bPAC.exe` | Automatický jedno-klikový instalátor a konfigurátor autostartu |
| `bPAC3CCISetup_64.msi` | Oficiální instalační balíček Brother b-PAC 3.4 Client Component (64-bit) |
| `print_agent.py` | Samotný agent (HTTP server port 5001 + COM napojení na Brother SDK) s ochranou proti duplicitnímu běhu a logováním do `print_agent.log` |
| `1_Instalovat_bPAC.bat` | Alternativní dávkový soubor pro ruční instalaci ovladače MSI |
| `2_Instalovat_Python_Knihovny.bat` | Dávkový soubor pro instalaci `pywin32` přes pip |
| `3_Spustit_PrintAgent.bat` | Spuštění tiskového agenta v otevřeném okně konzole pro testování |
| `setup_autostart.bat` | Samostatný skript pro nastavení spouštění po startu Windows |
| `templates/label_18mm.lbx` | P-touch šablona pro 18mm pásky |
| `templates/label_9mm.lbx` | P-touch šablona pro 9mm pásky |
| `NAVOD_K_INSTALACI.txt` | Podrobný český návod krok za krokem |

---

## 🚀 Rychlý Start Pro Vývoj a Server

### 1. Spuštění Backend Serveru (Flask / Python)

```bash
# Klonování repozitáře
git clone https://github.com/Gypri-Dilna/gypridilna-app-2.0.git
cd gypridilna-app-2.0

# Instalace závislostí
pip install -r requirements.txt

# Spuštění backendového serveru (výchozí port 5000)
python app.py
```

### 2. Sestavení a Spuštění Frontendu (Vite + React)

```bash
# Instalace balíčků
npm install

# Spuštění vývojového serveru s Hot-Reload (port 3000)
npm run dev

# Nebo sestavení produkční verze
npm run build
```

---

## 🔑 Výchozí Administrátorský Účet (První Spuštění)

Při prvním spuštění databáze je automaticky vytvořen výchozí správcovský účet:

- **Uživatelské jméno**: `admin`
- **Heslo**: `rfid_admin_pass`

*Po prvním přihlášení doporučujeme heslo změnit v modulu Správa uživatelů.*

---

## 🗺️ Schéma Regálů a Lokací Dílny

| Označení | Umístění v dílně | Typ zóny / Zaměření |
|---|---|---|
| **Regál 1** | Západní stěna (vlevo nahoře) | Dřevoobrábění & Truhlárna |
| **Regál 2** | Severní stěna (uprostřed) | Sklad spojovacího materiálu |
| **Regál 3** | Východní stěna (vpravo nahoře) | Kovoobrábění & Zámečnická dílna |
| **Regály 41–43** | Středové stoly dílny | Elektronika, pájení & laboratorní přístroje |
| **Regál 5** | Jižní stěna (uprostřed) | 3D Tisková farma & filamenty |
| **Regály 61–67** | Vstupní stěna u dveří | Nářadí pro rychlý přístup |
| **Regál 7** | Střed západní stěny | Měřicí technika & speciální nářadí |
| **Regály 81–83** | Spodní část západní stěny | Velkoobjemové materiály |
| **Lokace 91** | Pravá (východní) stěna dílny | Nová skladová sekce A |
| **Lokace 92** | Levá (západní) stěna dílny vedle Regálu 1 | Nová skladová sekce B |

---

© 2026 Gypri Dílna. Platforma pro správu dílny a přístupový systém. Built for High-Efficiency Workshop Operations.
