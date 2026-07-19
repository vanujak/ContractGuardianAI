from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- Pydantic Models for Structured Gemini Outputs ---

class RiskRadarItem(BaseModel):
    category: str = Field(description="The legal area, e.g. Indemnification, Intellectual Property, Termination")
    riskLevel: str = Field(description="The risk level: Low, Medium, or High")
    riskReason: str = Field(description="Clear explanation of why this is risky for the selected persona")
    triggerText: str = Field(description="The exact text or sentence from the contract that triggered this assessment")

class NegotiationItem(BaseModel):
    triggerText: str = Field(description="The original wording from the contract that is risky or unilateral")
    proposedWording: str = Field(description="A fairer, mutual, win-win version that the persona could propose instead")
    explanation: str = Field(description="Brief explanation of why the proposed wording is more balanced and the benefit of proposing it")

class MissingClauseItem(BaseModel):
    clauseName: str = Field(description="Name of the missing clause, e.g. Dispute Resolution, Governing Law, Vacation Policy")
    explanation: str = Field(description="Why this clause is crucial to have in this type of contract for this persona")
    sampleTemplate: str = Field(description="A professional, standard template snippet for this missing clause that can be added")

class PersonaAnalysisResult(BaseModel):
    fairnessScore: int = Field(description="Overall fairness score from 0 (very unfair) to 100 (extremely balanced/fair)")
    riskScore: int = Field(description="Overall risk score from 0 (no risk) to 100 (high risk of litigation or severe penalty)")
    summary: List[str] = Field(description="A 3-minute executive summary consisting of 4-6 high-impact bullet points")
    riskRadar: List[RiskRadarItem] = Field(description="List of detected clauses with active risk assessments")
    negotiations: List[NegotiationItem] = Field(description="List of negotiation suggestions with side-by-side alternative wordings")
    missingClauses: List[MissingClauseItem] = Field(description="List of missing clauses relevant to this contract type")

class PartyAnalysisResult(BaseModel):
    partyName: str = Field(description="Name of the detected party (e.g. Alex Mercer, Sterling Properties)")
    partyRole: str = Field(description="Detected role of the party (e.g. Employee, Employer, Client, Contractor, Landlord, Tenant)")
    fairnessScore: int = Field(description="Overall fairness score for this party from 0 to 100")
    riskScore: int = Field(description="Overall risk score for this party from 0 to 100")
    summary: List[str] = Field(description="A 3-minute executive summary for this party consisting of 4-6 high-impact bullet points")
    riskRadar: List[RiskRadarItem] = Field(description="List of detected clauses with active risk assessments for this party")
    negotiations: List[NegotiationItem] = Field(description="List of negotiation suggestions with side-by-side alternative wordings for this party")
    missingClauses: List[MissingClauseItem] = Field(description="List of missing clauses relevant to this party")

class ContractAnalysisResult(BaseModel):
    parties: List[PartyAnalysisResult] = Field(description="Detailed analysis for each detected party in the contract")

# --- Client Request/Response Models ---

class ContractResponse(BaseModel):
    id: str
    title: str
    s3_key: str
    created_at: datetime
    raw_text: Optional[str] = None

    class Config:
        from_attributes = True

class ChatHistoryItem(BaseModel):
    role: str # "user" or "assistant"
    message: str

class ChatRequest(BaseModel):
    question: str
    persona: str
    history: Optional[List[ChatHistoryItem]] = []

class ChatResponse(BaseModel):
    answer: str

class CompareRequest(BaseModel):
    contract_id_a: str
    contract_id_b: str

class CompareItem(BaseModel):
    parameter: str = Field(description="The parameter compared, e.g., Salary, Notice Period, Liability, IP Ownership")
    contract_a_value: str = Field(description="Value in Contract A")
    contract_b_value: str = Field(description="Value in Contract B")
    comparison_note: str = Field(description="Brief analysis highlighting which is better and why")

class CompareResponse(BaseModel):
    comparison: List[CompareItem] = Field(description="List of contract comparison metrics")

class ComplianceItem(BaseModel):
    area: str = Field(description="The compliance area, e.g., Employment, Consumer Rights, Tax, Privacy")
    status: str = Field(description="Status of compliance: Compliant, Warning, or Critical")
    description: str = Field(description="Explanation of the potential compliance issue")
    recommendation: str = Field(description="What needs to be corrected or verified")

class ComplianceResponse(BaseModel):
    report: List[ComplianceItem]
    disclaimer: str = Field(description="Standard legal disclaimer explaining the report is informational and not legal advice")
