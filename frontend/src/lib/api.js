// API Client for Contract Guardian AI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Helper to handle fetch responses and error propagation
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP error! Status: ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errorMsg;
    } catch (e) {
      // Ignored
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  /**
   * Upload a contract file (PDF or TXT)
   */
  async uploadContract(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/contracts/upload`, {
      method: "POST",
      body: formData,
    });
    return handleResponse(response);
  },

  /**
   * Get current daily Gemini token quota status
   */
  async getQuotaStatus() {
    const response = await fetch(`${API_BASE_URL}/api/contracts/quota-status`);
    return handleResponse(response);
  },

  /**
   * Get contract metadata
   */
  async getContract(contractId) {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}`);
    return handleResponse(response);
  },

  /**
   * Get contract raw text
   */
  async getContractText(contractId) {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}/text`);
    return handleResponse(response);
  },

  /**
   * Save edited contract text (Drafting workspace)
   */
  async editContractText(contractId, rawText) {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw_text: rawText }),
    });
    return handleResponse(response);
  },

  /**
   * Trigger or retrieve cached multi-party contract analysis
   */
  async analyzeContract(contractId) {
    const response = await fetch(
      `${API_BASE_URL}/api/contracts/${contractId}/analyze`
    );
    return handleResponse(response);
  },

  /**
   * Run a compliance audit for a specific region
   */
  async getComplianceReport(contractId, region) {
    const response = await fetch(
      `${API_BASE_URL}/api/contracts/${contractId}/compliance?region=${encodeURIComponent(region)}`
    );
    return handleResponse(response);
  },

  /**
   * Send a query to the contract chat assistant
   */
  async chatWithAssistant(contractId, question, persona, history = []) {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        persona,
        history,
      }),
    });
    return handleResponse(response);
  },

  /**
   * Compare two contracts side-by-side
   */
  async compareContracts(contractIdA, contractIdB) {
    const response = await fetch(`${API_BASE_URL}/api/contracts/compare`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contract_id_a: contractIdA,
        contract_id_b: contractIdB,
      }),
    });
    return handleResponse(response);
  },

  /**
   * Fetch chat history for a contract
   */
  async getChatHistory(contractId) {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}/chat/history`);
    return handleResponse(response);
  }
};
