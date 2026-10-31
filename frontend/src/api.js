const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map(d => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join(', ');
        } else {
          errorMsg = errorData.detail;
        }
      }
    } catch {
      // fallback to generic status message
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Authentication & Demo
  demo: async (role = 'admin') => {
    const res = await fetch(`${API_BASE}/api/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },
  logout: async () => {
    const res = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Records
  getRecords: async (kind) => {
    const res = await fetch(`${API_BASE}/api/records/${kind}`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Dashboard Overview
  getDashboard: async () => {
    const res = await fetch(`${API_BASE}/api/dashboard`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Billing Assurance (Phase 2)
  getAssuranceSummary: async () => {
    const res = await fetch(`${API_BASE}/api/assurance/summary`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },
  runBillingScheduler: async () => {
    const res = await fetch(`${API_BASE}/api/assurance/scheduler/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(res);
  },
  retryObligation: async (id) => {
    const res = await fetch(`${API_BASE}/api/assurance/obligations/${id}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Subscriptions & Invoicing
  generateInvoice: async (subscriptionId, cycleDate) => {
    const res = await fetch(`${API_BASE}/api/subscriptions/${subscriptionId}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycle_date: cycleDate }),
      credentials: 'include',
    });
    return handleResponse(res);
  },
};
