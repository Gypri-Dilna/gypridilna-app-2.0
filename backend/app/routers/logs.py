import csv
import io
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models.audit_log import AccessLog

router = APIRouter(prefix="/api/logs", tags=["Logs"])

def serialize_log(log: AccessLog):
    ts = log.timestamp.isoformat() if log.timestamp else ""
    if ts and not ts.endswith("Z") and "+" not in ts:
        ts += "Z"
    return {
        "id": log.id,
        "timestamp": ts,
        "chip_id": log.chip_id,
        "name": log.name,
        "result": log.result
    }

@router.get("")
def get_logs(limit: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(AccessLog).order_by(AccessLog.timestamp.desc())
    if limit:
        query = query.limit(limit)
    logs = query.all()
    return [serialize_log(l) for l in logs]

@router.delete("")
def delete_logs(db: Session = Depends(get_db)):
    try:
        num_rows_deleted = db.query(AccessLog).delete()
        db.commit()
        return {"message": f"{num_rows_deleted} logs deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export")
def export_logs(db: Session = Depends(get_db)):
    logs = db.query(AccessLog).order_by(AccessLog.timestamp.asc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["ID", "Timestamp (UTC)", "Chip ID", "Name", "Result"])
    for log in logs:
        ts = log.timestamp.isoformat() if log.timestamp else ""
        if ts and not ts.endswith("Z") and "+" not in ts:
            ts += "Z"
        writer.writerow([log.id, ts, log.chip_id, log.name, log.result])
        
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment;filename=access_logs.csv"}
    )
