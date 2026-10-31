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
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'assurance' | 'subscriptions' | 'products' | 'customers'
  
  // Data state
  const [dashboard, setDashboard] = useState(null);
  const [assuranceSummary, setAssuranceSummary] = useState(null);
  const [obligations, setObligations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters for Billing Assurance
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const initSession = async () => {
    try {
      setLoading(true);
      setError(null);
      let me;
      try {
        me = await api.getMe();
      } catch {
        // Automatically start demo as admin if not logged in
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

      const fetches = [
        api.getDashboard(),
        api.getRecords('subscriptions'),
        api.getRecords('products'),
        api.getRecords('customers'),
      ];

      if (isStaffOrAdmin) {
        fetches.push(api.getAssuranceSummary());
        fetches.push(api.getRecords('billing_obligations'));
      }

      const results = await Promise.all(fetches);
      setDashboard(results[0]);
      setSubscriptions(results[1] || []);
      setProducts(results[2] || []);
      setCustomers(results[3] || []);

      if (isStaffOrAdmin) {
        setAssuranceSummary(results[4]);
        setObligations(results[5] || []);
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
      if (role === 'customer' && activeTab === 'assurance') {
        setActiveTab('overview');
      }
      await loadAllData(me);
      showNotification(`Switched demo view to ${role.toUpperCase()}`);
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
        `Billing Scheduler finished: ${result.invoiced} invoices generated, ${result.duplicates_skipped} duplicates prevented, ${result.failed} failed.`
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

  const isStaffOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff');

  // Filtered Obligations
  const filteredObligations = obligations.filter((ob) => {
    if (statusFilter !== 'all' && ob.status !== statusFilter) {
      return false;
    }
    if (dateFilter && ob.due_date !== dateFilter) {
      return false;
    }
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
            <div className="brand-subtitle">Billing Assurance & Automation</div>
          </div>
        </div>

        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
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
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            <span>Products</span>
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
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Role Selector (Demo)</div>
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
              {activeTab === 'overview' && 'Billing Overview'}
              {activeTab === 'assurance' && 'Billing Assurance Monitor'}
              {activeTab === 'subscriptions' && 'Subscriptions'}
              {activeTab === 'products' && 'Product Catalog'}
              {activeTab === 'customers' && 'Customer Management'}
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Logged in as: <strong>{currentUser?.name}</strong> ({currentUser?.role})
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
                <Play size={14} />
                Run Billing Scheduler
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

          {/* TAB: BILLING ASSURANCE MONITOR (Feature 2 & 5) */}
          {activeTab === 'assurance' && isStaffOrAdmin && (
            <div>
              {/* Feature 2: Summary Metrics Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <p>Total Expected Invoices</p>
                    <h2>{assuranceSummary?.total_expected ?? '...'}</h2>
                  </div>
                  <div className="stat-icon icon-blue">
                    <CreditCard size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Successfully Invoiced</p>
                    <h2 style={{ color: 'var(--success)' }}>
                      {assuranceSummary?.successfully_invoiced ?? '...'}
                    </h2>
                  </div>
                  <div className="stat-icon icon-emerald">
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Missing Invoices</p>
                    <h2 style={{ color: assuranceSummary?.missing_invoices > 0 ? 'var(--danger)' : 'inherit' }}>
                      {assuranceSummary?.missing_invoices ?? '...'}
                    </h2>
                  </div>
                  <div className="stat-icon icon-amber">
                    <AlertTriangle size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Delayed Invoices</p>
                    <h2 style={{ color: assuranceSummary?.delayed_invoices > 0 ? 'var(--warning)' : 'inherit' }}>
                      {assuranceSummary?.delayed_invoices ?? '...'}
                    </h2>
                  </div>
                  <div className="stat-icon icon-amber">
                    <Clock size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Failed Attempts</p>
                    <h2 style={{ color: assuranceSummary?.failed_attempts > 0 ? 'var(--danger)' : 'inherit' }}>
                      {assuranceSummary?.failed_attempts ?? '...'}
                    </h2>
                  </div>
                  <div className="stat-icon icon-amber" style={{ background: '#fee2e2', color: '#dc2626' }}>
                    <AlertCircle size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Duplicates Prevented</p>
                    <h2 style={{ color: 'var(--primary)' }}>
                      {assuranceSummary?.duplicates_prevented ?? '...'}
                    </h2>
                  </div>
                  <div className="stat-icon icon-indigo">
                    <ShieldCheck size={24} />
                  </div>
                </div>
              </div>

              {/* Obligation Ledger Table */}
              <div className="card">
                <div className="section-header">
                  <div>
                    <h2>Billing Obligation Ledger</h2>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      Complete cycle tracking ensuring every active subscription generates exactly one invoice per interval.
                    </p>
                  </div>
                  <button 
                    onClick={handleRunScheduler}
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    <Play size={16} /> Execute Billing Cycle Run
                  </button>
                </div>

                {/* Filters */}
                <div className="filters-bar">
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginRight: '0.5rem' }}>Status:</label>
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
                      <option value="skipped">Skipped</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginRight: '0.5rem' }}>Due Date:</label>
                    <input 
                      type="date" 
                      className="filter-input"
                      value={dateFilter} 
                      onChange={(e) => setDateFilter(e.target.value)} 
                    />
                    {dateFilter && (
                      <button 
                        onClick={() => setDateFilter('')}
                        style={{ marginLeft: '0.4rem', border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
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
                        <th>Attempts / Error</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredObligations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="empty-state">
                            No billing obligations found matching filter criteria.
                          </td>
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
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                                    {ob.invoice_number}
                                  </span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    ₹{ob.invoice_total || '0.00'} ({ob.invoice_status})
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>None</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge badge-${ob.status}`}>
                                {ob.status}
                              </span>
                            </td>
                            <td>
                              <div>Count: {ob.attempt_count}</div>
                              {ob.last_error && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--danger)', maxWidth: '220px', wordBreak: 'break-word' }}>
                                  {ob.last_error}
                                </div>
                              )}
                            </td>
                            <td>
                              {ob.status === 'failed' || ob.status === 'pending' ? (
                                <button 
                                  className="btn-retry"
                                  onClick={() => handleRetry(ob.id)}
                                  disabled={actionLoading}
                                  title="Retry invoice generation"
                                >
                                  <RotateCw size={13} className={actionLoading ? 'animate-spin' : ''} />
                                  Retry
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                              )}
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

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <p>Active Subscriptions</p>
                    <h2>{dashboard?.active_subscriptions ?? 0}</h2>
                  </div>
                  <div className="stat-icon icon-blue">
                    <CreditCard size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Total Collected</p>
                    <h2>₹{dashboard?.collected ? parseFloat(dashboard.collected).toFixed(2) : '0.00'}</h2>
                  </div>
                  <div className="stat-icon icon-emerald">
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Outstanding Balance</p>
                    <h2>₹{dashboard?.outstanding ? parseFloat(dashboard.outstanding).toFixed(2) : '0.00'}</h2>
                  </div>
                  <div className="stat-icon icon-amber">
                    <Clock size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <p>Overdue Invoices</p>
                    <h2>{dashboard?.overdue_invoices ?? 0}</h2>
                  </div>
                  <div className="stat-icon icon-amber" style={{ background: '#fee2e2', color: '#dc2626' }}>
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </div>

              {isStaffOrAdmin && (
                <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ color: '#166534', marginBottom: '0.25rem' }}>Billing Assurance Coverage</h3>
                      <p style={{ fontSize: '0.85rem', color: '#15803d' }}>
                        Automated ledger monitors <strong>{assuranceSummary?.total_expected ?? 0} expected billing cycles</strong> with <strong>{assuranceSummary?.duplicates_prevented ?? 0} duplicate attempts prevented</strong>.
                      </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setActiveTab('assurance')}>
                      <ShieldCheck size={16} /> Open Assurance Monitor
                    </button>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="section-header">
                  <h2>Active Subscriptions</h2>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('subscriptions')}>
                    View All
                  </button>
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
                <h2>All Subscriptions ({subscriptions.length})</h2>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Customer</th>
                      <th>Plan</th>
                      <th>Interval</th>
                      <th>Price / Line</th>
                      <th>Next Billing</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map(sub => (
                      <tr key={sub.id}>
                        <td><strong>{sub.number}</strong></td>
                        <td>{sub.customer_name}</td>
                        <td>{sub.plan_name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{sub.interval}</td>
                        <td>₹{sub.plan_price} base + {sub.items?.length || 0} items</td>
                        <td>{sub.next_billing}</td>
                        <td><span className={`badge badge-${sub.status}`}>{sub.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="card">
              <div className="section-header">
                <h2>Product Catalog ({products.length})</h2>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Sales Price</th>
                      <th>Variants</th>
                      <th>Status</th>
                    </tr>
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
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Company</th>
                    </tr>
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
        </div>
      </main>
    </div>
  );
}
