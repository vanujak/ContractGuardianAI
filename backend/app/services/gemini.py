import json
from google import genai
from google.genai import types
from app.config import settings
from app.schemas import PersonaAnalysisResult, CompareResponse, ComplianceResponse, ContractAnalysisResult
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.quota import increment_token_usage

def get_gemini_client():
    if not settings.GEMINI_API_KEY:
        return None
    try:
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {str(e)}")
        return None

def analyze_contract_with_gemini(text: str, db: Session = None) -> Dict[str, Any]:
    """
    Auto-detects the contracting parties and analyzes the contract text from the perspective of each party.
    Returns data matching ContractAnalysisResult schema.
    """
    client = get_gemini_client()
    if not client:
        mock_data = get_mock_analysis_data(text)
        if db:
            increment_token_usage(db, 15000)
        return mock_data

    prompt = f"""
    You are an elite legal workspace assistant. Analyze the following contract.
    First, auto-detect all key parties (at least the main contracting parties) involved in the contract and identify their names and roles.
    Then, for each party, perform a comprehensive analysis of their perspective.
    
    CRITICAL INSTRUCTIONS:
    1. For each detected party, identify their exact name and role (e.g. Employee, Employer, Tenant, Landlord, Discloser, Recipient, Client, Contractor).
    2. Assess the contract thoroughly through the lens of that party. Identify what clauses protect them, what clauses disadvantage them, and what is missing.
    3. Assess the overall `fairnessScore` (0-100) and `riskScore` (0-100) from that specific party's viewpoint.
    4. Generate 4-6 bullet points of executive summary customized for that party.
    5. For the `riskRadar` items of each party:
       - Find clauses of high/medium/low risk.
       - Explain why it is risky for this specific party.
       - The `triggerText` MUST be an EXACT word-for-word substring from the contract text below. If you cannot find the exact substring, do not make it up, copy it exactly.
    6. For the `negotiations` items of each party:
       - Provide suggestions where a clause is heavily one-sided.
       - The `triggerText` MUST be an EXACT word-for-word substring from the contract.
       - The `proposedWording` must be a fairer, balanced, win-win version that this party can propose.
    7. For the `missingClauses` items of each party, identify clauses that should be in this contract type but are absent, and provide boilerplate templates.

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
                response_schema=ContractAnalysisResult,
                temperature=0.1
            )
        )
        if db and response.usage_metadata:
            increment_token_usage(db, response.usage_metadata.total_token_count)
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API analysis failed: {str(e)}. Falling back to mock data.")
        mock_data = get_mock_analysis_data(text)
        if db:
            increment_token_usage(db, 15000)
        return mock_data

def chat_with_gemini(text: str, question: str, persona: str, history: List[Dict[str, str]] = None, db: Session = None) -> str:
    """
    Answers a question about the contract text from the perspective of the persona.
    Uses local TF-IDF RAG to slice contract and retrieve top matching paragraphs.
    """
    from app.services.rag import get_relevant_chunks

    client = get_gemini_client()
    if not client:
        mock_resp = get_mock_chat_response(text, question, persona)
        if db:
            increment_token_usage(db, 5000)
        return mock_resp

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
        if db and response.usage_metadata:
            increment_token_usage(db, response.usage_metadata.total_token_count)
        return response.text
    except Exception as e:
        print(f"Gemini API chat failed: {str(e)}")
        if db:
            increment_token_usage(db, 5000)
        return f"[API Error - Mock Answer] Since this contract mentions terms matching your question, please note that as a {persona}, this could affect your obligations. (API Key not set or quota exceeded)."

def compare_contracts_with_gemini(text_a: str, text_b: str, db: Session = None) -> Dict[str, Any]:
    """
    Compares two contracts side-by-side.
    Uses local RAG to retrieve matching snippets for key parameters from both contracts
    to reduce token counts and prevent prompt context overflow.
    """
    from app.services.rag import get_relevant_chunks

    client = get_gemini_client()
    if not client:
        mock_data = get_mock_comparison_data(text_a, text_b)
        if db:
            increment_token_usage(db, 25000)
        return mock_data

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
        if db and response.usage_metadata:
            increment_token_usage(db, response.usage_metadata.total_token_count)
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API comparison failed: {str(e)}. Falling back to mock comparison.")
        mock_data = get_mock_comparison_data(text_a, text_b)
        if db:
            increment_token_usage(db, 25000)
        return mock_data

def check_compliance_with_gemini(text: str, region: str, db: Session = None) -> Dict[str, Any]:
    """
    Audits a contract for regional compliance (US, UK, India, Sri Lanka).
    Uses local RAG to retrieve compliance-critical paragraphs first.
    """
    from app.services.rag import get_relevant_chunks

    client = get_gemini_client()
    if not client:
        mock_data = get_mock_compliance_data(text, region)
        if db:
            increment_token_usage(db, 15000)
        return mock_data

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
        if db and response.usage_metadata:
            increment_token_usage(db, response.usage_metadata.total_token_count)
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API compliance failed: {str(e)}. Falling back to mock compliance.")
        mock_data = get_mock_compliance_data(text, region)
        if db:
            increment_token_usage(db, 15000)
        return mock_data


# ==========================================
# Mock Data Generators (Zero-Config Mode)
# ==========================================

def get_mock_analysis_data(text: str) -> Dict[str, Any]:
    """
    Provides mock analysis data for auto-detected parties if API key is not configured.
    """
    lower_text = text.lower()
    
    is_nda = "non-disclosure" in lower_text or "confidentiality" in lower_text or "nda" in lower_text
    is_lease = "lease" in lower_text or "rental" in lower_text or "tenant" in lower_text
    
    parties = []
    
    if is_nda:
        # Alpha Startups (Founder/Discloser)
        p1 = {
            "partyName": "Alpha Startups Inc.",
            "partyRole": "Discloser/Founder",
            "fairnessScore": 50,
            "riskScore": 70,
            "summary": [
                "This mutual NDA contains **significant loopholes** that heavily disadvantage you as a Startup Founder.",
                "The Venture Capital firm has carved out the right to **disclose your information to partners without breach**.",
                "The **confidentiality term is only 1 year**, meaning they can freely share or copy your startup code after 12 months.",
                "Liability for the VC firm is **capped at $500**, making it impossible to seek meaningful damages if they leak your secret ideas.",
                "Gives the VC firm a **free license to use any feedback** or product ideas you discuss."
            ],
            "riskRadar": [
                {
                    "category": "Information Sharing Loophole",
                    "riskLevel": "High",
                    "riskReason": "The VC company can share your proprietary documents with their partners, affiliates, and advisors under the guise of this clause, bypassing secrecy.",
                    "triggerText": "VCP reserves the right to disclose any information received to its affiliates, partners, and advisors without notice or restriction, and such disclosure shall not be deemed a breach"
                },
                {
                    "category": "Obligation Duration",
                    "riskLevel": "High",
                    "riskReason": "A 1-year confidentiality term is far too short. If fundraising takes 6 months, your secrets are only protected for 6 additional months.",
                    "triggerText": "This Agreement shall expire one (1) year from the date hereof. Upon expiration, all obligations of confidentiality under this Agreement shall cease immediately"
                },
                {
                    "category": "Liability Limit",
                    "riskLevel": "High",
                    "riskReason": "If they leak your core patent-pending algorithm causing $1M in damage, you can only collect $500.",
                    "triggerText": "maximum aggregate liability for any breaches of this Agreement shall be limited to $500"
                },
                {
                    "category": "Intellectual Property License",
                    "riskLevel": "Medium",
                    "riskReason": "Allows them to use your design ideas or feature suggestions royalty-free, which they could pass to competitor portfolio companies.",
                    "triggerText": "VCP shall have a royalty-free license to use any feedback or product ideas shared by Alpha during discussions."
                }
            ],
            "negotiations": [
                {
                    "triggerText": "VCP reserves the right to disclose any information received to its affiliates, partners, and advisors without notice or restriction, and such disclosure shall not be deemed a breach",
                    "proposedWording": "Receiving Party may disclose Confidential Information only to its employees and advisors who have a strict 'need to know' and who are bound by confidentiality agreements at least as restrictive as this Agreement.",
                    "explanation": "Restricts disclosure to legitimate team members and makes them bound to secrecy."
                },
                {
                    "triggerText": "This Agreement shall expire one (1) year from the date hereof. Upon expiration, all obligations of confidentiality under this Agreement shall cease immediately",
                    "proposedWording": "The confidentiality obligations hereunder shall survive for a period of three (3) years from the date of disclosure.",
                    "explanation": "Extends the protection duration to a reasonable standard time for fundraising cycles."
                },
                {
                    "triggerText": "maximum aggregate liability for any breaches of this Agreement shall be limited to $500",
                    "proposedWording": "Neither party shall limit its liability for direct damages arising from a breach of confidentiality obligations under this Agreement.",
                    "explanation": "Ensures meaningful legal recourse and deterrence if VCP leaks proprietary IP."
                },
                {
                    "triggerText": "VCP shall have a royalty-free license to use any feedback or product ideas shared by Alpha during discussions.",
                    "proposedWording": "Neither party shall acquire any intellectual property rights or licenses under this Agreement.",
                    "explanation": "Prevents VCP from exploiting suggestions or design discussions without a commercial agreement."
                }
            ],
            "missingClauses": [
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
        }
        
        # Venture Capital Partners (Recipient/Investor)
        p2 = {
            "partyName": "Venture Capital Partners Ltd",
            "partyRole": "Recipient/Investor",
            "fairnessScore": 88,
            "riskScore": 15,
            "summary": [
                "This contract offers **maximum legal flexibility** for Venture Capital Partners Ltd.",
                "You can disclose received information to partners and affiliates without a breach.",
                "Your liability is capped at a very safe **$500**, protecting you from catastrophic claims.",
                "Confidentiality duration is only 1 year, ensuring you are quickly released from the secrecy obligations."
            ],
            "riskRadar": [
                {
                    "category": "Loophole Enforceability",
                    "riskLevel": "Medium",
                    "riskReason": "The broad disclosure loophole might be seen by a court as undermining the 'Mutual' intent of the NDA, which could jeopardize its validity.",
                    "triggerText": "VCP reserves the right to disclose any information received to its affiliates, partners, and advisors without notice or restriction"
                }
            ],
            "negotiations": [
                {
                    "triggerText": "VCP reserves the right to disclose any information received to its affiliates, partners, and advisors without notice or restriction",
                    "proposedWording": "VCP shall use reasonable efforts to ensure affiliates and partners maintain confidentiality of the disclosed information.",
                    "explanation": "Maintains flexibility for VCP while providing reasonable comfort to the counterparty."
                }
            ],
            "missingClauses": [
                {
                    "clauseName": "Company Property Return",
                    "explanation": "Lacks a specific clause obligating the partner to return files.",
                    "sampleTemplate": "Upon written request, each party shall promptly return or destroy all confidential documents."
                }
            ]
        }
        parties = [p1, p2]
        
    elif is_lease:
        # Jordan Smith (Tenant)
        p1 = {
            "partyName": "Jordan Smith",
            "partyRole": "Tenant",
            "fairnessScore": 25,
            "riskScore": 85,
            "summary": [
                "This lease is **extremely one-sided** and predatory towards Jordan Smith (Tenant).",
                "Includes **exorbitant late fees** ($250 instantly, plus $50/day) which accumulate rapidly.",
                "Allows **landlord entry at any time without prior notice**, violating privacy rights.",
                "Requires tenant to pay for **all plumbing and electrical system repairs**, even for normal wear and tear.",
                "Renews automatically for **another 12 months** with a 15% rent hike unless notice is given 90 days early."
            ],
            "riskRadar": [
                {
                    "category": "Late Fee Penalty",
                    "riskLevel": "High",
                    "riskReason": "Late fees accumulate extremely fast and could lead to thousands of dollars of debt in a few weeks.",
                    "triggerText": "If rent is not received by the 2nd day of the month, a late fee of $250 shall be applied immediately. For every day thereafter that rent remains unpaid, an additional fee of $50 per day shall accumulate."
                },
                {
                    "category": "Landlord Entry Rights",
                    "riskLevel": "High",
                    "riskReason": "Unannounced entry is a severe intrusion on privacy and violates standard landlord-tenant laws in most jurisdictions.",
                    "triggerText": "The Landlord reserves the right to enter the leased premises at any time, without prior notice to the Tenant"
                },
                {
                    "category": "Automatic Renewal",
                    "riskLevel": "High",
                    "riskReason": "Locks you into a new 1-year contract at a steep 15% increase unless you remember to cancel 90 days before the lease ends.",
                    "triggerText": "this Lease shall automatically renew for another 12-month term at a rent rate increase of 15%, unless the Tenant provides written notice of non-renewal at least ninety (90) days prior"
                },
                {
                    "category": "Maintenance Liability",
                    "riskLevel": "High",
                    "riskReason": "You could be forced to pay thousands of dollars to replace a broken furnace or water main through no fault of your own.",
                    "triggerText": "The Tenant shall be solely responsible for all maintenance and repair costs, including repairs to plumbing, heating, air conditioning, and electrical systems, regardless of whether the damage was caused by the Tenant or normal wear and tear."
                }
            ],
            "negotiations": [
                {
                    "triggerText": "If rent is not received by the 2nd day of the month, a late fee of $250 shall be applied immediately. For every day thereafter that rent remains unpaid, an additional fee of $50 per day shall accumulate.",
                    "proposedWording": "If rent is not received by the 5th day of the month, a flat late fee of $50 shall be applied. No daily interest shall accumulate.",
                    "explanation": "Replaces exponential daily fees with a standard grace period and capped fee."
                },
                {
                    "triggerText": "The Landlord reserves the right to enter the leased premises at any time, without prior notice to the Tenant",
                    "proposedWording": "The Landlord shall provide at least twenty-four (24) hours' written notice before entering the premises, except in the case of a bona fide emergency.",
                    "explanation": "Ensures privacy and aligns with tenant rights guidelines."
                },
                {
                    "triggerText": "this Lease shall automatically renew for another 12-month term at a rent rate increase of 15%, unless the Tenant provides written notice of non-renewal at least ninety (90) days prior",
                    "proposedWording": "Upon expiration, the Lease shall continue on a month-to-month basis at the same rate, subject to rent increases permitted by local rent control boards, with 30 days' non-renewal notice.",
                    "explanation": "Replaces automatic annual lock-in with a standard month-to-month transition."
                },
                {
                    "triggerText": "The Tenant shall be solely responsible for all maintenance and repair costs, including repairs to plumbing, heating, air conditioning, and electrical systems, regardless of whether the damage was caused by the Tenant or normal wear and tear.",
                    "proposedWording": "The Tenant shall maintain the property in clean condition. The Landlord shall be responsible for all structural repairs and major appliance/utility maintenance, including heating, cooling, plumbing, and electrical utilities.",
                    "explanation": "Places repair burdens for standard wear-and-tear back on the landlord."
                }
            ],
            "missingClauses": [
                {
                    "clauseName": "Security Deposit Return Timeline",
                    "explanation": "The lease lacks a deadline for the landlord to return the security deposit, which could delay refund recovery.",
                    "sampleTemplate": "The Landlord shall return the Tenant's security deposit within twenty-one (21) days of lease termination, along with an itemized receipt for any deductions."
                },
                {
                    "clauseName": "Quiet Enjoyment",
                    "explanation": "A clause guaranteeing the tenant's right to peaceful and quiet possession of the home without landlord harassment.",
                    "sampleTemplate": "The Tenant shall have quiet enjoyment and peaceful possession of the premises without hindrance by the Landlord."
                }
            ]
        }
        
        # Sterling Properties (Landlord)
        p2 = {
            "partyName": "Sterling Properties",
            "partyRole": "Landlord",
            "fairnessScore": 95,
            "riskScore": 12,
            "summary": [
                "This contract offers **maximum leverage** for Sterling Properties.",
                "Enforces aggressive, profitable late penalties.",
                "Allows instant, hassle-free property entry for inspections.",
                "Completely shifts utility maintenance and repair costs to the tenant."
            ],
            "riskRadar": [
                {
                    "category": "Late Fee Penalty Enforceability",
                    "riskLevel": "Medium",
                    "riskReason": "Late fees that exceed statutory maximums (often 5% of monthly rent) are regularly struck down by housing tribunals as unenforceable penalty clauses.",
                    "triggerText": "a late fee of $250 shall be applied immediately. For every day thereafter... an additional fee of $50 per day"
                },
                {
                    "category": "Trespass Risk",
                    "riskLevel": "Medium",
                    "riskReason": "Unannounced entry in non-emergency situations can expose the landlord to lawsuits for breach of covenant of quiet enjoyment and illegal trespass.",
                    "triggerText": "enter the leased premises at any time, without prior notice"
                }
            ],
            "negotiations": [
                {
                    "triggerText": "a late fee of $250 shall be applied immediately. For every day thereafter... an additional fee of $50 per day",
                    "proposedWording": "a late fee of $50 if unpaid by the 5th",
                    "explanation": "Prevents court challenges by capping late fees within normal statutory limits."
                }
            ],
            "missingClauses": [
                {
                    "clauseName": "Lead-Based Paint Disclosure",
                    "explanation": "Lacks the federally required disclosure form for older properties.",
                    "sampleTemplate": "Landlord shall provide Lead-Based Paint disclosure form if building was constructed before 1978."
                }
            ]
        }
        parties = [p1, p2]
        
    else:
        # Default / Software Engineer Agreement (Alex Mercer / Nexus Tech Solutions)
        # Alex Mercer (Employee)
        p1 = {
            "partyName": "Alex Mercer",
            "partyRole": "Employee",
            "fairnessScore": 35,
            "riskScore": 82,
            "summary": [
                "This contract is **highly unfavorable** to you (the Employee) and contains several one-sided terms.",
                "You are subject to **immediate 'at-will' termination** by the employer, but you must give 60 days' notice.",
                "There is a **5-year non-compete clause** which is excessively restrictive and likely legally unenforceable.",
                "An **unlimited intellectual property clause** claims ownership over everything you create, even on your own time at home.",
                "You are asked to **indemnify the company for software bugs**, exposing you to extreme financial liability."
            ],
            "riskRadar": [
                {
                    "category": "Termination Notice",
                    "riskLevel": "High",
                    "riskReason": "You are required to give 60 days' notice to quit, while the company can fire you instantly without cause or notice.",
                    "triggerText": "The Company may terminate this agreement at any time without notice or cause, for any reason whatsoever. The Employee may terminate this agreement by providing sixty (60) days' prior written notice"
                },
                {
                    "category": "Overtime Compensation",
                    "riskLevel": "Medium",
                    "riskReason": "Requires you to work unpaid overtime as projects demand, which violates basic fair labor expectations.",
                    "triggerText": "Employee is expected to work overtime as required by projects, and no additional overtime compensation shall be paid."
                },
                {
                    "category": "Intellectual Property",
                    "riskLevel": "High",
                    "riskReason": "The company claims ownership of code and designs you write at home, in your own free time, using your own computer.",
                    "triggerText": "whether developed during working hours, using Company equipment, or on the Employee's own time at home."
                },
                {
                    "category": "Non-Compete",
                    "riskLevel": "High",
                    "riskReason": "A 5-year non-compete is extremely long. Courts rarely enforce non-competes longer than 1 year for standard developers.",
                    "triggerText": "for a period of five (5) years following the termination of employment for any reason, the Employee shall not engage in, perform services for, or establish any competitive business"
                },
                {
                    "category": "Indemnification & Liability",
                    "riskLevel": "High",
                    "riskReason": "You could be held personally liable for company financial losses caused by standard coding bugs or server crashes.",
                    "triggerText": "The Employee agrees to indemnify and hold harmless the Company from any and all damages, claims, or liabilities arising out of the Employee's work, including any software bugs, systems downtime, or coding errors"
                }
            ],
            "negotiations": [
                {
                    "triggerText": "The Company may terminate this agreement at any time without notice or cause, for any reason whatsoever. The Employee may terminate this agreement by providing sixty (60) days' prior written notice",
                    "proposedWording": "Either party may terminate this Agreement at any time, with or without cause, by providing thirty (30) days' prior written notice to the other party.",
                    "explanation": "Makes the termination notice period mutual and balanced, giving you time to find a new job."
                },
                {
                    "triggerText": "Employee is expected to work overtime as required by projects, and no additional overtime compensation shall be paid.",
                    "proposedWording": "Employee shall receive standard overtime compensation in accordance with local labor laws for hours worked beyond 40 hours per week, subject to prior manager approval.",
                    "explanation": "Guarantees fair compensation for extra hours worked."
                },
                {
                    "triggerText": "whether developed during working hours, using Company equipment, or on the Employee's own time at home.",
                    "proposedWording": "excluding any software, code, or ideas developed by the Employee entirely on their own time, without using Company equipment, trade secrets, or proprietary information.",
                    "explanation": "Protects your hobby projects, open-source contributions, and independent side-hustles."
                },
                {
                    "triggerText": "for a period of five (5) years following the termination of employment for any reason, the Employee shall not engage in, perform services for, or establish any competitive business within a 100-mile radius",
                    "proposedWording": "for a period of twelve (12) months following the termination of employment, the Employee shall not solicit Company clients or join direct competitors within a 15-mile radius.",
                    "explanation": "Reduces the duration and scope to standard, legally enforceable, and reasonable limits."
                },
                {
                    "triggerText": "The Employee agrees to indemnify and hold harmless the Company from any and all damages, claims, or liabilities arising out of the Employee's work, including any software bugs, systems downtime, or coding errors",
                    "proposedWording": "The Employee shall not be personally liable for normal errors, omissions, bugs, or system downtime occurring in the good-faith performance of their employment duties.",
                    "explanation": "Removes professional liability. Standard coding mistakes should never be penalized with personal lawsuits."
                }
            ],
            "missingClauses": [
                {
                    "clauseName": "Paid Time Off (PTO) Policy",
                    "explanation": "The contract contains zero references to vacation days, sick leave, or national holidays, leaving you at the mercy of oral agreements.",
                    "sampleTemplate": "The Employee shall be entitled to fifteen (15) days of paid annual leave, in addition to standard public holidays, accrued monthly."
                },
                {
                    "clauseName": "Severance Pay",
                    "explanation": "Given that the contract is at-will, there is no safety net if you are terminated without cause.",
                    "sampleTemplate": "In the event of termination by the Company without Cause, the Employee shall receive severance pay equivalent to two (2) months of base salary."
                }
            ]
        }
        
        # Nexus Tech Solutions (Employer)
        p2 = {
            "partyName": "Nexus Tech Solutions LLC",
            "partyRole": "Employer",
            "fairnessScore": 85,
            "riskScore": 20,
            "summary": [
                "This contract offers **maximum legal protection** for the Company.",
                "Allows rapid termination of underperforming staff without notice liability.",
                "Guarantees a 60-day replacement transition window since the employee must give notice.",
                "Ensures total ownership of all intellectual property, including side projects that might use company ideas.",
                "Places all system failure risks on the employee via the bugs indemnity clause."
            ],
            "riskRadar": [
                {
                    "category": "Non-Compete Enforceability",
                    "riskLevel": "Medium",
                    "riskReason": "While a 5-year non-compete protects the company, it is highly likely to be struck down in court as too restrictive, leaving you with zero protection.",
                    "triggerText": "for a period of five (5) years following the termination of employment for any reason"
                },
                {
                    "category": "Employee Indemnity Validity",
                    "riskLevel": "High",
                    "riskReason": "Courts generally throw out clauses making standard employees personally liable for operational errors. This could lead to regulatory audits.",
                    "triggerText": "The Employee agrees to indemnify and hold harmless the Company from any and all damages, claims, or liabilities arising out of the Employee's work"
                }
            ],
            "negotiations": [
                {
                    "triggerText": "for a period of five (5) years following the termination of employment for any reason",
                    "proposedWording": "for a period of twelve (12) months following the termination of employment for any reason",
                    "explanation": "A 1-year non-compete is much more likely to stand up in court, guaranteeing you real, enforceable protection."
                },
                {
                    "triggerText": "The Employee agrees to indemnify and hold harmless the Company",
                    "proposedWording": "The Company will maintain general liability and errors/omissions insurance covering standard developer actions in the course of employment.",
                    "explanation": "Protects the company through insurance rather than unenforceable employee lawsuits."
                }
            ],
            "missingClauses": [
                {
                    "clauseName": "Company Property Return",
                    "explanation": "Lacks a specific clause obligating the employee to return company laptops, cards, and keys upon termination.",
                    "sampleTemplate": "Upon termination of employment, the Employee shall immediately return all Company-owned property, including hardware, credentials, and documentation."
                }
            ]
        }
        parties = [p1, p2]
        
    return {
        "parties": parties
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
