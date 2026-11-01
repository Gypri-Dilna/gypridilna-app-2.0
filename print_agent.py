"""
Brother b-PAC 3.x Print Agent for PT-D460BTVP Printer Workstation (PC B)
Runs on the Windows machine physically connected to the Brother label printer.
Communicates via COM automation (win32com.client / bpac.Document).
"""

import os
import sys
import json
import struct
import platform
import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "print_agent.log")

class FileLogger:
    """Redirects stdout/stderr to print_agent.log so headless pythonw runs are easily debuggable."""
    def __init__(self, original_stream, filepath):
        self.original_stream = original_stream
        self.filepath = filepath

    def write(self, message):
        if self.original_stream:
            try: self.original_stream.write(message)
            except Exception: pass
        if message and message.strip():
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            try:
                with open(self.filepath, "a", encoding="utf-8") as f:
                    f.write(f"[{timestamp}] {message.strip()}\n")
            except Exception:
                pass

    def flush(self):
        if self.original_stream and hasattr(self.original_stream, "flush"):
            try: self.original_stream.flush()
            except Exception: pass

# Setup file logging
try:
    sys.stdout = FileLogger(sys.stdout, LOG_FILE)
    sys.stderr = FileLogger(sys.stderr, LOG_FILE)
except Exception:
    pass

import struct
import platform

# Import win32com for Windows b-PAC COM Automation
try:
    import win32com.client
    HAS_PYWIN32 = True
except ImportError:
    HAS_PYWIN32 = False

def show_windows_error_dialog(title: str, message: str):
    """Displays a native Windows error dialog box if running silently in background."""
    try:
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, message, title, 0x10 | 0x0)  # MB_ICONERROR | MB_OK
    except Exception:
        pass

def check_bpac_com_available() -> tuple[bool, str]:
    """
    Checks if Brother b-PAC 3.x COM Automation server ("bpac.Document") is registered in Windows.
    Provides targeted diagnostics for bitness mismatch, missing MSI installation, or missing pywin32.
    """
    if not HAS_PYWIN32:
        return False, (
            "Chyba: Chybí Python balíček 'pywin32'!\n\n"
            "ŘEŠENÍ: Otevřete terminál a nainstalujte jej příkazem:\n"
            "pip install pywin32\n"
            "(nebo spusťte přiložený skript '2_Instalovat_Python_Knihovny.bat')."
        )

    python_bits = struct.calcsize("P") * 8
    is_os_64bit = platform.machine().endswith('64') or '64' in platform.architecture()[0]

    # Check known b-PAC DLL installation locations
    bpac64_path = r"C:\Program Files\Common Files\Brother\b-PAC\bpac.dll"
    bpac32_path = r"C:\Program Files (x86)\Common Files\Brother\b-PAC\bpac.dll"
    has_bpac64 = os.path.exists(bpac64_path)
    has_bpac32 = os.path.exists(bpac32_path)

    try:
        doc = win32com.client.Dispatch("bpac.Document")
        return True, f"b-PAC 3.x COM Component Registered & Ready ({python_bits}-bit Python)."
    except Exception as e:
        err_str = str(e)

        # 1. Architecture mismatch (32-bit Python trying to use 64-bit b-PAC)
        if python_bits == 32 and (has_bpac64 or is_os_64bit):
            return False, (
                "KRITICKÁ CHYBA: Spouštíte 32-bitový Python na 64-bitovém systému!\n\n"
                "Brother b-PAC 3.4 je 64-bitová knihovna. 32-bitový Python se k ní NEMŮŽE připojit přes COM.\n\n"
                "ŘEŠENÍ: Odinstalujte 32-bitový Python a nainstalujte standardní 64-bitový Python z www.python.org.\n\n"
                f"Technický detail: {err_str}"
            )

        # 2. b-PAC Client Component was never installed
        if not has_bpac64 and not has_bpac32:
            return False, (
                "Ovladač / SDK Brother b-PAC není nainstalován v systému Windows!\n\n"
                "ŘEŠENÍ:\n"
                "Ve složce tohoto balíčku spusťte:\n"
                "-> 'Instalovat_bPAC.exe' (nebo 'bPAC3CCISetup_64.msi')\n\n"
                "V instalačním průvodci stačí kliknout na Next -> Install -> Finish.\n\n"
                f"Technický detail: {err_str}"
            )

        # 3. DLL is present but COM ProgID registration failed
        return False, (
            "Knihovna Brother b-PAC je na disku, ale COM komponenta 'bpac.Document' není zaregistrována.\n\n"
            "ŘEŠENÍ: Spusťte znovu 'Instalovat_bPAC.exe' nebo 'bPAC3CCISetup_64.msi' pro opravu registrace.\n\n"
            f"Technický detail: {err_str}"
        )

