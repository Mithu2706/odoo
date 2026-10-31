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

  // Products
  createProduct: async (data) => {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  createPlan: async (data) => {
    const res = await fetch(`${API_BASE}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Customers & Staff
  createCustomer: async (data) => {
    const res = await fetch(`${API_BASE}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  createStaff: async (data) => {
    const res = await fetch(`${API_BASE}/api/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Subscriptions & Invoicing
  createSubscription: async (data) => {
    const res = await fetch(`${API_BASE}/api/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  transitionSubscription: async (id, status) => {
    const res = await fetch(`${API_BASE}/api/subscriptions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  customerSubscribe: async (data) => {
    const res = await fetch(`${API_BASE}/api/subscriptions/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  generateInvoice: async (subscriptionId, cycleDate) => {
    const res = await fetch(`${API_BASE}/api/subscriptions/${subscriptionId}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycle_date: cycleDate }),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  confirmInvoice: async (id) => {
    const res = await fetch(`${API_BASE}/api/invoices/${id}/confirm`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(res);
  },
  recordPayment: async (invoiceId, paymentData) => {
    const res = await fetch(`${API_BASE}/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  getInvoiceReceipt: async (id) => {
    const res = await fetch(`${API_BASE}/api/invoices/${id}/receipt`, {
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

  // Billing Assurance Center
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
  runReliabilityScenario: async (scenario) => {
    const res = await fetch(`${API_BASE}/api/assurance/test-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
      credentials: 'include',
    });
    return handleResponse(res);
  },
};
