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
    Uses local TF-IDF RAG to slice contract and retrieve top matching paragraphs.
    """
    from app.services.rag import get_relevant_chunks

    client = get_gemini_client()
    if not client:
        return get_mock_chat_response(text, question, persona)

    # 1. Retrieve the top 3 relevant paragraphs
    relevant_chunks = get_relevant_chunks(text, question, top_k=3)
    context_text = "\n\n".join(relevant_chunks) if relevant_chunks else text

    history_prompt = ""
    if history:
        history_prompt = "Conversation History:\n" + "\n".join([f"{h['role']}: {h['message']}" for h in history]) + "\n\n"

    prompt = f"""
    You are an AI Contract Assistant. Answer the user's question about the contract based ON THE PROVIDED RELEVANT EXCERPTS.
    You must adopt the lens and advocate for the perspective of a **{persona}**.
    
    {history_prompt}
    Relevant Contract Excerpts:
    ---
    {context_text}
    ---
    
    User question: {question}
    
    Keep your answer concise, accurate, and highly relevant to the provided excerpts. Do not make up facts. Reference specific terms in the excerpts when answering.
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
    Compares two contracts side-by-side.
    Uses local RAG to retrieve matching snippets for key parameters from both contracts
    to reduce token counts and prevent prompt context overflow.
    """
    from app.services.rag import get_relevant_chunks

    client = get_gemini_client()
    if not client:
        return get_mock_comparison_data(text_a, text_b)

    comparison_parameters = {
        "Compensation & Fees": "salary compensation monthly payment fee rate invoice billing",
        "Notice Period & Termination": "termination terminate notice period quit fire at-will",
        "Liability Caps": "liability cap limit damage indemnity indemnify hold harmless",
        "Intellectual Property Ownership": "intellectual property ip software code ownership patent copyright feedback assignment",
        "Governing Law & Disputes": "governing law dispute jurisdiction court arbitration delaware state country region"
    }

    compiled_context = []
    for param_name, search_query in comparison_parameters.items():
        # Query Contract A
        chunks_a = get_relevant_chunks(text_a, search_query, top_k=1)
        snippet_a = chunks_a[0] if chunks_a else "No matching clause found."
        
        # Query Contract B
        chunks_b = get_relevant_chunks(text_b, search_query, top_k=1)
        snippet_b = chunks_b[0] if chunks_b else "No matching clause found."
        
        compiled_context.append(f"""
PARAMETER: {param_name}
- Contract A Clause Wording: "{snippet_a}"
- Contract B Clause Wording: "{snippet_b}"
""")

    context_text = "\n".join(compiled_context)

    prompt = f"""
    Compare the two contracts side-by-side based ON THE PROVIDED RELEVANT EXCERPTS for each key parameter.
    
    EXCERPTS:
    ---
    {context_text}
    ---
    
    Generate a side-by-side comparison matrix. For each parameter (Compensation/Fees, Notice Period, Liability Caps, IP Ownership, Governing Law/Disputes), analyze:
    1. The core value/terms in Contract A
    2. The core value/terms in Contract B
    3. AI comparison assessment notes summarizing the differences and balance.
    
    Return a structured JSON object matching the CompareResponse schema.
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
    Uses local RAG to retrieve compliance-critical paragraphs first.
    """
    from app.services.rag import get_relevant_chunks

    client = get_gemini_client()
    if not client:
        return get_mock_compliance_data(text, region)

    # Retrieve compliance-critical sections
    compliance_keywords = "termination notice working hours salary taxes liability consumer protection dispute governing law"
    relevant_chunks = get_relevant_chunks(text, compliance_keywords, top_k=5)
    context_text = "\n\n".join(relevant_chunks) if relevant_chunks else text

    prompt = f"""
    Analyze the compliance of the following contract excerpts under the laws of **{region}**.
    Focus on compliance parameters like Employment standards (notice periods/hours), Consumer Protection rights, local Taxation requirements, and Governing Law.
    
    Contract excerpts:
    ---
    {context_text}
    ---
    
    Return a structured JSON object matching the ComplianceResponse schema. Always include a disclaimer stating that this is for informational purposes only.
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