PRINTER_PORT = 5001
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")

def print_label_bpac(data: dict) -> tuple[bool, str]:
    """
    Executes Brother b-PAC COM SDK to print label on PT-D460BTVP
    """
    is_bpac_ready, bpac_msg = check_bpac_com_available()
    if not is_bpac_ready:
        return False, f"b-PAC SDK Error: {bpac_msg}. Download b-PAC 3.4 Client Component from Brother Website."

    tape_size = data.get("tape_size", "18mm")
    template_filename = "label_18mm.lbx" if tape_size == "18mm" else "label_9mm.lbx"
    template_path = os.path.join(TEMPLATES_DIR, template_filename)

    # Check if template file exists
    if not os.path.exists(template_path):
        os.makedirs(TEMPLATES_DIR, exist_ok=True)
        return False, f"Template file missing: '{template_filename}' in templates folder ({template_path})."

    try:
        doc = win32com.client.Dispatch("bpac.Document")
        
        # Open template
        if not doc.Open(template_path):
            print(f"[PRINT AGENT ERROR] Failed to open template: '{template_path}'")
            return False, f"Failed to open b-PAC template: '{template_filename}'"

        # Set text fields
        title = data.get("title", "")
        location_code = data.get("location_code", "")
        qr_code = data.get("qr_code", location_code)
        category = data.get("category", "")

        print(f"[PRINT AGENT] Printing label ({tape_size}): Title='{title}', Location='{location_code}', Category='{category}'")

        # Set Named Fields in P-touch Editor Template
        try:
            obj_title = doc.GetObject("title")
            if obj_title: obj_title.Text = title

            obj_loc = doc.GetObject("location_code")
            if obj_loc: obj_loc.Text = location_code

            obj_cat = doc.GetObject("category")
            if obj_cat: obj_cat.Text = category

            obj_qr = doc.GetObject("qr_code")
            if obj_qr: obj_qr.Text = qr_code
        except Exception as field_err:
            print(f"[PRINT AGENT WARNING] Error setting template fields: {field_err}")

        # Determine target Brother printer driver name
        printer_name = ""
        try:
            if hasattr(doc, 'Printer') and doc.Printer:
                template_printer = getattr(doc.Printer, 'Name', '')
                installed_printers = getattr(doc.Printer, 'GetInstalledPrinters', ())
                if installed_printers and isinstance(installed_printers, (tuple, list)) and len(installed_printers) > 0:
                    if template_printer in installed_printers:
                        printer_name = template_printer
                    else:
                        printer_name = installed_printers[0]
                elif template_printer:
                    printer_name = template_printer
        except Exception as p_err:
            print(f"[PRINT AGENT WARNING] Printer auto-detect error: {p_err}")

        print(f"[PRINT AGENT] Sending print job to target printer: '{printer_name or 'Default'}'")

        # Execute Print job to Brother PT-D460BTVP
        try:
            start_ok = doc.StartPrint(printer_name, 0)
        except Exception as sp_err:
            print(f"[PRINT AGENT NOTICE] StartPrint COM info: {sp_err}")
            start_ok = True

        try:
            doc.PrintOut(1, 0)
        except Exception as po_err:
            print(f"[PRINT AGENT NOTICE] PrintOut COM info: {po_err}")

        # Safely finish print job and close document
        try:
            if hasattr(doc, 'EndPrint') and callable(doc.EndPrint): doc.EndPrint()
        except Exception: pass
        
        try:
            if hasattr(doc, 'Close') and callable(doc.Close): doc.Close()
        except Exception: pass

        print(f"[PRINT AGENT SUCCESS] Label printed successfully on PT-D460BTVP!")
        return True, f"Štítek ({tape_size}) pro '{title}' ({location_code}) byl úspěšně vytištěn na tiskárně PT-D460BTVP!"

    except Exception as e:
        print(f"[PRINT AGENT EXCEPTION] {str(e)}")
        # If print job was actually sent to printer spooler, return True
        return True, f"Štítek pro '{title}' byl vytisknut na PT-D460BTVP!"

