import json
from google import genai
from google.genai import types
from app.config import settings
from app.schemas import PersonaAnalysisResult, CompareResponse, ComplianceResponse
from typing import List, Dict, Any

def get_gemini_client():
    if not settings.GEMINI_API_KEY:
        return None
    try:
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {str(e)}")
        return None

def analyze_contract_with_gemini(text: str, persona: str) -> Dict[str, Any]:
    """
    Analyzes contract text from the perspective of a specific persona.
    Returns data matching PersonaAnalysisResult schema.
    """
    client = get_gemini_client()
    if not client:
        return get_mock_analysis_data(text, persona)

    prompt = f"""
    You are an elite legal workspace assistant. Analyze the following contract from the perspective of a **{persona}**.
    
    CRITICAL INSTRUCTIONS:
    1. Assess the contract thoroughly through the lens of a {persona}. Identify what clauses protect them, what clauses disadvantage them, and what is missing.
    2. Assess the overall `fairnessScore` (0-100) and `riskScore` (0-100) from this persona's viewpoint.
    3. Generate 4-6 bullet points of executive summary customized for this persona.
    4. For the `riskRadar` items:
       - Find clauses of high/medium/low risk.
       - Explain why it is risky for a {persona}.
       - The `triggerText` MUST be an EXACT word-for-word substring from the contract text below. If you cannot find the exact substring, do not make it up, copy it exactly.
    5. For the `negotiations` items:
       - Provide suggestions where a clause is heavily one-sided.
       - The `triggerText` MUST be an EXACT word-for-word substring from the contract.
       - The `proposedWording` must be a fairer, balanced, win-win version that a {persona} can propose.
    6. For the `missingClauses` items, identify clauses that should be in this contract type but are absent, and provide boilerplate templates.

    CONTRACT TEXT:
    ---
    {text}
    ---
    """

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PersonaAnalysisResult,
                temperature=0.1
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API analysis failed: {str(e)}. Falling back to mock data.")
        return get_mock_analysis_data(text, persona)

def chat_with_gemini(text: str, question: str, persona: str, history: List[Dict[str, str]] = None) -> str:
    """
    Answers a question about the contract text from the perspective of the persona.
    """
    client = get_gemini_client()
    if not client:
        return get_mock_chat_response(text, question, persona)

    history_prompt = ""
    if history:
        history_prompt = "Conversation History:\n" + "\n".join([f"{h['role']}: {h['message']}" for h in history]) + "\n\n"

    prompt = f"""
    You are an AI Contract Assistant. Answer the user's question about the contract text.
    You must adopt the lens and advocate for the perspective of a **{persona}**.
    
    {history_prompt}
    Contract text:
    ---
    {text}
    ---
    
    User question: {question}
    
    Keep your answer concise, accurate, and highly relevant to the contract text. Do not make up facts. Reference specific parts of the contract when answering.
    """
    
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Gemini API chat failed: {str(e)}")
        return f"[API Error - Mock Answer] Since this contract mentions terms matching your question, please note that as a {persona}, this could affect your obligations. (API Key not set or quota exceeded)."

def compare_contracts_with_gemini(text_a: str, text_b: str) -> Dict[str, Any]:
    """
    Compares two contracts side by side.
    """
    client = get_gemini_client()
    if not client:
        return get_mock_comparison_data(text_a, text_b)

    prompt = f"""
    Compare the following two contracts side-by-side. 
    Analyze key parameters like Compensation/Fees, Notice Period for Termination, Liability Caps, IP Ownership, and General Balance.
    
    Contract A:
    ---
    {text_a}
    ---
    
    Contract B:
    ---
    {text_b}
    ---
    
    Return a structured JSON object matching the comparison schema.
    """
    
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CompareResponse,
                temperature=0.1
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API comparison failed: {str(e)}. Falling back to mock comparison.")
        return get_mock_comparison_data(text_a, text_b)

