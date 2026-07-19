from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Contract, Analysis
from app.schemas import ContractResponse, PersonaAnalysisResult, CompareRequest, CompareResponse, ComplianceResponse
from app.services.parser import parse_pdf
from app.services.s3 import upload_contract_file
from app.services.gemini import analyze_contract_with_gemini, compare_contracts_with_gemini, check_compliance_with_gemini
from app.services.quota import verify_quota, get_quota_details
from pydantic import BaseModel
import json
import hashlib

router = APIRouter(prefix="/api/contracts", tags=["Contracts"])

class EditContractRequest(BaseModel):
    raw_text: str

@router.post("/upload", response_model=ContractResponse, dependencies=[Depends(verify_quota)])
def upload_contract(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Uploads a contract file, extracts text, uploads to S3/local-storage, and registers in DB.
    """
    try:
        # Sanitize filename to ensure no NUL bytes are present
        filename = file.filename.replace('\x00', '')
        print(f"--- Uploading contract: '{filename}' ---")
        
        file_bytes = file.file.read()
        
        # Calculate SHA-256 checksum of document bytes
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        
        # Check if document has already been uploaded
        existing_contract = db.query(Contract).filter(
            Contract.file_hash == file_hash,
            Contract.file_hash.isnot(None)
        ).first()
        
        if existing_contract:
            print(f"Duplicate contract detected (SHA-256: '{file_hash}'). Reusing contract ID '{existing_contract.id}'")
            return existing_contract
        
        # 1. Parse text from file bytes
        raw_text = parse_pdf(file_bytes, filename)
        
        # Ensure raw_text is completely stripped of NUL bytes
        raw_text = raw_text.replace('\x00', '')
        print(f"Extracted raw text length: {len(raw_text)} chars")
        
        # 2. Upload the file to S3 or local directory
        s3_key = upload_contract_file(file_bytes, filename).replace('\x00', '')
        print(f"Saved file key/path: '{s3_key}'")
        
        # 3. Create database entry
        contract = Contract(
            title=filename,
            s3_key=s3_key,
            raw_text=raw_text,
            file_hash=file_hash
        )
        
        # Final safety check before database operations
        if '\x00' in contract.title or '\x00' in contract.s3_key or '\x00' in contract.raw_text:
            print("WARNING: NUL character detected in DB fields despite sanitization!")
            contract.title = contract.title.replace('\x00', '')
            contract.s3_key = contract.s3_key.replace('\x00', '')
            contract.raw_text = contract.raw_text.replace('\x00', '')
            
        db.add(contract)
        db.commit()
        db.refresh(contract)
        print(f"Contract successfully saved in DB with ID: {contract.id}")
        
        return contract
    except Exception as e:
        db.rollback()
        print(f"ERROR during contract upload: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/quota-status")
def quota_status(db: Session = Depends(get_db)):
    """
    Returns daily Gemini API token quota details.
    """
    return get_quota_details(db)

@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: str, db: Session = Depends(get_db)):
    """
    Gets contract metadata and key.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

@router.get("/{contract_id}/text")
def get_contract_text(contract_id: str, db: Session = Depends(get_db)):
    """
    Gets the raw extracted text of the contract.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"raw_text": contract.raw_text}

@router.put("/{contract_id}/edit")
def edit_contract_text(contract_id: str, request: EditContractRequest, db: Session = Depends(get_db)):
    """
    Saves edited contract text back to the database (drafting mode).
    This clears cached analyses since the document text has changed.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    try:
        contract.raw_text = request.raw_text.replace('\x00', '')
        contract.file_hash = None # Clear hash as document has been customized
        
        # Clear existing analysis cache as the contract text is now updated
        db.query(Analysis).filter(Analysis.contract_id == contract_id).delete()
        
        db.commit()
        return {"status": "success", "message": "Contract updated and cache cleared"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{contract_id}/analyze", dependencies=[Depends(verify_quota)])
def analyze_contract(
    contract_id: str, 
    persona: str = Query(..., description="The persona lens to evaluate, e.g. Employee"),
    db: Session = Depends(get_db)
):
    """
    Analyzes contract from a selected persona. Caches the analysis in DB.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    # Check cache
    cached_analysis = db.query(Analysis).filter(
        Analysis.contract_id == contract_id,
        Analysis.persona == persona
    ).first()
    
    if cached_analysis:
        print(f"Returning cached analysis for contract {contract_id} as persona {persona}")
        # If SQLite returns as dict, or Postgres returns as dict/string
        if isinstance(cached_analysis.data, str):
            return json.loads(cached_analysis.data)
        return cached_analysis.data

    # Perform analysis
    print(f"Generating fresh analysis for contract {contract_id} as persona {persona}")
    analysis_data = analyze_contract_with_gemini(contract.raw_text, persona, db=db)
    
    try:
        # Cache results in DB
        db_analysis = Analysis(
            contract_id=contract_id,
            persona=persona,
            fairness_score=analysis_data.get("fairnessScore", 50),
            risk_score=analysis_data.get("riskScore", 50),
            data=analysis_data
        )
        db.add(db_analysis)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Warning: Failed to cache analysis results: {str(e)}")
        
    return analysis_data

@router.post("/compare", response_model=CompareResponse, dependencies=[Depends(verify_quota)])
def compare_contracts(request: CompareRequest, db: Session = Depends(get_db)):
    """
    Compares two contracts side-by-side.
    """
    contract_a = db.query(Contract).filter(Contract.id == request.contract_id_a).first()
    contract_b = db.query(Contract).filter(Contract.id == request.contract_id_b).first()
    
    if not contract_a or not contract_b:
        raise HTTPException(status_code=404, detail="One or both contracts not found")
        
    comparison = compare_contracts_with_gemini(contract_a.raw_text, contract_b.raw_text, db=db)
    return comparison

@router.get("/{contract_id}/compliance", response_model=ComplianceResponse, dependencies=[Depends(verify_quota)])
def get_compliance_report(
    contract_id: str, 
    region: str = Query("USA", description="Country/Region of law"),
    db: Session = Depends(get_db)
):
    """
    Audits a contract's local legal compliance.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    report = check_compliance_with_gemini(contract.raw_text, region, db=db)
    return report