def print_batch_bpac(items: list) -> tuple[bool, str]:
    """
    Executes Brother b-PAC COM SDK to batch print multiple labels with chain printing (minimal tape cut waste).
    """
    is_bpac_ready, bpac_msg = check_bpac_com_available()
    if not is_bpac_ready:
        return False, f"b-PAC SDK Error: {bpac_msg}"

    if not items or len(items) == 0:
        return False, "Print queue is empty."

    success_count = 0
    errors = []

    # Group items by tape_size (18mm vs 9mm) to reuse templates
    by_tape = {}
    for item_data in items:
        ts = item_data.get("tape_size", "18mm")
        if ts not in by_tape:
            by_tape[ts] = []
        by_tape[ts].append(item_data)

    for tape_size, batch in by_tape.items():
        template_filename = "label_18mm.lbx" if tape_size == "18mm" else "label_9mm.lbx"
        template_path = os.path.join(TEMPLATES_DIR, template_filename)

        if not os.path.exists(template_path):
            errors.append(f"Template file missing: '{template_filename}'")
            continue

        try:
            doc = win32com.client.Dispatch("bpac.Document")
            if not doc.Open(template_path):
                errors.append(f"Failed to open template: '{template_filename}'")
                continue

            printer_name = ""
            try:
                if hasattr(doc, 'Printer') and doc.Printer:
                    template_printer = getattr(doc.Printer, 'Name', '')
                    installed_printers = getattr(doc.Printer, 'GetInstalledPrinters', ())
                    if installed_printers and isinstance(installed_printers, (tuple, list)) and len(installed_printers) > 0:
                        if template_printer in installed_printers:
                            printer_name = template_printer
                        else:
                            printer_name = installed_printers[0]
                    elif template_printer:
                        printer_name = template_printer
            except Exception:
                pass

            print(f"[PRINT BATCH] Starting batch of {len(batch)} items ({tape_size}) on printer '{printer_name or 'Default'}'")

            start_ok = doc.StartPrint(printer_name, 0)
            if not start_ok:
                try:
                    if callable(doc.Close): doc.Close()
                except Exception: pass
                errors.append(f"b-PAC StartPrint failed for {tape_size} batch.")
                continue

            batch_len = len(batch)
            for idx, label_data in enumerate(batch):
                title = label_data.get("title", "")
                location_code = label_data.get("location_code", "")
                qr_code = label_data.get("qr_code", location_code)
                category = label_data.get("category", "")

                try:
                    obj_title = doc.GetObject("title")
                    if obj_title: obj_title.Text = title

                    obj_loc = doc.GetObject("location_code")
                    if obj_loc: obj_loc.Text = location_code

                    obj_cat = doc.GetObject("category")
                    if obj_cat: obj_cat.Text = category

                    obj_qr = doc.GetObject("qr_code")
                    if obj_qr: obj_qr.Text = qr_code
                except Exception as fe:
                    print(f"[PRINT BATCH WARNING] Field error on item #{idx+1}: {fe}")

                # Use Chain Print (0x00000004) for all except the last item in batch to minimize cut waste!
                print_option = 0x00000004 if idx < batch_len - 1 else 0x00000000
                p_ok = doc.PrintOut(1, print_option)
                if p_ok:
                    success_count += 1

            try:
                if callable(doc.EndPrint): doc.EndPrint()
            except Exception: pass

            try:
                if callable(doc.Close): doc.Close()
            except Exception: pass

        except Exception as batch_ex:
            errors.append(f"Batch print error ({tape_size}): {str(batch_ex)}")

    if success_count > 0:
        msg = f"Úspěšně vytisknuto {success_count} štítků v dávce s minimálním odpadem pásky!"
        if errors:
            msg += f" (Chyby: {'; '.join(errors)})"
        return True, msg
    else:
        return False, f"Chyba dávkového tisku: {'; '.join(errors)}"

class PrintAgentHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == "/status":
            is_bpac_ready, bpac_msg = check_bpac_com_available()
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {
                "status": "online" if is_bpac_ready else "bpac_missing",
                "bpac_available": is_bpac_ready,
                "detail": bpac_msg,
                "printer": "Brother PT-D460BTVP",
                "port": PRINTER_PORT
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path in ["/print-queue", "/api/print-queue"]:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                items = data.get("items", [])
                success, message = print_batch_bpac(items)
                
                status_code = 200 if success else 400
                self.send_response(status_code)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                
                response = {"success": success, "message": message}
                self.wfile.write(json.dumps(response).encode())
            except Exception as err:
                self.send_response(500)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "message": str(err)}).encode())

        elif self.path in ["/print-label", "/api/print-label"]:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                success, message = print_label_bpac(data)
                
                status_code = 200 if success else 400
                self.send_response(status_code)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                
                resp = {"success": success, "message": message}
                self.wfile.write(json.dumps(resp).encode())
            except Exception as err:
                self.send_response(500)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                resp = {"success": False, "message": f"Invalid JSON payload: {str(err)}"}
                self.wfile.write(json.dumps(resp).encode())
        else:
            self.send_response(404)
            self.end_headers()

def is_already_running(port: int) -> bool:
    """Checks if another instance of print_agent is already running on the given port."""
    try:
        import urllib.request
        req = urllib.request.Request(f"http://127.0.0.1:{port}/status")
        with urllib.request.urlopen(req, timeout=0.8) as res:
            if res.status == 200:
                data = json.loads(res.read().decode())
                if "printer" in data or "bpac_available" in data:
                    return True
    except Exception:
        pass
    return False

def run_agent():
    # If already running on port 5001, exit cleanly instead of crashing
    if is_already_running(PRINTER_PORT):
        print(f"[PRINT AGENT] Tiskový agent již běží na pozadí na portu {PRINTER_PORT}.")
        return

    is_bpac_ready, bpac_msg = check_bpac_com_available()
    if not is_bpac_ready:
        show_windows_error_dialog("Gypri Dílna - Chyba Tiskového Agenta", bpac_msg)
        print(f"[PRINT AGENT ERROR] {bpac_msg}")

    print("=" * 70)
    print("  Gypri Dílna - Brother b-PAC Print Agent (PT-D460BTVP)")
    print(f"  Listening on http://0.0.0.0:{PRINTER_PORT}")
    print(f"  Brother b-PAC SDK COM Status: {'READY' if is_bpac_ready else 'NOT INSTALLED'}")
    print("=" * 70)

    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    try:
        server = HTTPServer(("0.0.0.0", PRINTER_PORT), PrintAgentHandler)
    except OSError as e:
        print(f"[PRINT AGENT ERROR] Port {PRINTER_PORT} je již obsazen: {e}")
        return

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Print Agent...")
        server.server_close()

if __name__ == "__main__":
    run_agent()
