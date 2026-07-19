// High-fidelity Mock Contracts and Persona-based analyses for Contract Guardian AI Workspace

export const MOCK_CONTRACTS = {
  employment: {
    id: "employment",
    title: "Software_Engineer_Employment_Agreement.pdf",
    raw_text: `EMPLOYMENT AGREEMENT

This Employment Agreement (the "Agreement") is entered into this 15th day of June, 2026, by and between Nexus Tech Solutions LLC (the "Company") and Alex Mercer (the "Employee").

1. POSITION AND DUTIES
The Employee shall serve in the position of Senior Software Engineer. The Employee agrees to perform all duties assigned by the Company. The Employee shall devote their full business time and attention to the business of the Company.

2. COMPENSATION AND BENEFITS
The Company shall pay the Employee a base salary of $4,500 per month, payable in accordance with the Company's standard payroll practices. Employee is expected to work overtime as required by projects, and no additional overtime compensation shall be paid.

3. TERM AND TERMINATION
The Employee's employment with the Company is "at-will." The Company may terminate this agreement at any time without notice or cause, for any reason whatsoever. The Employee may terminate this agreement by providing sixty (60) days' prior written notice to the Company.

4. INTELLECTUAL PROPERTY
All intellectual property created during the term of employment shall belong solely to the Company. This includes any software, code, designs, algorithms, patents, or trade secrets developed by the Employee, whether developed during working hours, using Company equipment, or on the Employee's own time at home. The Employee hereby assigns all rights, title, and interest in such IP to the Company.

5. COVENANT NOT TO COMPETE
During the term of employment and for a period of five (5) years following the termination of employment for any reason, the Employee shall not engage in, perform services for, or establish any competitive business within a 100-mile radius of the Company's offices.

6. INDEMNIFICATION
The Employee agrees to indemnify and hold harmless the Company from any and all damages, claims, or liabilities arising out of the Employee's work, including any software bugs, systems downtime, or coding errors that result in financial loss to the Company.

7. DISPUTE RESOLUTION
This agreement is governed by the laws of the State of Delaware. Any disputes arising out of this Agreement shall be settled exclusively in the courts of Delaware, and the Employee waives any right to jury trial or class action participation.`
  },
  
  nda: {
    id: "nda",
    title: "Mutual_Non_Disclosure_Agreement.pdf",
    raw_text: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into on July 10, 2026, by and between Alpha Startups Inc. ("Alpha") and Venture Capital Partners Ltd ("VCP").

1. PURPOSE
The parties wish to explore a potential business relationship (the "Purpose"). In connection with this Purpose, each party may disclose proprietary and confidential information.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by one party to the other that is marked as confidential. However, VCP reserves the right to disclose any information received to its affiliates, partners, and advisors without notice or restriction, and such disclosure shall not be deemed a breach of this Agreement.

3. TERM AND SURVIVAL
This Agreement shall expire one (1) year from the date hereof. Upon expiration, all obligations of confidentiality under this Agreement shall cease immediately, and the receiving party shall have no further obligation to keep the disclosing party's information secret.

4. REMEDIES AND LIABILITIES
Alpha acknowledges that any breach of this Agreement may cause irreparable harm. VCP's maximum aggregate liability for any breaches of this Agreement shall be limited to $500, regardless of the actual damages suffered by Alpha.

5. IP RIGHTS
Nothing in this Agreement shall be construed as granting any license or rights in the intellectual property of the disclosing party. However, VCP shall have a royalty-free license to use any feedback or product ideas shared by Alpha during discussions.`
  },

  lease: {
    id: "lease",
    title: "Residential_Lease_Agreement.pdf",
    raw_text: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement (the "Lease") is made on August 1, 2026, by and between Sterling Properties (the "Landlord") and Jordan Smith (the "Tenant").

1. PROPERTY AND RENT
The Landlord leases to the Tenant the property located at 404 Beacon Street, Apt 3B. The monthly rent is $1,800, payable on the 1st of each month.

2. LATE FEES AND PENALTIES
If rent is not received by the 2nd day of the month, a late fee of $250 shall be applied immediately. For every day thereafter that rent remains unpaid, an additional fee of $50 per day shall accumulate.

3. ENTRY BY LANDLORD
The Landlord reserves the right to enter the leased premises at any time, without prior notice to the Tenant, for the purposes of inspection, repairs, maintenance, showing the property, or any other reasonable purpose.

4. AUTOMATIC RENEWAL
At the end of the 12-month term, this Lease shall automatically renew for another 12-month term at a rent rate increase of 15%, unless the Tenant provides written notice of non-renewal at least ninety (90) days prior to the expiration of the lease.

5. MAINTENANCE AND REPAIRS
The Tenant shall be solely responsible for all maintenance and repair costs, including repairs to plumbing, heating, air conditioning, and electrical systems, regardless of whether the damage was caused by the Tenant or normal wear and tear.`
  }
};

