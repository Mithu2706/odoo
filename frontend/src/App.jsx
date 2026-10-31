import React, { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';
import { 
  Users, 
  Package, 
  CreditCard, 
  CheckCircle2, 
  LayoutDashboard, 
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Play,
  RotateCw,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Activity,
  PlusCircle,
  Pause,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); 
  // 'overview' | 'assurance' | 'subscriptions' | 'invoices' | 'products' | 'customers' | 'team' | 'audit' | 'portal_subscribe'

  // Assurance subtab
  const [assuranceSubtab, setAssuranceSubtab] = useState('monitor'); // 'monitor' | 'recovery' | 'testing'

  // Data state
  const [dashboard, setDashboard] = useState(null);
  const [assuranceSummary, setAssuranceSummary] = useState(null);
  const [obligations, setObligations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [team, setTeam] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modals & Action States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Calculation Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Forms
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'bank_transfer', date: new Date().toISOString().slice(0, 10), notes: '' });

  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '' });
  const [productForm, setProductForm] = useState({ name: '', sales_price: '', cost_price: '0.00' });
  const [planForm, setPlanForm] = useState({ name: '', interval: 'monthly', price: '', minimum_quantity: 1 });

  // Filters for Billing Assurance
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Reliability testing feedback
  const [scenarioReport, setScenarioReport] = useState(null);

  const initSession = async () => {
    try {
      setLoading(true);
      setError(null);
      let me;
      try {
        me = await api.getMe();
      } catch {
        me = await api.demo('admin');
      }
      setCurrentUser(me);
      await loadAllData(me);
    } catch (err) {
      setError(err.message || 'Initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async (user) => {
    try {
      setError(null);
      const isStaffOrAdmin = user && (user.role === 'admin' || user.role === 'staff');
      const isAdmin = user && user.role === 'admin';

      const fetches = [
        api.getDashboard(),
        api.getRecords('subscriptions'),
        api.getRecords('invoices'),
        api.getRecords('products'),
        api.getRecords('plans'),
      ];

      if (isStaffOrAdmin) {
        fetches.push(api.getRecords('customers'));
        fetches.push(api.getAssuranceSummary());
        fetches.push(api.getRecords('billing_obligations'));
      }
      if (isAdmin) {
        fetches.push(api.getRecords('users'));
        fetches.push(api.getRecords('audit_logs'));
      }

      const results = await Promise.all(fetches);
      setDashboard(results[0]);
      setSubscriptions(results[1] || []);
      setInvoices(results[2] || []);
      setProducts(results[3] || []);
      setPlans(results[4] || []);

      if (isStaffOrAdmin) {
        setCustomers(results[5] || []);
        setAssuranceSummary(results[6]);
        setObligations(results[7] || []);
      }
      if (isAdmin) {
        setTeam(results[8] || []);
        setAuditLogs(results[9] || []);
      }
    } catch (err) {
      setError(err.message || 'Error loading dashboard data.');
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  const switchRole = async (role) => {
    try {
      setLoading(true);
      setError(null);
      const me = await api.demo(role);
      setCurrentUser(me);
      setActiveTab('overview');
      await loadAllData(me);
      showNotification(`Switched demo perspective to ${role.toUpperCase()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Run automatic scheduler
  const handleRunScheduler = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const result = await api.runBillingScheduler();
      showNotification(
        `Billing Scheduler completed: ${result.invoiced} invoices generated, ${result.duplicates_skipped} duplicates prevented, ${result.failed} failed.`
      );
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Retry an obligation
  const handleRetry = async (obligationId) => {
    try {
      setActionLoading(true);
      setError(null);
      await api.retryObligation(obligationId);
      showNotification(`Obligation retry processed successfully.`);
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // View calculation receipt
  const handleViewReceipt = async (invoiceId) => {
    try {
      setActionLoading(true);
      setError(null);
      const receipt = await api.getInvoiceReceipt(invoiceId);
      setActiveReceipt(receipt);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Reliability Testing Scenario
  const handleRunScenario = async (scenarioKey) => {
    try {
      setActionLoading(true);
      setError(null);
      const report = await api.runReliabilityScenario(scenarioKey);
      setScenarioReport(report);
      showNotification(`Reliability demonstration test executed.`);
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Lifecycle transition
  const handleStatusTransition = async (subscriptionId, newStatus) => {
    try {
      setActionLoading(true);
      setError(null);
      await api.transitionSubscription(subscriptionId, newStatus);
      showNotification(`Subscription status updated to '${newStatus}'.`);
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Customer self-subscribe
  const handleCustomerSubscribe = async (planId, productId) => {
    try {
      setActionLoading(true);
      setError(null);
      await api.customerSubscribe({ plan_id: planId, product_id: productId, quantity: 1 });
      showNotification('Successfully subscribed to plan!');
      await loadAllData(currentUser);
      setActiveTab('subscriptions');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await api.recordPayment(paymentModalInvoice.id, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        date: paymentForm.date,
        notes: paymentForm.notes,
        idempotency_key: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      });
      showNotification('Payment recorded successfully!');
      setPaymentModalInvoice(null);
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Invoice
  const handleConfirmInvoice = async (invoiceId) => {
    try {
      setActionLoading(true);
      setError(null);
      await api.confirmInvoice(invoiceId);
      showNotification('Invoice confirmed.');
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isStaffOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff');
  const isAdmin = currentUser && currentUser.role === 'admin';
  const isCustomer = currentUser && currentUser.role === 'customer';

  // Filtered Obligations
  const filteredObligations = obligations.filter((ob) => {
    if (statusFilter !== 'all' && ob.status !== statusFilter) return false;
    if (dateFilter && ob.due_date !== dateFilter) return false;
    return true;
  });

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">B</div>
          <div>
            <div className="brand-title">Brightloop</div>
            <div className="brand-subtitle">Subscription & Revenue Intelligence</div>
          </div>
        </div>

        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard Overview</span>
          </button>

          {isStaffOrAdmin && (
            <button 
              className={`nav-item ${activeTab === 'assurance' ? 'active' : ''}`}
              onClick={() => setActiveTab('assurance')}
            >
              <ShieldCheck size={18} />
              <span>Billing Assurance</span>
            </button>
          )}

          <button 
            className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            <CreditCard size={18} />
            <span>Subscriptions</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <FileText size={18} />
            <span>Invoices</span>
          </button>

          {isCustomer && (
            <button 
              className={`nav-item ${activeTab === 'portal_subscribe' ? 'active' : ''}`}
              onClick={() => setActiveTab('portal_subscribe')}
            >
              <PlusCircle size={18} />
              <span>Explore Plans</span>
            </button>
          )}

          <button 
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            <span>Product Catalog</span>
          </button>

          {isStaffOrAdmin && (
            <button 
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <Users size={18} />
              <span>Customers</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button 
                className={`nav-item ${activeTab === 'team' ? 'active' : ''}`}
                onClick={() => setActiveTab('team')}
              >
                <Users size={18} />
                <span>Team & Staff</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                <Activity size={18} />
                <span>Audit Logs</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Demo Role Switcher</div>
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
            <button 
              className={`btn btn-secondary ${currentUser?.role === 'admin' ? 'active' : ''}`}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => switchRole('admin')}
            >
              Admin
            </button>
            <button 
              className={`btn btn-secondary ${currentUser?.role === 'staff' ? 'active' : ''}`}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => switchRole('staff')}
            >
              Staff
            </button>
            <button 
              className={`btn btn-secondary ${currentUser?.role === 'customer' ? 'active' : ''}`}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => switchRole('customer')}
            >
              Customer
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar">
          <div>
            <h1>
              {activeTab === 'overview' && (isCustomer ? 'Customer Billing Portal' : 'Organization Dashboard')}
              {activeTab === 'assurance' && 'Billing Assurance Center'}
              {activeTab === 'subscriptions' && 'Subscription Management'}
              {activeTab === 'invoices' && 'Invoice Management'}
              {activeTab === 'products' && 'Product & Plan Catalog'}
              {activeTab === 'customers' && 'Customer Management'}
              {activeTab === 'team' && 'Team & Staff Accounts'}
              {activeTab === 'audit' && 'System Audit Logs'}
              {activeTab === 'portal_subscribe' && 'Available Subscription Plans'}
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Signed in as: <strong>{currentUser?.name}</strong> [{currentUser?.role?.toUpperCase()}]
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={() => loadAllData(currentUser)} 
              className="btn btn-secondary" 
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
              title="Refresh Data"
              disabled={loading || actionLoading}
            >
              <RefreshCw size={14} className={loading || actionLoading ? 'animate-spin' : ''} />
              Refresh
            </button>

            {isStaffOrAdmin && (
              <button
                onClick={handleRunScheduler}
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                disabled={actionLoading}
              >
                <Play size={14} /> Run Recurring Billing
              </button>
            )}

            <div className="system-badge">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
              Connected
            </div>
          </div>
        </header>

        <div className="content-body">
          {/* Notifications */}
          {error && (
            <div className="alert alert-error">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit' }}>✕</button>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* TAB: BILLING ASSURANCE CENTER (Feature 4) */}
          {activeTab === 'assurance' && isStaffOrAdmin && (
            <div>
              {/* Subtabs navigation */}
              <div className="subtabs">
                <button 
                  className={`subtab-btn ${assuranceSubtab === 'monitor' ? 'active' : ''}`}
                  onClick={() => setAssuranceSubtab('monitor')}
                >
                  Coverage Monitor
                </button>
                <button 
                  className={`subtab-btn ${assuranceSubtab === 'recovery' ? 'active' : ''}`}
                  onClick={() => setAssuranceSubtab('recovery')}
                >
                  Recovery Console
                </button>
                <button 
                  className={`subtab-btn ${assuranceSubtab === 'testing' ? 'active' : ''}`}
                  onClick={() => setAssuranceSubtab('testing')}
                >
                  Reliability Testing Center
                </button>
              </div>

              {/* Subtab 1: Coverage Monitor */}
              {assuranceSubtab === 'monitor' && (
                <div>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-info">
                        <p>Total Expected Invoices</p>
                        <h2>{assuranceSummary?.total_expected ?? '...'}</h2>
                      </div>
                      <div className="stat-icon icon-blue"><CreditCard size={24} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <p>Successfully Invoiced</p>
                        <h2 style={{ color: 'var(--success)' }}>{assuranceSummary?.successfully_invoiced ?? '...'}</h2>
                      </div>
                      <div className="stat-icon icon-emerald"><CheckCircle2 size={24} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <p>Missing Invoices</p>
                        <h2 style={{ color: assuranceSummary?.missing_invoices > 0 ? 'var(--danger)' : 'inherit' }}>
                          {assuranceSummary?.missing_invoices ?? '...'}
                        </h2>
                      </div>
                      <div className="stat-icon icon-amber"><AlertTriangle size={24} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <p>Delayed Invoices</p>
                        <h2 style={{ color: assuranceSummary?.delayed_invoices > 0 ? 'var(--warning)' : 'inherit' }}>
                          {assuranceSummary?.delayed_invoices ?? '...'}
                        </h2>
                      </div>
                      <div className="stat-icon icon-amber"><Clock size={24} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <p>Failed Attempts</p>
                        <h2 style={{ color: assuranceSummary?.failed_attempts > 0 ? 'var(--danger)' : 'inherit' }}>
                          {assuranceSummary?.failed_attempts ?? '...'}
                        </h2>
                      </div>
                      <div className="stat-icon icon-amber" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertCircle size={24} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <p>Duplicates Prevented</p>
                        <h2 style={{ color: 'var(--primary)' }}>{assuranceSummary?.duplicates_prevented ?? '...'}</h2>
                      </div>
                      <div className="stat-icon icon-indigo"><ShieldCheck size={24} /></div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="section-header">
                      <div>
                        <h2>Billing Obligation Ledger</h2>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          Database-backed obligation tracking ensuring every cycle generates exactly one invoice.
                        </p>
                      </div>
                      <div className="filters-bar" style={{ marginBottom: 0 }}>
                        <select 
                          className="filter-input"
                          value={statusFilter} 
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="invoiced">Invoiced</option>
                          <option value="failed">Failed</option>
                        </select>
                        <input 
                          type="date" 
                          className="filter-input"
                          value={dateFilter} 
                          onChange={(e) => setDateFilter(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Subscription</th>
                            <th>Expected Date</th>
                            <th>Billing Period</th>
                            <th>Actual Invoice</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredObligations.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="empty-state">No billing obligations found matching criteria.</td>
                            </tr>
                          ) : (
                            filteredObligations.map((ob) => (
                              <tr key={ob.id}>
                                <td>
                                  <strong>{ob.customer_name || 'Customer'}</strong>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ob.customer_email}</div>
                                </td>
                                <td>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ob.subscription_number || ob.subscription_id.slice(0, 8)}</span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: {ob.subscription_status}</div>
                                </td>
                                <td>{ob.due_date}</td>
                                <td>{ob.period_start} → {ob.period_end}</td>
                                <td>
                                  {ob.invoice_number ? (
                                    <div>
                                      <button 
                                        onClick={() => handleViewReceipt(ob.invoice_id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600, padding: 0 }}
                                        title="Click to view Calculation Receipt"
                                      >
                                        {ob.invoice_number} ↗
                                      </button>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        ₹{ob.invoice_total || '0.00'} ({ob.invoice_status})
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>None</span>
                                  )}
                                </td>
                                <td><span className={`badge badge-${ob.status}`}>{ob.status}</span></td>
                                <td>
                                  {ob.status === 'failed' || ob.status === 'pending' ? (
                                    <button 
                                      className="btn-retry"
                                      onClick={() => handleRetry(ob.id)}
                                      disabled={actionLoading}
                                    >
                                      <RotateCw size={13} className={actionLoading ? 'animate-spin' : ''} /> Retry
                                    </button>
                                  ) : ob.invoice_id ? (
                                    <button 
                                      className="btn btn-secondary"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                      onClick={() => handleViewReceipt(ob.invoice_id)}
                                    >
                                      Receipt
                                    </button>
                                  ) : '-'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Recovery Console */}
              {assuranceSubtab === 'recovery' && (
                <div className="card">
                  <div className="section-header">
                    <div>
                      <h2>Failure Recovery Console</h2>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        Inspect failed or unfulfilled billing obligations, review logged error reasons, and execute authorized recovery.
                      </p>
                    </div>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Subscription</th>
                          <th>Cycle Date</th>
                          <th>Attempts</th>
                          <th>Failure Reason / Audit Detail</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {obligations.filter(ob => ob.status === 'failed').length === 0 ? (
                          <tr>
                            <td colSpan={6} className="empty-state">
                              🎉 No failed billing obligations found! All cycles are healthy.
                            </td>
                          </tr>
                        ) : (
                          obligations.filter(ob => ob.status === 'failed').map(ob => (
                            <tr key={ob.id}>
                              <td style={{ fontFamily: 'monospace' }}>#{ob.id.slice(0, 8)}</td>
                              <td><strong>{ob.subscription_number || ob.subscription_id.slice(0, 8)}</strong></td>
                              <td>{ob.period_start}</td>
                              <td><span className="badge badge-failed">{ob.attempt_count} attempts</span></td>
                              <td style={{ color: 'var(--danger)', fontSize: '0.825rem', maxWidth: '300px' }}>
                                {ob.last_error || 'Unknown failure'}
                              </td>
                              <td>
                                <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleRetry(ob.id)} disabled={actionLoading}>
                                  <RotateCw size={13} /> Retry Obligation
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab 3: Reliability Testing Center (Feature 4.D) */}
              {assuranceSubtab === 'testing' && (
                <div>
                  <div className="card">
                    <div className="section-header">
                      <div>
                        <h2>Reliability Testing Center</h2>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          Controlled demonstration environment to test edge conditions, duplicate prevention, and automated recovery.
                        </p>
                      </div>
                    </div>

                    <div className="scenario-card">
                      <div>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>1. Duplicate Scheduler Execution</h4>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          Executes recurring billing twice in immediate succession. Verifies row-locks and cycle constraints ensure 0 duplicate invoices.
                        </p>
                      </div>
                      <button className="btn btn-primary" onClick={() => handleRunScenario('scheduler_duplicate_execution')} disabled={actionLoading}>
                        Test Idempotency
                      </button>
                    </div>

                    <div className="scenario-card">
                      <div>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>2. Simulate Billing Failure</h4>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          Injects a simulated upstream serialization/timeout failure on an obligation to demonstrate error capture and Recovery Console triage.
                        </p>
                      </div>
                      <button className="btn btn-secondary" onClick={() => handleRunScenario('simulate_billing_failure')} disabled={actionLoading}>
                        Inject Failure
                      </button>
                    </div>

                    <div className="scenario-card">
                      <div>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>3. Delayed Invoice Detection</h4>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          Audits the coverage ledger for unbilled cycles whose due date is in the past.
                        </p>
                      </div>
                      <button className="btn btn-secondary" onClick={() => handleRunScenario('delayed_invoice_detection')} disabled={actionLoading}>
                        Run Delayed Audit
                      </button>
                    </div>

                    <div className="scenario-card">
                      <div>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>4. Customer Role Barrier</h4>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          Verifies backend customer tokens are blocked with 403 Forbidden on internal assurance routes.
                        </p>
                      </div>
                      <button className="btn btn-secondary" onClick={() => handleRunScenario('unauthorized_customer_barrier')} disabled={actionLoading}>
                        Verify Barrier
                      </button>
                    </div>

                    {scenarioReport && (
                      <div className="card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', marginTop: '1.5rem' }}>
                        <h3 style={{ color: '#065f46', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={18} /> Test Scenario Findings ({scenarioReport.scenario})
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#047857', marginBottom: '0.5rem' }}>
                          {scenarioReport.findings}
                        </p>
                        <div style={{ fontSize: '0.75rem', color: '#059669' }}>
                          Logged at {scenarioReport.executed_at}. Real database state updated and logged to audit trail.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <p>Total Revenue</p>
                    <h2>₹{dashboard?.collected ? parseFloat(dashboard.collected).toFixed(2) : '0.00'}</h2>
                  </div>
                  <div className="stat-icon icon-emerald"><DollarSign size={24} /></div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Monthly Recurring Revenue (MRR)</p>
                    <h2 style={{ color: 'var(--primary)' }}>₹{dashboard?.mrr ? parseFloat(dashboard.mrr).toFixed(2) : '0.00'}</h2>
                  </div>
                  <div className="stat-icon icon-blue"><Activity size={24} /></div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Active Subscriptions</p>
                    <h2>{dashboard?.active_subscriptions ?? 0}</h2>
                  </div>
                  <div className="stat-icon icon-indigo"><CreditCard size={24} /></div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Billing Coverage</p>
                    <h2 style={{ color: '#059669' }}>{dashboard?.coverage_percentage ?? '100%'}</h2>
                  </div>
                  <div className="stat-icon icon-emerald"><ShieldCheck size={24} /></div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Outstanding Balance</p>
                    <h2>₹{dashboard?.outstanding ? parseFloat(dashboard.outstanding).toFixed(2) : '0.00'}</h2>
                  </div>
                  <div className="stat-icon icon-amber"><Clock size={24} /></div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Overdue Invoices</p>
                    <h2 style={{ color: dashboard?.overdue_invoices > 0 ? 'var(--danger)' : 'inherit' }}>
                      {dashboard?.overdue_invoices ?? 0}
                    </h2>
                  </div>
                  <div className="stat-icon icon-amber" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertTriangle size={24} /></div>
                </div>
              </div>

              {isStaffOrAdmin && (
                <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ color: '#166534', marginBottom: '0.25rem' }}>Billing Assurance Coverage</h3>
                      <p style={{ fontSize: '0.85rem', color: '#15803d' }}>
                        Automated ledger monitors <strong>{assuranceSummary?.total_expected ?? 0} cycles</strong> with <strong>{assuranceSummary?.duplicates_prevented ?? 0} duplicate attempts prevented</strong>.
                      </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setActiveTab('assurance')}>
                      <ShieldCheck size={16} /> Open Assurance Center
                    </button>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="section-header">
                  <h2>Recent Subscriptions</h2>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('subscriptions')}>View All</button>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Customer</th>
                        <th>Plan</th>
                        <th>Interval</th>
                        <th>Next Billing</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.slice(0, 5).map(sub => (
                        <tr key={sub.id}>
                          <td><strong>{sub.number}</strong></td>
                          <td>{sub.customer_name}</td>
                          <td>{sub.plan_name}</td>
                          <td style={{ textTransform: 'capitalize' }}>{sub.interval}</td>
                          <td>{sub.next_billing}</td>
                          <td><span className={`badge badge-${sub.status}`}>{sub.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SUBSCRIPTIONS */}
          {activeTab === 'subscriptions' && (
            <div className="card">
              <div className="section-header">
                <h2>Subscriptions ({subscriptions.length})</h2>
                {isCustomer && (
                  <button className="btn btn-primary" onClick={() => setActiveTab('portal_subscribe')}>
                    <PlusCircle size={16} /> Subscribe to a Plan
                  </button>
                )}
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Customer</th>
                      <th>Plan</th>
                      <th>Interval</th>
                      <th>Base + Lines</th>
                      <th>Next Billing</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map(sub => (
                      <tr key={sub.id}>
                        <td><strong>{sub.number}</strong></td>
                        <td>{sub.customer_name}</td>
                        <td>{sub.plan_name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{sub.interval}</td>
                        <td>₹{sub.plan_price} ({sub.items?.length || 0} lines)</td>
                        <td>{sub.next_billing}</td>
                        <td><span className={`badge badge-${sub.status}`}>{sub.status}</span></td>
                        <td>
                          {sub.status === 'active' && (
                            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleStatusTransition(sub.id, 'paused')}>
                              Pause
                            </button>
                          )}
                          {sub.status === 'paused' && (
                            <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleStatusTransition(sub.id, 'active')}>
                              Resume
                            </button>
                          )}
                          {(sub.status === 'active' || sub.status === 'paused') && (
                            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.4rem', color: 'var(--danger)' }} onClick={() => handleStatusTransition(sub.id, 'closed')}>
                              Cancel
                            </button>
                          )}
                          {isStaffOrAdmin && sub.status === 'quotation' && (
                            <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleStatusTransition(sub.id, 'confirmed')}>
                              Confirm Quotation
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: INVOICES (Feature 4.B Calculation Receipt & Feature 5 Payments) */}
          {activeTab === 'invoices' && (
            <div className="card">
              <div className="section-header">
                <h2>Invoices & Payments ({invoices.length})</h2>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Cycle Date</th>
                      <th>Due Date</th>
                      <th>Total</th>
                      <th>Paid / Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr><td colSpan={8} className="empty-state">No invoices generated yet.</td></tr>
                    ) : (
                      invoices.map(inv => (
                        <tr key={inv.id}>
                          <td><strong>{inv.number}</strong></td>
                          <td>{inv.customer_name}</td>
                          <td>{inv.cycle_date}</td>
                          <td>{inv.due_date}</td>
                          <td><strong>₹{parseFloat(inv.total).toFixed(2)}</strong></td>
                          <td>
                            ₹{inv.paid} / <span style={{ color: parseFloat(inv.balance) > 0 ? 'var(--danger)' : 'inherit' }}>₹{inv.balance}</span>
                          </td>
                          <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => handleViewReceipt(inv.id)}
                              >
                                Receipt
                              </button>
                              {isStaffOrAdmin && inv.status === 'draft' && (
                                <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => handleConfirmInvoice(inv.id)}
                                >
                                  Confirm
                                </button>
                              )}
                              {isStaffOrAdmin && inv.status === 'confirmed' && (
                                <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => {
                                    setPaymentModalInvoice(inv);
                                    setPaymentForm({ ...paymentForm, amount: inv.balance });
                                  }}
                                >
                                  Record Payment
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMER PORTAL SUBSCRIBE (Feature 7) */}
          {activeTab === 'portal_subscribe' && isCustomer && (
            <div>
              <div className="card">
                <div className="section-header">
                  <h2>Select a Subscription Plan</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {plans.map(p => (
                    <div key={p.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fafafa' }}>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{p.name}</h3>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                        ₹{parseFloat(p.price).toFixed(2)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {p.interval}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Includes base plan platform fee, automatic recurring billing assurance, and transparent calculation receipts.
                      </p>
                      {products.filter(prod => prod.active).slice(0, 1).map(prod => (
                        <button 
                          key={prod.id}
                          className="btn btn-primary" 
                          style={{ width: '100%' }}
                          onClick={() => handleCustomerSubscribe(p.id, prod.id)}
                          disabled={actionLoading}
                        >
                          Subscribe Now <ArrowRight size={16} />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRODUCTS & PLANS */}
          {activeTab === 'products' && (
            <div>
              <div className="card">
                <div className="section-header">
                  <h2>Product Catalog ({products.length})</h2>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Product</th><th>Sales Price</th><th>Variants</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>₹{parseFloat(p.sales_price).toFixed(2)}</td>
                          <td>{p.variants?.length ? p.variants.map(v => v.name).join(', ') : 'None'}</td>
                          <td><span className="badge badge-active">{p.active ? 'Active' : 'Archived'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="section-header">
                  <h2>Billing Plans ({plans.length})</h2>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Plan</th><th>Interval</th><th>Base Price</th><th>Min Qty</th></tr>
                    </thead>
                    <tbody>
                      {plans.map(pl => (
                        <tr key={pl.id}>
                          <td><strong>{pl.name}</strong></td>
                          <td style={{ textTransform: 'capitalize' }}>{pl.interval}</td>
                          <td>₹{parseFloat(pl.price).toFixed(2)}</td>
                          <td>{pl.minimum_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMERS */}
          {activeTab === 'customers' && isStaffOrAdmin && (
            <div className="card">
              <div className="section-header">
                <h2>Customer Directory ({customers.length})</h2>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Company</th></tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.email}</td>
                        <td>{c.company || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TEAM & STAFF (ADMIN ONLY) */}
          {activeTab === 'team' && isAdmin && (
            <div className="card">
              <div className="section-header">
                <h2>Organization Team Members ({team.length})</h2>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th></tr>
                  </thead>
                  <tbody>
                    {team.map(member => (
                      <tr key={member.id}>
                        <td><strong>{member.name}</strong></td>
                        <td>{member.email}</td>
                        <td><span className={`badge badge-${member.role}`}>{member.role}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS (ADMIN ONLY) */}
          {activeTab === 'audit' && isAdmin && (
            <div className="card">
              <div className="section-header">
                <h2>System Audit Logs ({auditLogs.length})</h2>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan={5} className="empty-state">No audit logs recorded yet.</td></tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.created_at?.slice(0, 19).replace('T', ' ')}</td>
                          <td><strong>{log.user_name || 'System'}</strong></td>
                          <td><span className="badge badge-active">{log.action}</span></td>
                          <td>{log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 6)})` : ''}</td>
                          <td style={{ fontSize: '0.825rem' }}>{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CALCULATION RECEIPT MODAL (Feature 4.B) */}
      {activeReceipt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Invoice Calculation Receipt</h2>
              <button className="close-btn" onClick={() => setActiveReceipt(null)}>✕</button>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invoice Number</div>
                  <strong>{activeReceipt.invoice_number}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cycle Date</div>
                  <strong>{activeReceipt.cycle_date}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer</div>
                  <strong>{activeReceipt.customer_name}</strong>
                </div>
              </div>

              <div className="table-container" style={{ marginBottom: '1rem' }}>
                <table>
                  <thead>
                    <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr>
                  </thead>
                  <tbody>
                    {activeReceipt.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.description}</td>
                        <td>{it.quantity}</td>
                        <td>₹{parseFloat(it.unit_price).toFixed(2)}</td>
                        <td><strong>₹{parseFloat(it.line_total).toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span>Subtotal:</span>
                  <strong>₹{parseFloat(activeReceipt.subtotal).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span>Tax ({activeReceipt.tax_rate}%):</span>
                  <strong>₹{parseFloat(activeReceipt.tax).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', fontSize: '1.1rem' }}>
                  <span>Total Due:</span>
                  <strong style={{ color: 'var(--primary)' }}>₹{parseFloat(activeReceipt.total).toFixed(2)}</strong>
                </div>
              </div>

              <div className="receipt-box">
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Reconciliation Check: {activeReceipt.reconciled ? '✅ Verified Balanced' : '❌ Discrepancy'}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  {activeReceipt.reconciliation_formula}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL (Feature 5) */}
      {paymentModalInvoice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Record Payment for {paymentModalInvoice.number}</h2>
              <button className="close-btn" onClick={() => setPaymentModalInvoice(null)}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Payment Amount (₹) *
                </label>
                <input 
                  type="number"
                  step="0.01"
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  max={paymentModalInvoice.balance}
                  required 
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Max outstanding balance: ₹{paymentModalInvoice.balance}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Payment Method *
                </label>
                <select 
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Notes / Reference
                </label>
                <input 
                  type="text"
                  className="filter-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Bank Ref #TXN98721"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
                {actionLoading ? 'Recording...' : 'Submit Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