def check_compliance_with_gemini(text: str, region: str) -> Dict[str, Any]:
    """
    Audits a contract for regional compliance (US, UK, India, Sri Lanka).
    """
    client = get_gemini_client()
    if not client:
        return get_mock_compliance_data(text, region)

    prompt = f"""
    Analyze the compliance of the following contract under the laws of **{region}**.
    Cover areas like Employment laws, Consumer Protection rights, local Taxation compliance, and general business regulations.
    
    Contract text:
    ---
    {text}
    ---
    
    Return a structured JSON object matching the compliance schema. Always include a disclaimer stating that this is for informational purposes only.
    """
    
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ComplianceResponse,
                temperature=0.2
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API compliance failed: {str(e)}. Falling back to mock compliance.")
        return get_mock_compliance_data(text, region)


# ==========================================
# Mock Data Generators (Zero-Config Mode)
# ==========================================

def get_mock_analysis_data(text: str, persona: str) -> Dict[str, Any]:
    """
    Provides mock analysis data if API key is not configured.
    """
    lower_text = text.lower()
    
    # Detect contract type
    is_nda = "non-disclosure" in lower_text or "confidentiality" in lower_text or "nda" in lower_text
    is_lease = "lease" in lower_text or "rental" in lower_text or "tenant" in lower_text
    
    # Set default values based on persona
    if persona in ["Employee", "Freelancer"]:
        fairness = 45 if not is_nda else 75
        risk = 65 if not is_nda else 35
    elif persona in ["Employer", "Client"]:
        fairness = 85
        risk = 25
    else:
        fairness = 60
        risk = 45
        
    # Standard fallback triggers
    trigger_liq = "Company may terminate this agreement at any time without notice or cause"
    trigger_noncomp = "Employee shall not engage in any competitive business for a period of five (5) years"
    trigger_ip = "All intellectual property created during the term of employment shall belong solely to the Company"
    trigger_indem = "The Contractor agrees to indemnify and hold harmless the Client from all claims and liabilities"

    # Make sure triggers exist in some form, or we inject them in the mock contract text
    # Risk Radar
    risk_items = [
        {
            "category": "Termination",
            "riskLevel": "High" if persona in ["Employee", "Freelancer", "Tenant"] else "Low",
            "riskReason": f"Allows unilateral termination without notice. Disadvantageous for {persona}.",
            "triggerText": trigger_liq if trigger_liq.lower() in lower_text else "at any time without notice"
        },
        {
            "category": "Intellectual Property",
            "riskLevel": "Medium",
            "riskReason": f"Broad assignment of all intellectual property, including work done outside business hours.",
            "triggerText": trigger_ip if trigger_ip.lower() in lower_text else "shall belong solely to the"
        }
    ]
    
    if not is_nda:
        risk_items.append({
            "category": "Non-Compete",
            "riskLevel": "High" if persona == "Employee" else "Low",
            "riskReason": "A 5-year non-compete is highly restrictive and likely unenforceable in many jurisdictions.",
            "triggerText": trigger_noncomp if trigger_noncomp.lower() in lower_text else "period of five (5) years"
        })

    # Negotiation Suggestions
    negotiations = [
        {
            "triggerText": "at any time without notice",
            "proposedWording": "either party may terminate this agreement upon thirty (30) days' written notice",
            "explanation": "Provides mutual termination security and guarantees transition time."
        },
        {
            "triggerText": "shall belong solely to the",
            "proposedWording": "IP created directly in performance of the services shall belong to the Client, while pre-existing IP remains with the Creator.",
            "explanation": "Protects your independent tools, code, and pre-existing libraries."
        }
    ]
    
    missing = [
        {
            "clauseName": "Dispute Resolution",
            "explanation": "No clear mechanism for disputes is outlined, which could lead to direct litigation.",
            "sampleTemplate": "In the event of a dispute, the parties agree to first attempt mediation in good faith before filing suit."
        },
        {
            "clauseName": "Governing Law",
            "explanation": "The contract does not state which state/country's laws govern this document.",
            "sampleTemplate": "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware."
        }
    ]

    return {
        "fairnessScore": fairness,
        "riskScore": risk,
        "summary": [
            f"Review performed under the lens of a **{persona}**.",
            "Contains unilateral termination terms favoring the drafting party.",
            "Assigns complete intellectual property rights without carving out pre-existing assets.",
            "Lacks a standard dispute resolution clause and local governing law designations.",
            "Includes restrictive non-compete terms that could impact future work options."
        ],
        "riskRadar": risk_items,
        "negotiations": negotiations,
        "missingClauses": missing
    }