export const MOCK_ANALYSES = {
  employment: {
    parties: [
      {
        partyName: "Alex Mercer",
        partyRole: "Employee",
        fairnessScore: 35,
        riskScore: 82,
        summary: [
          "This contract is **highly unfavorable** to you (the Employee) and contains several one-sided terms.",
          "You are subject to **immediate 'at-will' termination** by the employer, but you must give 60 days' notice.",
          "There is a **5-year non-compete clause** which is excessively restrictive and likely legally unenforceable.",
          "An **unlimited intellectual property clause** claims ownership over everything you create, even on your own time at home.",
          "You are asked to **indemnify the company for software bugs**, exposing you to extreme financial liability."
        ],
        riskRadar: [
          {
            category: "Termination Notice",
            riskLevel: "High",
            riskReason: "You are required to give 60 days' notice to quit, while the company can fire you instantly without cause or notice.",
            triggerText: "The Company may terminate this agreement at any time without notice or cause, for any reason whatsoever. The Employee may terminate this agreement by providing sixty (60) days' prior written notice"
          },
          {
            category: "Overtime Compensation",
            riskLevel: "Medium",
            riskReason: "Requires you to work unpaid overtime as projects demand, which violates basic fair labor expectations.",
            triggerText: "Employee is expected to work overtime as required by projects, and no additional overtime compensation shall be paid."
          },
          {
            category: "Intellectual Property",
            riskLevel: "High",
            riskReason: "The company claims ownership of code and designs you write at home, in your own free time, using your own computer.",
            triggerText: "whether developed during working hours, using Company equipment, or on the Employee's own time at home."
          },
          {
            category: "Non-Compete",
            riskLevel: "High",
            riskReason: "A 5-year non-compete is extremely long. Courts rarely enforce non-competes longer than 1 year for standard developers.",
            triggerText: "for a period of five (5) years following the termination of employment for any reason, the Employee shall not engage in, perform services for, or establish any competitive business"
          },
          {
            category: "Indemnification & Liability",
            riskLevel: "High",
            riskReason: "You could be held personally liable for company financial losses caused by standard coding bugs or server crashes.",
            triggerText: "The Employee agrees to indemnify and hold harmless the Company from any and all damages, claims, or liabilities arising out of the Employee's work, including any software bugs, systems downtime, or coding errors"
          }
        ],
        negotiations: [
          {
            triggerText: "The Company may terminate this agreement at any time without notice or cause, for any reason whatsoever. The Employee may terminate this agreement by providing sixty (60) days' prior written notice",
            proposedWording: "Either party may terminate this Agreement at any time, with or without cause, by providing thirty (30) days' prior written notice to the other party.",
            explanation: "Makes the termination notice period mutual and balanced, giving you time to find a new job."
          },
          {
            triggerText: "Employee is expected to work overtime as required by projects, and no additional overtime compensation shall be paid.",
            proposedWording: "Employee shall receive standard overtime compensation in accordance with local labor laws for hours worked beyond 40 hours per week, subject to prior manager approval.",
            explanation: "Guarantees fair compensation for extra hours worked."
          },
          {
            triggerText: "whether developed during working hours, using Company equipment, or on the Employee's own time at home.",
            proposedWording: "excluding any software, code, or ideas developed by the Employee entirely on their own time, without using Company equipment, trade secrets, or proprietary information.",
            explanation: "Protects your hobby projects, open-source contributions, and independent side-hustles."
          },
          {
            triggerText: "for a period of five (5) years following the termination of employment for any reason, the Employee shall not engage in, perform services for, or establish any competitive business within a 100-mile radius",
            proposedWording: "for a period of twelve (12) months following the termination of employment, the Employee shall not solicit Company clients or join direct competitors within a 15-mile radius.",
            explanation: "Reduces the duration and scope to standard, legally enforceable, and reasonable limits."
          },
          {
            triggerText: "The Employee agrees to indemnify and hold harmless the Company from any and all damages, claims, or liabilities arising out of the Employee's work, including any software bugs, systems downtime, or coding errors",
            proposedWording: "The Employee shall not be personally liable for normal errors, omissions, bugs, or system downtime occurring in the good-faith performance of their employment duties.",
            explanation: "Removes professional liability. Standard coding mistakes should never be penalized with personal lawsuits."
          }
        ],
        missingClauses: [
          {
            clauseName: "Paid Time Off (PTO) Policy",
            explanation: "The contract contains zero references to vacation days, sick leave, or national holidays, leaving you at the mercy of oral agreements.",
            sampleTemplate: "The Employee shall be entitled to fifteen (15) days of paid annual leave, in addition to standard public holidays, accrued monthly."
          },
          {
            clauseName: "Severance Pay",
            explanation: "Given that the contract is at-will, there is no safety net if you are terminated without cause.",
            sampleTemplate: "In the event of termination by the Company without Cause, the Employee shall receive severance pay equivalent to two (2) months of base salary."
          }
        ]
      },
      {
        partyName: "Nexus Tech Solutions LLC",
        partyRole: "Employer",
        fairnessScore: 85,
        riskScore: 20,
        summary: [
          "This contract offers **maximum legal protection** for the Company.",
          "Allows rapid termination of underperforming staff without notice liability.",
          "Guarantees a 60-day replacement transition window since the employee must give notice.",
          "Ensures total ownership of all intellectual property, including side projects that might use company ideas.",
          "Places all system failure risks on the employee via the bugs indemnity clause."
        ],
        riskRadar: [
          {
            category: "Non-Compete Enforceability",
            riskLevel: "Medium",
            riskReason: "While a 5-year non-compete protects the company, it is highly likely to be struck down in court as too restrictive, leaving you with zero protection.",
            triggerText: "for a period of five (5) years following the termination of employment for any reason"
          },
          {
            category: "Employee Indemnity Validity",
            riskLevel: "High",
            riskReason: "Courts generally throw out clauses making standard employees personally liable for operational errors. This could lead to regulatory audits.",
            triggerText: "The Employee agrees to indemnify and hold harmless the Company from any and all damages, claims, or liabilities arising out of the Employee's work"
          }
        ],
        negotiations: [
          {
            triggerText: "for a period of five (5) years following the termination of employment for any reason",
            proposedWording: "for a period of twelve (12) months following the termination of employment for any reason",
            explanation: "A 1-year non-compete is much more likely to stand up in court, guaranteeing you real, enforceable protection."
          },
          {
            triggerText: "The Employee agrees to indemnify and hold harmless the Company",
            proposedWording: "The Company will maintain general liability and errors/omissions insurance covering standard developer actions in the course of employment.",
            explanation: "Protects the company through insurance rather than unenforceable employee lawsuits."
          }
        ],
        missingClauses: [
          {
            clauseName: "Company Property Return",
            explanation: "Lacks a specific clause obligating the employee to return company laptops, cards, and keys upon termination.",
            sampleTemplate: "Upon termination of employment, the Employee shall immediately return all Company-owned property, including hardware, credentials, and documentation."
          }
        ]
      }
    ]
  },
  
  nda: {
    parties: [
      {
        partyName: "Alpha Startups Inc.",
        partyRole: "Discloser/Founder",
        fairnessScore: 50,
        riskScore: 70,
        summary: [
          "This mutual NDA contains **significant loopholes** that heavily disadvantage you as a Startup Founder.",
          "The Venture Capital firm has carved out the right to **disclose your information to partners without breach**.",
          "The **confidentiality term is only 1 year**, meaning they can freely share or copy your startup code after 12 months.",
          "Liability for the VC firm is **capped at $500**, making it impossible to seek meaningful damages if they leak your secret ideas.",
          "Gives the VC firm a **free license to use any feedback** or product ideas you discuss."
        ],
        riskRadar: [
          {
            category: "Information Sharing Loophole",
            riskLevel: "High",
            riskReason: "The VC company can share your proprietary documents with their partners, affiliates, and advisors under the guise of this clause, bypassing secrecy.",
            triggerText: "VCP reserves the right to disclose any information received to its affiliates, partners, and advisors without notice or restriction, and such disclosure shall not be deemed a breach"
          },
          {
            category: "Obligation Duration",
            riskLevel: "High",
            riskReason: "A 1-year confidentiality term is far too short. If fundraising takes 6 months, your secrets are only protected for 6 additional months.",
            triggerText: "This Agreement shall expire one (1) year from the date hereof. Upon expiration, all obligations of confidentiality under this Agreement shall cease immediately"
          },
          {
            category: "Liability Limit",
            riskLevel: "High",
            riskReason: "If they leak your core patent-pending algorithm causing $1M in damage, you can only collect $500.",
            triggerText: "maximum aggregate liability for any breaches of this Agreement shall be limited to $500"
          },
          {
            category: "Intellectual Property License",
            riskLevel: "Medium",
            riskReason: "Allows them to use your design ideas or feature suggestions royalty-free, which they could pass to competitor portfolio companies.",
            triggerText: "VCP shall have a royalty-free license to use any feedback or product ideas shared by Alpha during discussions."
          }
        ],
        negotiations: [
          {
            triggerText: "VCP reserves the right to disclose any information received to its affiliates, partners, and advisors without notice or restriction, and such disclosure shall not be deemed a breach",
            proposedWording: "Receiving Party may disclose Confidential Information only to its employees and advisors who have a strict 'need to know' and who are bound by confidentiality agreements at least as restrictive as this Agreement.",
            explanation: "Closes the affiliate leak loophole and holds them accountable for third-party leaks."
          },
          {
            triggerText: "This Agreement shall expire one (1) year from the date hereof. Upon expiration, all obligations of confidentiality under this Agreement shall cease immediately",
            proposedWording: "This Agreement shall govern discussions for a period of two (2) years. The obligations of confidentiality hereunder shall survive for a period of five (5) years from the date of disclosure.",
            explanation: "Provides standard protection duration, giving you time to build and launch your product safely."
          },
          {
            triggerText: "maximum aggregate liability for any breaches of this Agreement shall be limited to $500",
            proposedWording: "The liability cap shall not apply to breaches of confidentiality involving gross negligence, willful misconduct, or unauthorized intellectual property use.",
            explanation: "Ensures real financial consequences if your secrets are leaked or stolen."
          },
          {
            triggerText: "VCP shall have a royalty-free license to use any feedback or product ideas shared by Alpha during discussions.",
            proposedWording: "No licenses or rights under any patents, trademarks, or copyrights are granted or implied by this Agreement, and all feedback remains the sole property of Alpha.",
            explanation: "Protects your intellectual assets and prevents them from building your ideas with other teams."
          }
        ],
        missingClauses: [
          {
            clauseName: "Non-Solicitation of Employees",
            explanation: "They could meet your lead engineers during pitches and hire them directly. A non-solicitation clause prevents this.",
            sampleTemplate: "During the term of this Agreement and for twelve (12) months thereafter, VCP shall not directly solicit or hire any employees of Alpha."
          }
        ]
      },
      {
        partyName: "Venture Capital Partners Ltd",
        partyRole: "Recipient/Investor",
        fairnessScore: 80,
        riskScore: 15,
        summary: [
          "This agreement is **highly favorable to the Investor**.",
          "Allows you to share pitch materials with investment partners without legal liability.",
          "Terminates all confidentiality duties after 12 months, avoiding long-term monitoring.",
          "Protects your firm with an extremely low $500 liability cap in case of accidental leaks."
        ],
        riskRadar: [
          {
            category: "Low Liability Safety",
            riskLevel: "Low",
            riskReason: "The $500 cap protects the investment fund from massive lawsuits, which is highly advantageous.",
            triggerText: "maximum aggregate liability for any breaches of this Agreement shall be limited to $500"
          }
        ],
        negotiations: [],
        missingClauses: []
      }
    ]
  },

  lease: {
    parties: [
      {
        partyName: "Jordan Smith",
        partyRole: "Tenant",
        fairnessScore: 25,
        riskScore: 88,
        summary: [
          "This residential lease is **predatory** and contains illegal or unfair clauses.",
          "The **late fee is massive ($250)** and accumulates at a rate of $50/day starting immediately on Day 2.",
          "The Landlord can **enter your home at any time without notice**, violating your basic right to privacy.",
          "The contract **automatically renews for another year with a 15% rent increase** unless you notify them 90 days early.",
          "You are made **personally responsible for fixing structural plumbing and heating systems**, which is the landlord's duty by law."
        ],
        riskRadar: [
          {
            category: "Late Fees",
            riskLevel: "High",
            riskReason: "An immediate $250 fee on the 2nd day, plus $50 daily accrual, is excessive and illegal in many jurisdictions.",
            triggerText: "If rent is not received by the 2nd day of the month, a late fee of $250 shall be applied immediately. For every day thereafter that rent remains unpaid, an additional fee of $50 per day shall accumulate."
          },
          {
            category: "Privacy / Landlord Entry",
            riskLevel: "High",
            riskReason: "Landlords must provide 24-hour notice before entering except in emergencies. Unannounced entry is illegal.",
            triggerText: "The Landlord reserves the right to enter the leased premises at any time, without prior notice to the Tenant"
          },
          {
            category: "Auto-Renewal & Rent Hike",
            riskLevel: "Medium",
            riskReason: "Locks you into another full year with a massive 15% price hike, requiring a very early 90-day non-renewal warning.",
            triggerText: "automatically renew for another 12-month term at a rent rate increase of 15%, unless the Tenant provides written notice of non-renewal at least ninety (90) days prior"
          },
          {
            category: "Maintenance Burden",
            riskLevel: "High",
            riskReason: "Requires you to pay for repairs to major systems (electrical, heating, plumbing) which the landlord is legally obligated to maintain in habitable condition.",
            triggerText: "The Tenant shall be solely responsible for all maintenance and repair costs, including repairs to plumbing, heating, air conditioning, and electrical systems, regardless of whether the damage was caused by the Tenant or normal wear and tear."
          }
        ],
        negotiations: [
          {
            triggerText: "If rent is not received by the 2nd day of the month, a late fee of $250 shall be applied immediately. For every day thereafter that rent remains unpaid, an additional fee of $50 per day shall accumulate.",
            proposedWording: "Rent is due on the 1st of the month. If rent is not received by the 5th day, a late fee of $50 may be charged. No daily cumulative fees shall apply.",
            explanation: "Provides a standard 5-day grace period and a reasonable, standard late fee cap."
          },
          {
            triggerText: "The Landlord reserves the right to enter the leased premises at any time, without prior notice to the Tenant",
            proposedWording: "The Landlord may enter the premises only upon providing at least twenty-four (24) hours' prior written notice, during reasonable business hours, except in cases of emergency.",
            explanation: "Protects your privacy and aligns with standard residential tenancy laws."
          },
          {
            triggerText: "automatically renew for another 12-month term at a rent rate increase of 15%, unless the Tenant provides written notice of non-renewal at least ninety (90) days prior",
            proposedWording: "At the end of the initial lease term, the tenancy shall convert to a month-to-month agreement. Any rent increases must comply with local rent control guidelines and require 60 days' written notice.",
            explanation: "Avoids long-term automatic lock-ins and excessive price increases."
          },
          {
            triggerText: "The Tenant shall be solely responsible for all maintenance and repair costs, including repairs to plumbing, heating, air conditioning, and electrical systems, regardless of whether the damage was caused by the Tenant or normal wear and tear.",
            proposedWording: "The Landlord shall maintain all structural components, plumbing, heating, ventilation, and electrical systems in good working order. The Tenant is responsible only for damages caused by their negligence or abuse.",
            explanation: "Puts the maintenance cost burden back on the property owner, where it belongs under housing codes."
          }
        ],
        missingClauses: [
          {
            clauseName: "Security Deposit Details",
            explanation: "The contract fails to mention where your security deposit is held, when it must be returned, and under what conditions deductions can be made.",
            sampleTemplate: "The Security Deposit shall be returned to the Tenant within twenty-one (21) days of lease termination, along with an itemized receipt for any deductions."
          }
        ]
      },
      {
        partyName: "Sterling Properties",
        partyRole: "Landlord",
        fairnessScore: 90,
        riskScore: 10,
        summary: [
          "This contract offers **maximum leverage** over the tenant.",
          "Guarantees aggressive penalties for late payments.",
          "Maintains full, unrestricted access to the property at any time.",
          "Automatically extends tenant revenue for another 12 months at +15% pricing.",
          "Saves maintenance overhead by shifting plumbing and HVAC repair costs to the tenant."
        ],
        riskRadar: [
          {
            category: "Unenforceable Repair Shift",
            riskLevel: "High",
            riskReason: "In almost all states/countries, shifting HVAC and plumbing maintenance to residential tenants is void and illegal. If sued, this entire section will be struck down.",
            triggerText: "The Tenant shall be solely responsible for all maintenance and repair costs, including repairs to plumbing, heating"
          }
        ],
        negotiations: [],
        missingClauses: []
      }
    ]
  }
};
