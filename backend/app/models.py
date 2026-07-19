import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, JSON, Date
from sqlalchemy.orm import relationship
from app.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    s3_key = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    file_hash = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    analyses = relationship("Analysis", back_populates="contract", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="contract", cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    persona = Column(String, nullable=False)
    fairness_score = Column(Integer, nullable=False)
    risk_score = Column(Integer, nullable=False)
    data = Column(JSON, nullable=False) # Stores JSON payload (summary, riskRadar, negotiations, missingClauses)
    created_at = Column(DateTime, default=datetime.utcnow)

    contract = relationship("Contract", back_populates="analyses")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False) # "user" or "assistant"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    contract = relationship("Contract", back_populates="chat_messages")

class TokenUsage(Base):
    __tablename__ = "token_usages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(Date, nullable=False, unique=True, default=lambda: datetime.utcnow().date())
    tokens_used = Column(Integer, nullable=False, default=0)

