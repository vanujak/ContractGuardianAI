from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Contract, ChatMessage
from app.schemas import ChatRequest, ChatResponse, ChatHistoryItem
from app.services.gemini import chat_with_gemini
from app.services.quota import verify_quota
from typing import List

router = APIRouter(prefix="/api/contracts", tags=["Chat"])

@router.post("/{contract_id}/chat", response_model=ChatResponse, dependencies=[Depends(verify_quota)])
def query_contract_chat(contract_id: str, request: ChatRequest, db: Session = Depends(get_db)):
    """
    Asks a question about a contract from a specific persona's point of view.
    Stores history in DB.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    # Convert incoming history list into format expected by Gemini service
    history_list = []
    if request.history:
        for item in request.history:
            history_list.append({"role": item.role, "message": item.message})

    # Save user's question to database
    user_msg = ChatMessage(
        contract_id=contract_id,
        role="user",
        message=request.question.replace('\x00', '')
    )
    db.add(user_msg)
    
    # Run chat service
    answer = chat_with_gemini(
        text=contract.raw_text,
        question=request.question,
        persona=request.persona,
        history=history_list,
        db=db
    )
    
    # Save assistant's answer to database
    assistant_msg = ChatMessage(
        contract_id=contract_id,
        role="assistant",
        message=answer.replace('\x00', '')
    )
    db.add(assistant_msg)
    db.commit()
    
    return ChatResponse(answer=answer)

@router.get("/{contract_id}/chat/history", response_model=List[ChatHistoryItem])
def get_chat_history(contract_id: str, db: Session = Depends(get_db)):
    """
    Gets the historical messages for this contract chat.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    messages = db.query(ChatMessage).filter(
        ChatMessage.contract_id == contract_id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    return [
        ChatHistoryItem(role=msg.role, message=msg.message)
        for msg in messages
    ]
