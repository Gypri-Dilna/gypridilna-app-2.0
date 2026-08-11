
import os
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timezone, time as time_obj
import json
from werkzeug.security import generate_password_hash, check_password_hash
import serial
import time

# --- Configuration ---
# Adjust the COM port based on where your Arduino for chip scanning is connected
SERIAL_PORT = 'COM3'  # For Windows (e.g., 'COM3')
# SERIAL_PORT = '/dev/tty.usbmodem14201' # For macOS/Linux
SERIAL_BAUDRATE = 9600
SERIAL_TIMEOUT = 5  # 5 seconds to present the chip

# --- App Initialization ---
app = Flask(__name__, static_folder='dist', static_url_path='/')
CORS(app)

# --- Admin Credentials ---
# In a production environment, these should be loaded from environment variables
# or a secure configuration file, not hardcoded.
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'rfid_admin_pass' # This is the new password

# Global state for remote opening
REMOTE_OPENING_REQUESTED = False
SERVICE_MODE_ENABLED = False
LAST_UNKNOWN_CHIP_ID = None

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'system.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Database Models ---
class Chip(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chip_id = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_allowed = db.Column(db.Boolean, default=True)
    is_one_time = db.Column(db.Boolean, default=False)
    valid_until = db.Column(db.DateTime, nullable=True)

class AccessLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    chip_id = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    result = db.Column(db.String(50), nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    # Permissions stored as a JSON string
    # { "service_mode": bool, "add_chips": bool, "view_logs": bool, "remote_opening": bool, "erase_logs": bool }
    permissions = db.Column(db.Text, nullable=False, default='{}')
    chip_id = db.Column(db.String(100), nullable=True) # Link to chip profile

# --- Helper Functions ---
def serialize_user(user):
    return {
        'id': user.id,
        'username': user.username,
        'is_admin': user.is_admin,
        'permissions': json.loads(user.permissions),
        'chip_id': user.chip_id
    }
def serialize_chip(chip):
    return {
        'id': chip.id,
        'chip_id': chip.chip_id,
        'name': chip.name,
        'is_allowed': chip.is_allowed,
        'is_one_time': chip.is_one_time,
        'valid_until': chip.valid_until.isoformat() if chip.valid_until else None,
    }

def serialize_log(log):
    # Ensure the timestamp is treated as UTC by appending 'Z' if not present
    ts = log.timestamp.isoformat()
    if not ts.endswith('Z') and not '+' in ts:
        ts += 'Z'
    return {
        'id': log.id,
        'timestamp': ts,
        'chip_id': log.chip_id,
        'name': log.name,
        'result': log.result,
    }

# --- API Endpoints ---

@app.route('/api/login', methods=['POST'])
def login():
    """Handles user login."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and check_password_hash(user.password_hash, password):
        return jsonify({
            'status': 'success',
            'user': serialize_user(user)
        }), 200
    
    # Fallback for initial admin if no users exist (for first run)
    if User.query.count() == 0 and username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        # Create the initial admin user
        admin_perms = {
            "service_mode": True,
            "add_chips": True,
            "view_logs": True,
            "remote_opening": True,
            "erase_logs": True
        }
        new_admin = User(
            username=ADMIN_USERNAME,
            password_hash=generate_password_hash(ADMIN_PASSWORD),
            is_admin=True,
            permissions=json.dumps(admin_perms)
        )
        db.session.add(new_admin)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'user': serialize_user(new_admin)
        }), 200
    
    return jsonify({'status': 'error', 'message': 'Invalid username or password.'}), 401



# --- Remote Opening Endpoints ---
@app.route('/api/remote-opening', methods=['POST'])
def remote_opening():
    """Endpoint triggered by the dashboard to request a door unlock."""
    global REMOTE_OPENING_REQUESTED
    data = request.json
    username = data.get('username', 'Unknown User')
    
    # Determine the name to log: use the name from the linked chip if available
    log_name = username
    user = User.query.filter_by(username=username).first()
    if user and user.chip_id:
        chip = Chip.query.filter_by(chip_id=user.chip_id).first()
        if chip:
            log_name = chip.name
    
    REMOTE_OPENING_REQUESTED = True
    
    # Log this action with the determined name
    log = AccessLog(chip_id='REMOTE_OPENING', name=log_name, result='GRANTED (REMOTE)')
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'status': 'OPENING_REQUESTED'}), 200

@app.route('/api/override-status', methods=['GET'])
def get_override_status():
    """Endpoint polled by the hardware to check if an opening is requested."""
    global REMOTE_OPENING_REQUESTED
    
    if REMOTE_OPENING_REQUESTED:
        # Reset the flag immediately after confirming to the hardware
        REMOTE_OPENING_REQUESTED = False
        return jsonify({'override': True})
    else:
        return jsonify({'override': False})

# --- Service Mode Endpoints ---
@app.route('/api/service-mode', methods=['GET'])
def set_service_mode():
    """Enable or disable service mode via a GET request."""
    global SERVICE_MODE_ENABLED
    # Get the 'enabled' query parameter, default to 'false' if not provided
    enabled_str = request.args.get('enabled', 'false').lower()
    enabled = enabled_str in ['true', '1', 't', 'yes']
    SERVICE_MODE_ENABLED = enabled
    
    # Log the service mode change
    status = 'ENABLED' if SERVICE_MODE_ENABLED else 'DISABLED'
    username = request.args.get('username', 'Admin')
    log = AccessLog(chip_id='SERVICE_MODE', name=username, result=f'SERVICE_MODE_{status}')
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'status': f'Service mode {status.lower()}'}), 200

@app.route('/api/service-mode-status', methods=['GET'])
def get_service_mode_status():
    """Get the current status of service mode."""
    global SERVICE_MODE_ENABLED
    return jsonify({'enabled': SERVICE_MODE_ENABLED})

@app.route('/api/last-unknown-chip', methods=['GET'])
def get_last_unknown_chip():
    """Endpoint for the dashboard to poll for a newly scanned, unregistered chip."""
    global LAST_UNKNOWN_CHIP_ID
    if LAST_UNKNOWN_CHIP_ID:
        chip_id_to_send = LAST_UNKNOWN_CHIP_ID
        LAST_UNKNOWN_CHIP_ID = None  # Clear after sending
        return jsonify({'chip_id': chip_id_to_send})
    else:
        return jsonify({'chip_id': None})

# Endpoint for checking access
@app.route('/api/check-access', methods=['POST'])
def check_access():
    data = request.json
    chip_id = data.get('chip_id')

    if not chip_id:
        return jsonify({'status': 'DENIED', 'reason': 'NO_CHIP_ID'}), 400

    global SERVICE_MODE_ENABLED
    if SERVICE_MODE_ENABLED:
        log = AccessLog(chip_id=chip_id, name='Service Mode', result='GRANTED (SERVICE)')
        db.session.add(log)
        db.session.commit()
        return jsonify({'status': 'GRANTED', 'reason': 'SERVICE_MODE_ACTIVE'})

    # The 'MANUAL_OVERRIDE' case from the dashboard is now handled by its own endpoints
    # and is no longer part of the standard access check.

    chip = Chip.query.filter_by(chip_id=chip_id).first()

    if not chip:
        global LAST_UNKNOWN_CHIP_ID
        LAST_UNKNOWN_CHIP_ID = chip_id
        log = AccessLog(chip_id=chip_id, name='Unknown', result='DENIED (UNKNOWN_CHIP)')
        db.session.add(log)
        db.session.commit()
        return jsonify({'status': 'DENIED', 'reason': 'UNKNOWN_CHIP'})

    if not chip.is_allowed:
        log = AccessLog(chip_id=chip_id, name=chip.name, result='DENIED (BLOCKED)')
        db.session.add(log)
        db.session.commit()
        return jsonify({'status': 'DENIED', 'reason': 'CHIP_BLOCKED'})

    if chip.valid_until and datetime.utcnow() > chip.valid_until:
        log = AccessLog(chip_id=chip_id, name=chip.name, result='DENIED (EXPIRED)')
        db.session.add(log)
        db.session.commit()
        return jsonify({'status': 'DENIED', 'reason': 'CHIP_EXPIRED'})

    today_start = datetime.combine(datetime.utcnow().date(), time_obj.min)
    
    todays_entries = AccessLog.query.filter(
        AccessLog.chip_id == chip_id,
        AccessLog.result == 'GRANTED',
        AccessLog.timestamp >= today_start
    ).count()
    
    daily_entry_count = todays_entries + 1

    if chip.is_one_time:
        chip.is_allowed = False

    log = AccessLog(chip_id=chip_id, name=chip.name, result='GRANTED')
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'status': 'GRANTED', 
        'name': chip.name,
        'daily_entry_count': daily_entry_count
    })


# CRUD for chips
@app.route('/api/chips', methods=['GET', 'POST'])
def manage_chips():
    if request.method == 'GET':
        chips = Chip.query.order_by(Chip.name).all()
        return jsonify([serialize_chip(c) for c in chips])
    
    if request.method == 'POST':
        data = request.json
        valid_until = datetime.fromisoformat(data['valid_until'].replace('Z', '+00:00')) if data.get('valid_until') else None
        
        new_chip = Chip(
            chip_id=data['chip_id'],
            name=data['name'],
            is_allowed=data['is_allowed'],
            is_one_time=data['is_one_time'],
            valid_until=valid_until
        )
        db.session.add(new_chip)
        db.session.commit()
        return jsonify(serialize_chip(new_chip)), 201

@app.route('/api/chips/<int:chip_id>', methods=['PUT', 'DELETE'])
def manage_single_chip(chip_id):
    chip = Chip.query.get_or_404(chip_id)
    
    if request.method == 'PUT':
        data = request.json
        old_name = chip.name
        new_name = data.get('name', '').strip()
        
        # If chip owner name changed, update all chips and logs owned by old_name
        if old_name and new_name and old_name != new_name:
            Chip.query.filter_by(name=old_name).update({'name': new_name})
            AccessLog.query.filter_by(name=old_name).update({'name': new_name})
        
        chip.chip_id = data['chip_id']
        chip.name = new_name
        chip.is_allowed = data['is_allowed']
        chip.is_one_time = data['is_one_time']
        chip.valid_until = datetime.fromisoformat(data['valid_until'].replace('Z', '+00:00')) if data.get('valid_until') else None
        db.session.commit()
        return jsonify(serialize_chip(chip))

    if request.method == 'DELETE':
        db.session.delete(chip)
        db.session.commit()
        return jsonify({'message': 'Chip deleted successfully'})

# Endpoint for logs
@app.route('/api/logs', methods=['GET', 'DELETE'])
def manage_logs():
    if request.method == 'GET':
        limit = request.args.get('limit', type=int)
        query = AccessLog.query.order_by(AccessLog.timestamp.desc())
        if limit:
            query = query.limit(limit)
        logs = query.all()
        return jsonify([serialize_log(l) for l in logs])
    
    if request.method == 'DELETE':
        try:
            num_rows_deleted = db.session.query(AccessLog).delete()
            db.session.commit()
            return jsonify({'message': f'{num_rows_deleted} logs deleted successfully.'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/api/logs/export', methods=['GET'])
def export_logs():
    """Exports all access logs to a CSV file."""
    import io
    import csv
    from flask import Response

    logs = AccessLog.query.order_by(AccessLog.timestamp.asc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['ID', 'Timestamp (UTC)', 'Chip ID', 'Name', 'Result'])
    
    # Write rows
    for log in logs:
        ts = log.timestamp.isoformat()
        if not ts.endswith('Z') and not '+' in ts:
            ts += 'Z'
        writer.writerow([log.id, ts, log.chip_id, log.name, log.result])
    
    output.seek(0)
    
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=access_logs.csv"}
    )

# --- User Management Endpoints ---
@app.route('/api/users', methods=['GET', 'POST'])
def manage_users():
    if request.method == 'GET':
        users = User.query.all()
        return jsonify([serialize_user(u) for u in users])
    
    if request.method == 'POST':
        data = request.json
        # Check if username exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
            
        new_user = User(
            username=data['username'],
            password_hash=generate_password_hash(data['password']),
            is_admin=data.get('is_admin', False),
            permissions=json.dumps(data.get('permissions', {})),
            chip_id=data.get('chip_id')
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify(serialize_user(new_user)), 201

@app.route('/api/users/<int:user_id>', methods=['PUT', 'DELETE'])
def manage_single_user(user_id):
    user = User.query.get_or_404(user_id)
    
    if request.method == 'PUT':
        data = request.json
        user.username = data['username']
        if data.get('password'):
            user.password_hash = generate_password_hash(data['password'])
        user.is_admin = data.get('is_admin', False)
        user.permissions = json.dumps(data.get('permissions', {}))
        user.chip_id = data.get('chip_id')
        db.session.commit()
        return jsonify(serialize_user(user))

    if request.method == 'DELETE':
        # Prevent deleting the last admin
        if user.is_admin and User.query.filter_by(is_admin=True).count() <= 1:
            return jsonify({'error': 'Cannot delete the last administrator'}), 400
            
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})

@app.route('/api/change-password', methods=['POST'])
def change_password():
    data = request.json
    user_id = data.get('user_id')
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if not check_password_hash(user.password_hash, old_password):
        return jsonify({'error': 'Incorrect current password'}), 401
        
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'}), 200

# --- Session-based Remote Scanning (PC <-> Mobile) ---
PAIRED_REMOTE_SESSIONS = {}

@app.route('/api/inventory/remote-scan/ping', methods=['POST'])
def ping_remote_session():
    data = request.json or {}
    session_id = data.get('session_id')
    device_name = data.get('device_name', 'Mobile Browser')
    if session_id:
        if session_id not in PAIRED_REMOTE_SESSIONS:
            PAIRED_REMOTE_SESSIONS[session_id] = {'qr_code': None, 'timestamp': 0.0, 'consumed': True}
        
        PAIRED_REMOTE_SESSIONS[session_id]['connected'] = True
        PAIRED_REMOTE_SESSIONS[session_id]['device_name'] = device_name
        PAIRED_REMOTE_SESSIONS[session_id]['last_ping'] = datetime.now(timezone.utc).timestamp()
        return jsonify({'status': 'ok', 'connected': True}), 200
    return jsonify({'error': 'Missing session_id'}), 400

@app.route('/api/inventory/remote-scan/disconnect', methods=['POST'])
def disconnect_remote_session():
    data = request.json or {}
    session_id = data.get('session_id')
    if session_id and session_id in PAIRED_REMOTE_SESSIONS:
        PAIRED_REMOTE_SESSIONS[session_id]['connected'] = False
        PAIRED_REMOTE_SESSIONS[session_id]['device_name'] = None
        return jsonify({'status': 'disconnected'}), 200
    return jsonify({'status': 'ignored'}), 200

@app.route('/api/inventory/remote-scan/status', methods=['GET'])
def get_remote_session_status():
    session_id = request.args.get('session_id')
    if session_id and session_id in PAIRED_REMOTE_SESSIONS:
        s_data = PAIRED_REMOTE_SESSIONS[session_id]
        now = datetime.now(timezone.utc).timestamp()
        last_ping = s_data.get('last_ping', 0.0)
        is_alive = s_data.get('connected', False) and (now - last_ping < 4.5)
        return jsonify({
            'session_id': session_id,
            'connected': is_alive,
            'device_name': s_data.get('device_name') if is_alive else None
        }), 200
    return jsonify({'session_id': session_id, 'connected': False, 'device_name': None}), 200

@app.route('/api/inventory/remote-scan', methods=['POST'])
def broadcast_remote_scan():
    data = request.json or {}
    session_id = data.get('session_id', 'default')
    qr_code = data.get('qr_code', '').strip()
    if qr_code:
        if session_id not in PAIRED_REMOTE_SESSIONS:
            PAIRED_REMOTE_SESSIONS[session_id] = {}
        PAIRED_REMOTE_SESSIONS[session_id].update({
            'qr_code': qr_code,
            'timestamp': datetime.now(timezone.utc).timestamp(),
            'consumed': False
        })
        return jsonify({'status': 'broadcasted', 'session_id': session_id, 'qr_code': qr_code}), 200
    return jsonify({'error': 'Missing qr_code'}), 400

@app.route('/api/inventory/remote-scan/latest', methods=['GET'])
def get_latest_remote_scan():
    session_id = request.args.get('session_id', 'default')
    try:
        since = float(request.args.get('since', 0.0))
    except (ValueError, TypeError):
        since = 0.0
    session_data = PAIRED_REMOTE_SESSIONS.get(session_id)
    if session_data and not session_data.get('consumed') and session_data.get('qr_code') and session_data['timestamp'] > since:
        qr_code = session_data['qr_code']
        ts = session_data['timestamp']
        session_data['consumed'] = True  # Instantly mark as consumed
        session_data['qr_code'] = None  # Clear payload so it CAN NEVER be replayed!
        return jsonify({
            'session_id': session_id,
            'qr_code': qr_code,
            'timestamp': ts
        }), 200
    return jsonify({'session_id': session_id, 'qr_code': None, 'timestamp': 0.0}), 200

# --- Serve Location Pictures & Storage Layout SVG ---
@app.route('/location-pictures/<path:filename>')
def serve_location_picture(filename):
    pics_dir = os.path.join(os.path.dirname(__file__), 'location pictures')
    if os.path.exists(os.path.join(pics_dir, filename)):
        return send_from_directory(pics_dir, filename)
    return jsonify({'error': 'Location picture not found'}), 404

# --- Serve Frontend App ---
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return serve_index()

# --- Run Application ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
