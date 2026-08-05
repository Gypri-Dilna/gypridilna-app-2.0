# P-touch Editor Template Setup for Brother PT-D460BTVP

Place your P-touch Editor `.lbx` template files in this `templates` folder:

1. **`label_18mm.lbx`** (18mm TZe Tape - Standard 64x18mm layout)
   - Object Named `title`: Text object for Item Name
   - Object Named `location_code`: Text object for Location Code (e.g. `12-0001`)
   - Object Named `category`: Text object for Category
   - Object Named `qr_code`: QR Barcode object (Payload = `12-0001`)

2. **`label_9mm.lbx`** (9mm TZe Tape - Compact 9mm layout)
   - Object Named `title`: Text object for Item Name (max 30 chars)
   - Object Named `location_code`: Text object for Location Code (e.g. `12-0001`)
   - Object Named `category`: Text object for Category (max 22 chars)
   - Object Named `qr_code`: QR Barcode object (Payload = `12-0001`)

### How to set Object Names in P-touch Editor:
1. Open your label layout in **Brother P-touch Editor**.
2. Double-click the Text or Barcode object.
3. Go to **Object Properties** -> **Expanded** tab.
4. Set the **Object Name** to `title`, `location_code`, `category`, or `qr_code`.
5. Save as `.lbx` in this `templates/` folder!