def get_mock_chat_response(text: str, question: str, persona: str) -> str:
    q = question.lower()
    if "terminate" in q or "notice" in q:
        return f"Regarding termination as an **{persona}**:\nThe contract contains a clause allowing termination 'at any time without notice'. This is highly risky. You should negotiate a mutual 30-day notice period."
    elif "ip" in q or "intellectual" in q or "owns" in q:
        return f"Regarding Intellectual Property ownership as an **{persona}**:\nAll IP created during the contract is currently assigned directly to the client/company. If you have pre-existing templates or tools, they are not excluded, which means you might lose ownership of them."
    elif "pay" in q or "salary" in q or "rate" in q:
        return "The contract specifies standard payment terms, but is missing details regarding late payment penalties, which could affect your cash flow as a freelancer or contractor."
    else:
        return f"Based on the contract text and analyzing it as a **{persona}**:\nI can see terms relating to obligations, confidentiality, and liability. Please look at the **Risk Radar** and **Negotiation Suggestions** tabs for a full analysis of this specific section."

def get_mock_comparison_data(text_a: str, text_b: str) -> Dict[str, Any]:
    return {
        "comparison": [
            {
                "parameter": "Termination Notice",
                "contract_a_value": "Immediate (no notice required)",
                "contract_b_value": "30 Days written notice",
                "comparison_note": "Contract B is significantly fairer as it protects you from sudden termination."
            },
            {
                "parameter": "Intellectual Property",
                "contract_a_value": "Complete transfer (all IP belongs to company)",
                "contract_b_value": "Limited transfer (only IP developed for client belongs to client)",
                "comparison_note": "Contract B is better because it carves out and protects your pre-existing IP."
            },
            {
                "parameter": "Liability Cap",
                "contract_a_value": "Unlimited liability",
                "contract_b_value": "Capped at fees paid in the last 12 months",
                "comparison_note": "Contract B protects you from catastrophic litigation claims."
            },
            {
                "parameter": "Governing Law",
                "contract_a_value": "Not specified",
                "contract_b_value": "State of New York, USA",
                "comparison_note": "Contract B defines a clear jurisdiction, avoiding future legal ambiguity."
            }
        ]
    }

def get_mock_compliance_data(text: str, region: str) -> Dict[str, Any]:
    return {
        "report": [
            {
                "area": "Employment Law",
                "status": "Critical",
                "description": f"The unilateral termination terms conflict with employment standards in {region}.",
                "recommendation": "Add a minimum notice period matching statutory guidelines."
            },
            {
                "area": "Consumer Rights",
                "status": "Warning",
                "description": "Limitation of liability is overly broad and may violate local consumer protection statutes.",
                "recommendation": "Restrict the liability limit to exclude gross negligence or intentional harm."
            },
            {
                "area": "Taxation",
                "status": "Compliant",
                "description": "Payment and invoicing terms are clearly structured.",
                "recommendation": "Ensure local tax registration numbers are added to invoice headers."
            }
        ],
        "disclaimer": "Disclaimer: This compliance check is performed by an AI model and does not constitute formal legal advice. Please consult a qualified lawyer in your region."
    }
