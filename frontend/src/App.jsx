import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import './App.css';
import LandingPage from './LandingPage';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  Activity,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Filter,
  Download,
  RefreshCw,
  Play,
  RotateCw,
  Pause,
  Calendar,
  DollarSign,
  Layers,
  ExternalLink,
  Eye,
  Sparkles,
  TrendingUp,
  Building2,
  LogOut,
  Sliders,
  Check,
  X
} from 'lucide-react';

export default function App() {
  // Session & User
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    if (window.location.hash === '#app' || window.location.pathname.startsWith('/app')) {
      return 'app';
    }
    return 'landing';
  });
  const [activeTab, setActiveTab] = useState('overview');
  // 'overview' | 'assurance' | 'subscriptions' | 'invoices' | 'customers' | 'products' | 'reports' | 'team' | 'audit' | 'settings' | 'portal_plans'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Assurance Subtab
  const [assuranceSubtab, setAssuranceSubtab] = useState('monitor'); // 'monitor' | 'recovery' | 'testing'

  // Data State
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

  // Filters & Tabs State
  const [subFilterTab, setSubFilterTab] = useState('all');
  const [invFilterTab, setInvFilterTab] = useState('all');
  const [obStatusFilter, setObStatusFilter] = useState('all');
  const [obDateFilter, setObDateFilter] = useState('');

  // Modals & Drawers
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Inspection Drawers/Modals
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [viewSubscription, setViewSubscription] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [showNewSubModal, setShowNewSubModal] = useState(false);

  // Forms
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'bank_transfer',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', company: '' });
  const [productForm, setProductForm] = useState({ name: '', sales_price: '', cost_price: '0.00' });
  const [planForm, setPlanForm] = useState({ name: '', interval: 'monthly', price: '', minimum_quantity: 1 });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '' });
  const [newSubForm, setNewSubForm] = useState({ customer_id: '', plan_id: '', product_id: '', quantity: 1 });

  // Reliability scenario feedback
  const [scenarioReport, setScenarioReport] = useState(null);

  // Toast Helper
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Init Data Fetch
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
      setError(err.message || 'Error loading records.');
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
      addToast(`Switched perspective to ${role.toUpperCase()}`, 'info');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Scheduler Runner
  const handleRunScheduler = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.runBillingScheduler();
      addToast(
        `Billing run complete: ${res.invoiced} invoices generated, ${res.duplicates_skipped} duplicates prevented, ${res.failed} failed.`,
        res.failed > 0 ? 'warning' : 'success'
      );
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Retry an Obligation
  const handleRetryObligation = async (obligationId) => {
    try {
      setActionLoading(true);
      setError(null);
      await api.retryObligation(obligationId);
      addToast('Obligation successfully recovered and processed.');
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // View Receipt
  const handleViewReceipt = async (invoiceId) => {
    try {
      setActionLoading(true);
      setError(null);
      const receipt = await api.getInvoiceReceipt(invoiceId);
      setActiveReceipt(receipt);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Run Scenario
  const handleRunScenario = async (scenarioKey) => {
    try {
      setActionLoading(true);
      setError(null);
      const report = await api.runReliabilityScenario(scenarioKey);
      setScenarioReport(report);
      addToast(`Reliability scenario executed.`);
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Status Transition
  const handleStatusTransition = async (subscriptionId, newStatus) => {
    try {
      setActionLoading(true);
      setError(null);
      await api.transitionSubscription(subscriptionId, newStatus);
      addToast(`Subscription transition to '${newStatus}' confirmed.`);
      await loadAllData(currentUser);
      if (viewSubscription?.id === subscriptionId) {
        setViewSubscription((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
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
      addToast('Invoice confirmed and posted.');
      await loadAllData(currentUser);
      if (viewInvoice?.id === invoiceId) {
        setViewInvoice((prev) => ({ ...prev, status: 'confirmed' }));
      }
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
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
      addToast(`Payment of ₹${parseFloat(paymentForm.amount).toFixed(2)} recorded.`);
      setPaymentModalInvoice(null);
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Customer Subscribe Self-Service
  const handleCustomerSubscribe = async (planId, productId) => {
    try {
      setActionLoading(true);
      setError(null);
      const plan = plans.find((p) => p.id === planId);
      const qty = Math.max(plan?.minimum_quantity || 1, 1);
      await api.customerSubscribe({ plan_id: planId, product_id: productId, quantity: qty });
      addToast('Subscription successfully activated!');
      await loadAllData(currentUser);
      setActiveTab('subscriptions');
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Staff/Admin Create Subscription
  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.createSubscription({
        customer_id: newSubForm.customer_id,
        plan_id: newSubForm.plan_id,
        start_date: new Date().toISOString().slice(0, 10),
        items: [
          {
            product_id: newSubForm.product_id,
            quantity: parseInt(newSubForm.quantity, 10) || 1,
          },
        ],
      });
      addToast('Subscription quotation created successfully.');
      setShowNewSubModal(false);
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.createCustomer(customerForm);
      addToast(`Customer ${customerForm.name} registered.`);
      setShowNewCustomerModal(false);
      setCustomerForm({ name: '', email: '', company: '' });
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.createProduct({
        name: productForm.name,
        sales_price: parseFloat(productForm.sales_price),
        cost_price: parseFloat(productForm.cost_price || '0'),
      });
      addToast(`Product ${productForm.name} created.`);
      setShowNewProductModal(false);
      setProductForm({ name: '', sales_price: '', cost_price: '0.00' });
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Plan
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.createPlan({
        name: planForm.name,
        interval: planForm.interval,
        price: parseFloat(planForm.price),
        minimum_quantity: parseInt(planForm.minimum_quantity, 10) || 1,
      });
      addToast(`Billing Plan ${planForm.name} configured.`);
      setShowNewPlanModal(false);
      setPlanForm({ name: '', interval: 'monthly', price: '', minimum_quantity: 1 });
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.createStaff(staffForm);
      addToast(`Staff member ${staffForm.name} provisioned.`);
      setShowNewStaffModal(false);
      setStaffForm({ name: '', email: '', password: '' });
      await loadAllData(currentUser);
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (!invoices.length) {
      addToast('No invoice records to export', 'warning');
      return;
    }
    const headers = 'Invoice Number,Customer,Cycle Date,Due Date,Total,Paid,Balance,Status\n';
    const rows = invoices
      .map(
        (i) =>
          `"${i.number}","${i.customer_name}","${i.cycle_date}","${i.due_date}","${i.total}","${i.paid}","${i.balance}","${i.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brightloop_revenue_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Report CSV exported successfully.');
  };

  const isStaffOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff');
  const isAdmin = currentUser && currentUser.role === 'admin';
  const isCustomer = currentUser && currentUser.role === 'customer';

  // Filtered Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      if (subFilterTab !== 'all' && s.status !== subFilterTab) return false;
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        const matchNum = s.number?.toLowerCase().includes(query);
        const matchCust = s.customer_name?.toLowerCase().includes(query);
        const matchPlan = s.plan_name?.toLowerCase().includes(query);
        if (!matchNum && !matchCust && !matchPlan) return false;
      }
      return true;
    });
  }, [subscriptions, subFilterTab, globalSearch]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (invFilterTab !== 'all') {
        if (invFilterTab === 'overdue' && !inv.overdue) return false;
        if (invFilterTab !== 'overdue' && inv.status !== invFilterTab) return false;
      }
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        const matchNum = inv.number?.toLowerCase().includes(query);
        const matchCust = inv.customer_name?.toLowerCase().includes(query);
        if (!matchNum && !matchCust) return false;
      }
      return true;
    });
  }, [invoices, invFilterTab, globalSearch]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!globalSearch) return true;
      const q = globalSearch.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
      );
    });
  }, [customers, globalSearch]);

  // Filtered Obligations
  const filteredObligations = useMemo(() => {
    return obligations.filter((ob) => {
      if (obStatusFilter !== 'all' && ob.status !== obStatusFilter) return false;
      if (obDateFilter && ob.due_date !== obDateFilter) return false;
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        const matchCust = ob.customer_name?.toLowerCase().includes(q);
        const matchSub = ob.subscription_number?.toLowerCase().includes(q);
        if (!matchCust && !matchSub) return false;
      }
      return true;
    });
  }, [obligations, obStatusFilter, obDateFilter, globalSearch]);

  // Calculations for Metrics
  const mrrValue = parseFloat(dashboard?.mrr || '0');
  const arrValue = mrrValue * 12;
  const collectedValue = parseFloat(dashboard?.collected || '0');
  const outstandingValue = parseFloat(dashboard?.outstanding || '0');
  const coverageRate = dashboard?.coverage_percentage || '100.0%';
  const totalSubCount = subscriptions.length;
  const churnRate =
    totalSubCount > 0
      ? ((subscriptions.filter((s) => s.status === 'closed').length / totalSubCount) * 100).toFixed(1) + '%'
      : '0.0%';

  // Dynamic SVG Bar Chart calculation
  const historyData = dashboard?.history || [];
  const maxHistoryAmount = Math.max(...historyData.map((h) => parseFloat(h.amount) || 0), 100);

  if (viewMode === 'landing') {
    return (
      <LandingPage
        onLaunchApp={() => setViewMode('app')}
        onDemoLogin={async (role) => {
          await switchRole(role);
          setViewMode('app');
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
            {t.type === 'error' && <AlertCircle size={16} className="text-rose-400" />}
            {t.type === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
            {t.type === 'info' && <Sparkles size={16} className="text-sky-400" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <div className="brand-icon">✦</div>
            {!sidebarCollapsed && (
              <div className="brand-meta">
                <span className="brand-name">Brightloop</span>
                <span className="brand-tag">Revenue Intelligence</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Organization Switcher */}
        {!sidebarCollapsed && (
          <div className="org-switcher" title="Organization Workspace">
            <div className="org-info">
              <div className="org-avatar">A</div>
              <span className="org-name">Acme Systems Inc</span>
            </div>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Pro</span>
          </div>
        )}

        <nav className="sidebar-nav">
          {!sidebarCollapsed && <span className="nav-section-title">Navigation</span>}

          <button
            className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            title="Dashboard Overview"
          >
            <LayoutDashboard size={18} className="icon" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          {isStaffOrAdmin && (
            <button
              className={`sidebar-link ${activeTab === 'assurance' ? 'active' : ''}`}
              onClick={() => setActiveTab('assurance')}
              title="Billing Assurance Center"
            >
              <ShieldCheck size={18} className="icon" />
              {!sidebarCollapsed && <span>Billing Assurance</span>}
              {!sidebarCollapsed && assuranceSummary?.failed_attempts > 0 && (
                <span className="nav-badge badge-alert">{assuranceSummary.failed_attempts}</span>
              )}
            </button>
          )}

          <button
            className={`sidebar-link ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
            title="Subscriptions"
          >
            <CreditCard size={18} className="icon" />
            {!sidebarCollapsed && <span>Subscriptions</span>}
            {!sidebarCollapsed && subscriptions.length > 0 && (
              <span className="nav-badge badge-active-count">{subscriptions.length}</span>
            )}
          </button>

          <button
            className={`sidebar-link ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
            title="Invoices & Payments"
          >
            <FileText size={18} className="icon" />
            {!sidebarCollapsed && <span>Invoices & Payments</span>}
            {!sidebarCollapsed && dashboard?.overdue_invoices > 0 && (
              <span className="nav-badge badge-alert">{dashboard.overdue_invoices}</span>
            )}
          </button>

          {isStaffOrAdmin && (
            <button
              className={`sidebar-link ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
              title="Customer Directory"
            >
              <Users size={18} className="icon" />
              {!sidebarCollapsed && <span>Customers</span>}
            </button>
          )}

          <button
            className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
            title="Product & Plan Catalog"
          >
            <Package size={18} className="icon" />
            {!sidebarCollapsed && <span>Product Catalog</span>}
          </button>

          {isCustomer && (
            <button
              className={`sidebar-link ${activeTab === 'portal_plans' ? 'active' : ''}`}
              onClick={() => setActiveTab('portal_plans')}
              title="Explore Plans"
            >
              <Sparkles size={18} className="icon" />
              {!sidebarCollapsed && <span>Explore Plans</span>}
            </button>
          )}

          {isStaffOrAdmin && (
            <>
              {!sidebarCollapsed && <span className="nav-section-title" style={{ marginTop: '0.5rem' }}>Analytics & Team</span>}

              <button
                className={`sidebar-link ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
                title="Reports & Analytics"
              >
                <BarChart3 size={18} className="icon" />
                {!sidebarCollapsed && <span>Reports & Analytics</span>}
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                className={`sidebar-link ${activeTab === 'team' ? 'active' : ''}`}
                onClick={() => setActiveTab('team')}
                title="Team & Permissions"
              >
                <Users size={18} className="icon" />
                {!sidebarCollapsed && <span>Team & Access</span>}
              </button>

              <button
                className={`sidebar-link ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
                title="System Audit Logs"
              >
                <Activity size={18} className="icon" />
                {!sidebarCollapsed && <span>Audit Trail</span>}
              </button>
            </>
          )}

          <button
            className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            title="Settings"
          >
            <Settings size={18} className="icon" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>

        {/* User Profile Footer */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{currentUser?.name?.charAt(0) || 'U'}</div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <span className="user-name">{currentUser?.name || 'User'}</span>
                <span className="user-role-badge">{currentUser?.role}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="app-main">
        {/* Discrete Enterprise Sandbox Banner */}
        <div className="sandbox-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="sandbox-pill">Testing Sandbox</span>
            <span style={{ color: '#94a3b8' }}>Active Role: <strong style={{ color: '#f8fafc', textTransform: 'capitalize' }}>{currentUser?.role}</strong></span>
          </div>
          <div className="sandbox-actions">
            <span style={{ fontSize: '0.725rem', color: '#64748b', marginRight: '0.25rem' }}>Switch Persona:</span>
            <button
              className={`sandbox-role-btn ${currentUser?.role === 'admin' ? 'active' : ''}`}
              onClick={() => switchRole('admin')}
            >
              Admin
            </button>
            <button
              className={`sandbox-role-btn ${currentUser?.role === 'staff' ? 'active' : ''}`}
              onClick={() => switchRole('staff')}
            >
              Staff
            </button>
            <button
              className={`sandbox-role-btn ${currentUser?.role === 'customer' ? 'active' : ''}`}
              onClick={() => switchRole('customer')}
            >
              Customer
            </button>
            <button
              className="sandbox-role-btn"
              style={{ marginLeft: '0.5rem', borderColor: '#475569', color: '#cbd5e1' }}
              onClick={() => setViewMode('landing')}
              title="Return to Art-Directed Marketing Website"
            >
              ← Marketing Website
            </button>
          </div>
        </div>

        {/* Top Header */}
        <header className="app-header">
          <div className="header-breadcrumbs">
            <button
              onClick={() => setViewMode('landing')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0 0.35rem 0 0',
              }}
              title="Return to Marketing Website"
            >
              ✦ Marketing Site
            </button>
            <span className="separator">/</span>
            <span>Brightloop</span>
            <span className="separator">/</span>
            <span>Acme Systems</span>
            <span className="separator">/</span>
            <span className="current">
              {activeTab === 'overview' && (isCustomer ? 'Customer Portal' : 'Revenue Intelligence')}
              {activeTab === 'assurance' && 'Billing Assurance Center'}
              {activeTab === 'subscriptions' && 'Subscriptions'}
              {activeTab === 'invoices' && 'Invoices & Accounting'}
              {activeTab === 'customers' && 'Customer CRM'}
              {activeTab === 'products' && 'Product & Plan Catalog'}
              {activeTab === 'reports' && 'Financial Reports & Analytics'}
              {activeTab === 'team' && 'Team Management'}
              {activeTab === 'audit' && 'System Audit Trail'}
              {activeTab === 'settings' && 'Workspace Settings'}
              {activeTab === 'portal_plans' && 'Subscription Catalog'}
            </span>
          </div>

          <div className="header-actions">
            {/* Global Search Bar */}
            <div className="global-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search records (Ctrl+K)..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              <span className="search-shortcut">⌘K</span>
            </div>

            <button
              onClick={() => loadAllData(currentUser)}
              className="btn-icon"
              title="Sync Data"
              disabled={loading || actionLoading}
            >
              <RefreshCw size={14} className={loading || actionLoading ? 'animate-spin' : ''} />
            </button>

            {isStaffOrAdmin && (
              <button
                onClick={handleRunScheduler}
                className="btn btn-primary"
                disabled={actionLoading}
                title="Execute Recurring Billing Engine"
              >
                <Play size={14} />
                <span>Run Billing Engine</span>
              </button>
            )}

            <div className="btn-icon" title="Operational Status: Connected">
              <CheckCircle2 size={15} color="var(--success)" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="page-container">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* =================================================================
              VIEW: DASHBOARD OVERVIEW (Stripe / Ramp Style)
             ================================================================= */}
          {activeTab === 'overview' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>{isCustomer ? 'Customer Account Overview' : 'Revenue Intelligence Dashboard'}</h1>
                  <p>
                    {isCustomer
                      ? 'Manage your subscriptions, view invoices, and track payment receipts.'
                      : 'Real-time subscription performance, MRR tracking, and billing health.'}
                  </p>
                </div>
                <div className="page-actions">
                  <button className="btn btn-secondary" onClick={handleExportCSV}>
                    <Download size={14} /> Export CSV
                  </button>
                  {isStaffOrAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowNewSubModal(true)}>
                      <Plus size={14} /> New Subscription
                    </button>
                  )}
                </div>
              </div>

              {/* Financial KPI Section */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Monthly Recurring Revenue</span>
                    <TrendingUp size={16} className="kpi-icon" />
                  </div>
                  <div className="kpi-value tabular-nums">₹{mrrValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="kpi-footer">
                    <span className="trend-badge trend-up">
                      <ArrowUpRight size={12} /> +14.2%
                    </span>
                    <span className="kpi-subtext">vs. prior month</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Annual Recurring Revenue</span>
                    <Calendar size={16} className="kpi-icon" />
                  </div>
                  <div className="kpi-value tabular-nums">₹{arrValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="kpi-footer">
                    <span className="trend-badge trend-neutral">Run-rate</span>
                    <span className="kpi-subtext">MRR × 12 annualized</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Total Collected Revenue</span>
                    <DollarSign size={16} className="kpi-icon" />
                  </div>
                  <div className="kpi-value tabular-nums">₹{collectedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="kpi-footer">
                    <span className="trend-badge trend-up">Paid</span>
                    <span className="kpi-subtext">Net reconciled cash</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Active Subscriptions</span>
                    <CreditCard size={16} className="kpi-icon" />
                  </div>
                  <div className="kpi-value tabular-nums">{dashboard?.active_subscriptions ?? 0}</div>
                  <div className="kpi-footer">
                    <span className="trend-badge trend-neutral">{dashboard?.paused_subscriptions ?? 0} paused</span>
                    <span className="kpi-subtext">{churnRate} churn rate</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Outstanding Balance</span>
                    <Clock size={16} className="kpi-icon" />
                  </div>
                  <div className="kpi-value tabular-nums" style={{ color: outstandingValue > 0 ? 'var(--warning-text)' : 'inherit' }}>
                    ₹{outstandingValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="kpi-footer">
                    <span className="trend-badge trend-down">{dashboard?.overdue_invoices ?? 0} overdue</span>
                    <span className="kpi-subtext">Awaiting collection</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Billing Coverage</span>
                    <ShieldCheck size={16} className="kpi-icon" />
                  </div>
                  <div className="kpi-value tabular-nums" style={{ color: 'var(--success)' }}>
                    {coverageRate}
                  </div>
                  <div className="kpi-footer">
                    <span className="trend-badge trend-up">Guaranteed</span>
                    <span className="kpi-subtext">0 duplicate attempts</span>
                  </div>
                </div>
              </div>

              {/* Financial Visualizations: Revenue Trend & Subscription Health */}
              <div className="chart-grid">
                <div className="chart-card">
                  <div className="chart-header">
                    <div>
                      <div className="chart-title">Revenue Collection Trend</div>
                      <div className="chart-subtitle">Monthly cash flow and reconciliation volume</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 6 Billing Periods</span>
                  </div>

                  <div className="bar-chart-container">
                    {historyData.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2rem', width: '100%' }}>
                        <span>Awaiting monthly payment collections</span>
                      </div>
                    ) : (
                      historyData.map((item, idx) => {
                        const amt = parseFloat(item.amount) || 0;
                        const heightPct = Math.max((amt / maxHistoryAmount) * 100, 12);
                        return (
                          <div key={idx} className="bar-column">
                            <span className="bar-tooltip">₹{amt.toLocaleString('en-IN')}</span>
                            <div className="bar-pill" style={{ height: `${heightPct}%` }} title={`₹${amt.toFixed(2)} in ${item.month}`} />
                            <span className="bar-label">{item.month}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="chart-card">
                  <div className="chart-header">
                    <div>
                      <div className="chart-title">Subscription Distribution</div>
                      <div className="chart-subtitle">Portfolio status breakdown</div>
                    </div>
                  </div>

                  <div className="breakdown-list" style={{ marginTop: '0.5rem' }}>
                    <div className="breakdown-item">
                      <div className="breakdown-row">
                        <span className="breakdown-label">
                          <span className="dot-indicator" style={{ backgroundColor: 'var(--success)' }} />
                          Active Subscriptions
                        </span>
                        <span className="breakdown-value tabular-nums">
                          {dashboard?.active_subscriptions ?? 0} (
                          {totalSubCount > 0 ? (((dashboard?.active_subscriptions || 0) / totalSubCount) * 100).toFixed(0) : 100}%)
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${totalSubCount > 0 ? ((dashboard?.active_subscriptions || 0) / totalSubCount) * 100 : 100}%`,
                            backgroundColor: 'var(--success)',
                          }}
                        />
                      </div>
                    </div>

                    <div className="breakdown-item">
                      <div className="breakdown-row">
                        <span className="breakdown-label">
                          <span className="dot-indicator" style={{ backgroundColor: 'var(--warning)' }} />
                          Paused Subscriptions
                        </span>
                        <span className="breakdown-value tabular-nums">
                          {dashboard?.paused_subscriptions ?? 0} (
                          {totalSubCount > 0 ? (((dashboard?.paused_subscriptions || 0) / totalSubCount) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${totalSubCount > 0 ? ((dashboard?.paused_subscriptions || 0) / totalSubCount) * 100 : 0}%`,
                            backgroundColor: 'var(--warning)',
                          }}
                        />
                      </div>
                    </div>

                    <div className="breakdown-item">
                      <div className="breakdown-row">
                        <span className="breakdown-label">
                          <span className="dot-indicator" style={{ backgroundColor: 'var(--text-tertiary)' }} />
                          Closed / Cancelled
                        </span>
                        <span className="breakdown-value tabular-nums">
                          {dashboard?.cancelled_subscriptions ?? 0} (
                          {totalSubCount > 0 ? (((dashboard?.cancelled_subscriptions || 0) / totalSubCount) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${totalSubCount > 0 ? ((dashboard?.cancelled_subscriptions || 0) / totalSubCount) * 100 : 0}%`,
                            backgroundColor: 'var(--text-tertiary)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Renewals Table */}
              <div className="table-card">
                <div className="table-toolbar">
                  <div>
                    <h3 style={{ fontSize: '0.925rem', fontWeight: 600 }}>Upcoming Billing Renewals</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next scheduled cycle obligations across active contracts</p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('subscriptions')}>
                    View All Contracts
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Subscription</th>
                        <th>Customer</th>
                        <th>Plan</th>
                        <th>Interval</th>
                        <th>Next Renewal Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.filter((s) => s.status === 'active').slice(0, 5).map((sub) => (
                        <tr key={sub.id}>
                          <td>
                            <strong style={{ fontFamily: 'var(--font-mono)' }}>{sub.number}</strong>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{sub.customer_name}</span>
                          </td>
                          <td>{sub.plan_name}</td>
                          <td style={{ textTransform: 'capitalize' }}>{sub.interval}</td>
                          <td className="tabular-nums">{sub.next_billing}</td>
                          <td>
                            <span className={`badge badge-${sub.status}`}>
                              <span className="badge-dot" /> {sub.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setViewSubscription(sub)}
                            >
                              <Eye size={13} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {subscriptions.filter((s) => s.status === 'active').length === 0 && (
                        <tr>
                          <td colSpan={7} className="empty-state">
                            No active upcoming renewals found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW: BILLING ASSURANCE CENTER (Signature Differentiator)
             ================================================================= */}
          {activeTab === 'assurance' && isStaffOrAdmin && (
            <div>
              {/* Assurance Header Banner */}
              <div className="assurance-banner">
                <div className="assurance-brand">
                  <div className="assurance-badge-icon">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h2>Billing Assurance & Revenue Protection</h2>
                    <p>Idempotent obligation ledger guaranteeing 0 duplicate invoices and 100% billing coverage.</p>
                  </div>
                </div>
                <div className="assurance-guarantee">
                  <CheckCircle2 size={16} />
                  <span>Compound Database Constraints Active</span>
                </div>
              </div>

              {/* Subtabs Bar */}
              <div className="filter-tabs" style={{ marginBottom: '1.25rem', width: 'fit-content' }}>
                <button
                  className={`tab-btn ${assuranceSubtab === 'monitor' ? 'active' : ''}`}
                  onClick={() => setAssuranceSubtab('monitor')}
                >
                  Coverage Monitor
                </button>
                <button
                  className={`tab-btn ${assuranceSubtab === 'recovery' ? 'active' : ''}`}
                  onClick={() => setAssuranceSubtab('recovery')}
                >
                  Recovery Console {assuranceSummary?.failed_attempts > 0 && `(${assuranceSummary.failed_attempts})`}
                </button>
                <button
                  className={`tab-btn ${assuranceSubtab === 'testing' ? 'active' : ''}`}
                  onClick={() => setAssuranceSubtab('testing')}
                >
                  Reliability Testing Center
                </button>
              </div>

              {/* Subtab 1: Coverage Monitor */}
              {assuranceSubtab === 'monitor' && (
                <div>
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-header">
                        <span className="kpi-label">Expected Obligations</span>
                        <Calendar size={16} className="kpi-icon" />
                      </div>
                      <div className="kpi-value tabular-nums">{assuranceSummary?.total_expected ?? '...'}</div>
                      <div className="kpi-footer">
                        <span className="kpi-subtext">Total tracked billing cycles</span>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-header">
                        <span className="kpi-label">Successfully Invoiced</span>
                        <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                      </div>
                      <div className="kpi-value tabular-nums" style={{ color: 'var(--success)' }}>
                        {assuranceSummary?.successfully_invoiced ?? '...'}
                      </div>
                      <div className="kpi-footer">
                        <span className="trend-badge trend-up">100% Reconciled</span>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-header">
                        <span className="kpi-label">Missing Invoices</span>
                        <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                      </div>
                      <div className="kpi-value tabular-nums" style={{ color: assuranceSummary?.missing_invoices > 0 ? 'var(--danger)' : 'inherit' }}>
                        {assuranceSummary?.missing_invoices ?? '...'}
                      </div>
                      <div className="kpi-footer">
                        <span className="kpi-subtext">Cycles pending generation</span>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-header">
                        <span className="kpi-label">Delayed Invoices</span>
                        <Clock size={16} style={{ color: 'var(--warning)' }} />
                      </div>
                      <div className="kpi-value tabular-nums" style={{ color: assuranceSummary?.delayed_invoices > 0 ? 'var(--warning)' : 'inherit' }}>
                        {assuranceSummary?.delayed_invoices ?? '...'}
                      </div>
                      <div className="kpi-footer">
                        <span className="kpi-subtext">Past due without invoice</span>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-header">
                        <span className="kpi-label">Failed Attempts</span>
                        <XCircle size={16} style={{ color: 'var(--danger)' }} />
                      </div>
                      <div className="kpi-value tabular-nums" style={{ color: assuranceSummary?.failed_attempts > 0 ? 'var(--danger)' : 'inherit' }}>
                        {assuranceSummary?.failed_attempts ?? '...'}
                      </div>
                      <div className="kpi-footer">
                        <span className="kpi-subtext">Requires operator review</span>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-header">
                        <span className="kpi-label">Duplicates Prevented</span>
                        <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
                      </div>
                      <div className="kpi-value tabular-nums" style={{ color: 'var(--primary)' }}>
                        {assuranceSummary?.duplicates_prevented ?? '...'}
                      </div>
                      <div className="kpi-footer">
                        <span className="trend-badge trend-up">Zero-Leak Guard</span>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className="table-card">
                    <div className="table-toolbar">
                      <div>
                        <h3 style={{ fontSize: '0.925rem', fontWeight: 600 }}>Billing Obligation Ledger</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Audited record of all generated cycles backed by compound unique constraint `uq_obligation_period`.
                        </p>
                      </div>

                      <div className="table-filters">
                        <select
                          className="filter-select"
                          value={obStatusFilter}
                          onChange={(e) => setObStatusFilter(e.target.value)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="invoiced">Invoiced</option>
                          <option value="failed">Failed</option>
                        </select>
                        <input
                          type="date"
                          className="filter-select"
                          value={obDateFilter}
                          onChange={(e) => setObDateFilter(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Subscription</th>
                            <th>Due Date</th>
                            <th>Period Range</th>
                            <th>Invoice Reference</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredObligations.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="empty-state">
                                No obligation ledger entries found matching filters.
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
                                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                    {ob.subscription_number || ob.subscription_id?.slice(0, 8)}
                                  </span>
                                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Status: {ob.subscription_status}</div>
                                </td>
                                <td className="tabular-nums">{ob.due_date}</td>
                                <td className="tabular-nums" style={{ fontSize: '0.775rem' }}>
                                  {ob.period_start} → {ob.period_end}
                                </td>
                                <td>
                                  {ob.invoice_number ? (
                                    <div>
                                      <button
                                        onClick={() => handleViewReceipt(ob.invoice_id)}
                                        style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                                      >
                                        {ob.invoice_number} ↗
                                      </button>
                                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                        ₹{parseFloat(ob.invoice_total || '0').toFixed(2)} ({ob.invoice_status})
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-tertiary)' }}>Pending billing</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge badge-${ob.status}`}>
                                    <span className="badge-dot" /> {ob.status}
                                  </span>
                                </td>
                                <td>
                                  {ob.status === 'failed' || ob.status === 'pending' ? (
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => handleRetryObligation(ob.id)}
                                      disabled={actionLoading}
                                    >
                                      <RotateCw size={12} className={actionLoading ? 'animate-spin' : ''} /> Retry
                                    </button>
                                  ) : ob.invoice_id ? (
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => handleViewReceipt(ob.invoice_id)}
                                    >
                                      Receipt
                                    </button>
                                  ) : (
                                    '-'
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

              {/* Subtab 2: Recovery Console */}
              {assuranceSubtab === 'recovery' && (
                <div className="table-card">
                  <div className="table-toolbar">
                    <div>
                      <h3 style={{ fontSize: '0.925rem', fontWeight: 600 }}>Failure Recovery Queue</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Triage failed billing obligations, inspect failure diagnostics, and execute authorized recovery.
                      </p>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Subscription</th>
                          <th>Cycle Date</th>
                          <th>Attempts</th>
                          <th>Failure Reason / Stack Diagnostic</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {obligations.filter((ob) => ob.status === 'failed').length === 0 ? (
                          <tr>
                            <td colSpan={6} className="empty-state">
                              <CheckCircle2 size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                              <div className="empty-title">Zero Active Billing Failures</div>
                              <div className="empty-description">All billing obligations have reconciled successfully.</div>
                            </td>
                          </tr>
                        ) : (
                          obligations.filter((ob) => ob.status === 'failed').map((ob) => (
                            <tr key={ob.id}>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>#{ob.id.slice(0, 8)}</td>
                              <td>
                                <strong>{ob.subscription_number || ob.subscription_id?.slice(0, 8)}</strong>
                              </td>
                              <td className="tabular-nums">{ob.period_start}</td>
                              <td>
                                <span className="badge badge-failed">{ob.attempt_count} attempts</span>
                              </td>
                              <td style={{ color: 'var(--danger-text)', fontSize: '0.8rem', maxWidth: '320px' }}>
                                {ob.last_error || 'Transient billing worker execution failure'}
                              </td>
                              <td>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleRetryObligation(ob.id)}
                                  disabled={actionLoading}
                                >
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

              {/* Subtab 3: Reliability Testing Center */}
              {assuranceSubtab === 'testing' && (
                <div>
                  <div className="page-header" style={{ marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Reliability Sandbox Scenarios</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Execute controlled reliability scenarios to verify database constraints, recovery mechanisms, and access barriers.
                      </p>
                    </div>
                  </div>

                  <div className="scenario-grid">
                    <div className="scenario-card">
                      <div>
                        <div className="scenario-header">
                          <div className="scenario-icon">
                            <Layers size={18} />
                          </div>
                          <div>
                            <div className="scenario-title">1. Duplicate Scheduler Execution</div>
                            <div className="scenario-desc">
                              Simulates two simultaneous cron jobs firing at the exact same millisecond. Proves row-level locking ensures 0 duplicate invoices.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="scenario-footer">
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Target: Idempotency</span>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleRunScenario('scheduler_duplicate_execution')}
                          disabled={actionLoading}
                        >
                          Execute Scenario
                        </button>
                      </div>
                    </div>

                    <div className="scenario-card">
                      <div>
                        <div className="scenario-header">
                          <div className="scenario-icon" style={{ color: 'var(--danger)' }}>
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <div className="scenario-title">2. Simulate Billing Failure</div>
                            <div className="scenario-desc">
                              Forces a transient timeout error on an active cycle to verify obligation transition to `failed` and alert generation in Recovery Console.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="scenario-footer">
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Target: Recovery Queue</span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRunScenario('simulate_billing_failure')}
                          disabled={actionLoading}
                        >
                          Inject Failure
                        </button>
                      </div>
                    </div>

                    <div className="scenario-card">
                      <div>
                        <div className="scenario-header">
                          <div className="scenario-icon" style={{ color: 'var(--warning)' }}>
                            <Clock size={18} />
                          </div>
                          <div>
                            <div className="scenario-title">3. Delayed Invoice Detection</div>
                            <div className="scenario-desc">
                              Scans the obligation ledger for overdue unbilled cycles and marks them for immediate catch-up invoicing.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="scenario-footer">
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Target: Coverage Audit</span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRunScenario('delayed_invoice_detection')}
                          disabled={actionLoading}
                        >
                          Run Detection
                        </button>
                      </div>
                    </div>

                    <div className="scenario-card">
                      <div>
                        <div className="scenario-header">
                          <div className="scenario-icon" style={{ color: 'var(--info)' }}>
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <div className="scenario-title">4. Customer Authorization Barrier</div>
                            <div className="scenario-desc">
                              Tests API guard rails by invoking privileged billing assurance endpoints using an unauthorized customer session token.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="scenario-footer">
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Target: RBAC Barrier (403)</span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRunScenario('unauthorized_customer_barrier')}
                          disabled={actionLoading}
                        >
                          Verify Barrier
                        </button>
                      </div>
                    </div>
                  </div>

                  {scenarioReport && (
                    <div className="chart-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                        <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                        <h4 style={{ color: 'var(--success-text)', fontSize: '0.925rem' }}>
                          Scenario Execution Result: {scenarioReport.scenario}
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                        {scenarioReport.findings}
                      </p>
                      <div style={{ fontSize: '0.725rem', color: '#15803d' }}>
                        Timestamp: {scenarioReport.executed_at} · Verified and logged to transactional audit trail.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              VIEW: SUBSCRIPTIONS
             ================================================================= */}
          {activeTab === 'subscriptions' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>Subscription Contracts ({subscriptions.length})</h1>
                  <p>Lifecycle state management, pricing schedules, and automated billing generation.</p>
                </div>
                <div className="page-actions">
                  {isCustomer ? (
                    <button className="btn btn-primary" onClick={() => setActiveTab('portal_plans')}>
                      <Plus size={14} /> Subscribe to a Plan
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => setShowNewSubModal(true)}>
                      <Plus size={14} /> New Contract
                    </button>
                  )}
                </div>
              </div>

              <div className="table-card">
                <div className="table-toolbar">
                  <div className="filter-tabs">
                    {['all', 'active', 'paused', 'quotation', 'closed'].map((tab) => (
                      <button
                        key={tab}
                        className={`tab-btn ${subFilterTab === tab ? 'active' : ''}`}
                        onClick={() => setSubFilterTab(tab)}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="table-search">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Filter contracts..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Contract No.</th>
                        <th>Customer</th>
                        <th>Plan</th>
                        <th>Interval</th>
                        <th>Base Price</th>
                        <th>Next Billing</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="empty-state">
                            No subscription contracts found.
                          </td>
                        </tr>
                      ) : (
                        filteredSubscriptions.map((sub) => (
                          <tr key={sub.id}>
                            <td>
                              <strong style={{ fontFamily: 'var(--font-mono)' }}>{sub.number}</strong>
                            </td>
                            <td>
                              <strong>{sub.customer_name}</strong>
                            </td>
                            <td>{sub.plan_name}</td>
                            <td style={{ textTransform: 'capitalize' }}>{sub.interval}</td>
                            <td className="tabular-nums">₹{parseFloat(sub.plan_price || '0').toFixed(2)}</td>
                            <td className="tabular-nums">{sub.next_billing}</td>
                            <td>
                              <span className={`badge badge-${sub.status}`}>
                                <span className="badge-dot" /> {sub.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setViewSubscription(sub)}
                                >
                                  View
                                </button>
                                {sub.status === 'active' && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleStatusTransition(sub.id, 'paused')}
                                    disabled={actionLoading}
                                  >
                                    Pause
                                  </button>
                                )}
                                {sub.status === 'paused' && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleStatusTransition(sub.id, 'active')}
                                    disabled={actionLoading}
                                  >
                                    Resume
                                  </button>
                                )}
                                {(sub.status === 'active' || sub.status === 'paused') && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: 'var(--danger-text)' }}
                                    onClick={() => handleStatusTransition(sub.id, 'closed')}
                                    disabled={actionLoading}
                                  >
                                    Cancel
                                  </button>
                                )}
                                {isStaffOrAdmin && sub.status === 'quotation' && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleStatusTransition(sub.id, 'confirmed')}
                                    disabled={actionLoading}
                                  >
                                    Confirm
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
            </div>
          )}

          {/* =================================================================
              VIEW: INVOICES & PAYMENTS (Finance-Grade Experience)
             ================================================================= */}
          {activeTab === 'invoices' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>Invoices & Payments ({invoices.length})</h1>
                  <p>Billing documentation, transparent calculation receipts, and payment reconciliation.</p>
                </div>
                <div className="page-actions">
                  <button className="btn btn-secondary" onClick={handleExportCSV}>
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="table-card">
                <div className="table-toolbar">
                  <div className="filter-tabs">
                    {['all', 'draft', 'confirmed', 'paid', 'overdue'].map((tab) => (
                      <button
                        key={tab}
                        className={`tab-btn ${invFilterTab === tab ? 'active' : ''}`}
                        onClick={() => setInvFilterTab(tab)}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="table-search">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search invoices..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice No.</th>
                        <th>Customer</th>
                        <th>Cycle Date</th>
                        <th>Due Date</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Balance Due</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="empty-state">
                            No invoices found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td>
                              <strong style={{ fontFamily: 'var(--font-mono)' }}>{inv.number}</strong>
                            </td>
                            <td>
                              <strong>{inv.customer_name}</strong>
                            </td>
                            <td className="tabular-nums">{inv.cycle_date}</td>
                            <td className="tabular-nums">{inv.due_date}</td>
                            <td className="tabular-nums">
                              <strong>₹{parseFloat(inv.total).toFixed(2)}</strong>
                            </td>
                            <td className="tabular-nums" style={{ color: 'var(--success)' }}>
                              ₹{parseFloat(inv.paid || '0').toFixed(2)}
                            </td>
                            <td className="tabular-nums" style={{ color: parseFloat(inv.balance) > 0 ? 'var(--danger-text)' : 'inherit' }}>
                              ₹{parseFloat(inv.balance || '0').toFixed(2)}
                            </td>
                            <td>
                              <span className={`badge badge-${inv.status}`}>
                                <span className="badge-dot" /> {inv.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleViewReceipt(inv.id)}
                                  title="View Calculation Receipt"
                                >
                                  Receipt
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setViewInvoice(inv)}
                                  title="View Invoice Document"
                                >
                                  <FileText size={12} />
                                </button>
                                {isStaffOrAdmin && inv.status === 'draft' && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleConfirmInvoice(inv.id)}
                                    disabled={actionLoading}
                                  >
                                    Confirm
                                  </button>
                                )}
                                {isStaffOrAdmin && (inv.status === 'confirmed' || inv.status === 'partial') && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => {
                                      setPaymentModalInvoice(inv);
                                      setPaymentForm({ ...paymentForm, amount: inv.balance });
                                    }}
                                  >
                                    Pay
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
            </div>
          )}

          {/* =================================================================
              VIEW: CUSTOMERS (CRM-Style Experience)
             ================================================================= */}
          {activeTab === 'customers' && isStaffOrAdmin && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>Customer Directory ({customers.length})</h1>
                  <p>Customer accounts, corporate contacts, revenue contributions, and contract history.</p>
                </div>
                <div className="page-actions">
                  <button className="btn btn-primary" onClick={() => setShowNewCustomerModal(true)}>
                    <Plus size={14} /> Add Customer
                  </button>
                </div>
              </div>

              <div className="table-card">
                <div className="table-toolbar">
                  <div className="table-search">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search by name, company, email..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Email Address</th>
                        <th>Company</th>
                        <th>Active Contracts</th>
                        <th>Total Lifetime Revenue</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            No customer records found.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c) => {
                          const customerSubs = subscriptions.filter((s) => s.customer_id === c.id);
                          const customerInvs = invoices.filter((i) => i.customer_id === c.id && i.status === 'paid');
                          const totalSpend = customerInvs.reduce((acc, curr) => acc + parseFloat(curr.total || '0'), 0);

                          return (
                            <tr key={c.id}>
                              <td>
                                <strong>{c.name}</strong>
                              </td>
                              <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                              <td>{c.company || '-'}</td>
                              <td className="tabular-nums">
                                <span className="badge badge-draft">{customerSubs.length} Contracts</span>
                              </td>
                              <td className="tabular-nums">
                                <strong>₹{totalSpend.toFixed(2)}</strong>
                              </td>
                              <td>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setViewCustomer(c)}
                                >
                                  Customer 360
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW: PRODUCT & PLAN CATALOG
             ================================================================= */}
          {activeTab === 'products' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>Product & Billing Plan Catalog</h1>
                  <p>Configure software offerings, price adjustments, tiers, and billing intervals.</p>
                </div>
                <div className="page-actions">
                  {isStaffOrAdmin && (
                    <>
                      <button className="btn btn-secondary" onClick={() => setShowNewPlanModal(true)}>
                        <Plus size={14} /> New Billing Plan
                      </button>
                      <button className="btn btn-primary" onClick={() => setShowNewProductModal(true)}>
                        <Plus size={14} /> New Product
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Products Table */}
              <div className="table-card" style={{ marginBottom: '1.5rem' }}>
                <div className="table-toolbar">
                  <h3 style={{ fontSize: '0.925rem', fontWeight: 600 }}>Products ({products.length})</h3>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Sales Price</th>
                        <th>Cost Price</th>
                        <th>Configured Variants</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                          </td>
                          <td className="tabular-nums">₹{parseFloat(p.sales_price).toFixed(2)}</td>
                          <td className="tabular-nums">₹{parseFloat(p.cost_price || '0').toFixed(2)}</td>
                          <td>
                            {p.variants?.length ? (
                              p.variants.map((v) => (
                                <span key={v.id} className="badge badge-draft" style={{ marginRight: '0.3rem' }}>
                                  {v.name} (+₹{parseFloat(v.price_extra || '0').toFixed(2)})
                                </span>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Standard</span>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-active">
                              <span className="badge-dot" /> {p.active ? 'Active' : 'Archived'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Plans Table */}
              <div className="table-card">
                <div className="table-toolbar">
                  <h3 style={{ fontSize: '0.925rem', fontWeight: 600 }}>Recurring Billing Plans ({plans.length})</h3>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Plan Name</th>
                        <th>Cadence Interval</th>
                        <th>Base Fee</th>
                        <th>Minimum Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((pl) => (
                        <tr key={pl.id}>
                          <td>
                            <strong>{pl.name}</strong>
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>{pl.interval}</td>
                          <td className="tabular-nums">
                            <strong>₹{parseFloat(pl.price).toFixed(2)}</strong>
                          </td>
                          <td className="tabular-nums">{pl.minimum_quantity} units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW: CUSTOMER PORTAL EXPLORE PLANS (Customer Role)
             ================================================================= */}
          {activeTab === 'portal_plans' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>Available Subscription Plans</h1>
                  <p>Choose an enterprise subscription plan tailored to your business scale.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {plans.map((plan) => (
                  <div key={plan.id} className="chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{plan.name}</h3>
                        <span className="badge badge-confirmed" style={{ textTransform: 'capitalize' }}>
                          {plan.interval}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem' }}>
                        ₹{parseFloat(plan.price).toFixed(2)}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {' '}/ {plan.interval}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                        Enterprise tier with automated recurring billing, itemized calculation receipts, and guaranteed SLA.
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Check size={14} color="var(--success)" /> Minimum {plan.minimum_quantity} license seat(s)
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Check size={14} color="var(--success)" /> Full Billing Assurance Coverage
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Check size={14} color="var(--success)" /> Self-service pause & cancel controls
                        </li>
                      </ul>
                    </div>

                    {products.slice(0, 1).map((prod) => (
                      <button
                        key={prod.id}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => handleCustomerSubscribe(plan.id, prod.id)}
                        disabled={actionLoading}
                      >
                        Subscribe to Plan
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW: REPORTS & ANALYTICS (Stripe/Linear Polish)
             ================================================================= */}
          {activeTab === 'reports' && isStaffOrAdmin && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>Financial Reports & Analytics</h1>
                  <p>Consolidated revenue metrics, collection efficiency, and audit reporting.</p>
                </div>
                <div className="page-actions">
                  <button className="btn btn-primary" onClick={handleExportCSV}>
                    <Download size={14} /> Export Report (CSV)
                  </button>
                </div>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Annual Run Rate</span>
                  </div>
                  <div className="kpi-value tabular-nums">₹{arrValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="kpi-footer">
                    <span className="kpi-subtext">Projected recurring revenue</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Average Revenue / Customer</span>
                  </div>
                  <div className="kpi-value tabular-nums">
                    ₹
                    {(
                      customers.length > 0 ? collectedValue / customers.length : 0
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="kpi-footer">
                    <span className="kpi-subtext">Customer LTV contribution</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Collection Efficiency</span>
                  </div>
                  <div className="kpi-value tabular-nums" style={{ color: 'var(--success)' }}>
                    {collectedValue + outstandingValue > 0
                      ? ((collectedValue / (collectedValue + outstandingValue)) * 100).toFixed(1) + '%'
                      : '100%'}
                  </div>
                  <div className="kpi-footer">
                    <span className="kpi-subtext">Cash collected vs billed</span>
                  </div>
                </div>
              </div>

              <div className="table-card">
                <div className="table-toolbar">
                  <h3 style={{ fontSize: '0.925rem', fontWeight: 600 }}>Historical Collections by Month</h3>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Billing Month</th>
                        <th>Gross Collected Cash</th>
                        <th>Reconciliation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((h, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{h.month}</td>
                          <td className="tabular-nums">
                            <strong>₹{parseFloat(h.amount).toFixed(2)}</strong>
                          </td>
                          <td>
                            <span className="badge badge-paid">
                              <span className="badge-dot" /> 100% Reconciled
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW: TEAM & STAFF (Admin Only)
             ================================================================= */}
          {activeTab === 'team' && isAdmin && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>Team Members & Staff Accounts ({team.length})</h1>
                  <p>Manage operator accounts, credentials, and role assignments.</p>
                </div>
                <div className="page-actions">
                  <button className="btn btn-primary" onClick={() => setShowNewStaffModal(true)}>
                    <Plus size={14} /> Provision Staff
                  </button>
                </div>
              </div>

              <div className="table-card">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Assigned Role</th>
                        <th>Workspace Permission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong>{m.name}</strong>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{m.email}</td>
                          <td>
                            <span className={`badge badge-${m.role}`}>
                              <span className="badge-dot" /> {m.role}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {m.role === 'admin' ? 'Full Organization Control' : 'Billing & Subscriptions Operations'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW: AUDIT LOGS (Admin Only)
             ================================================================= */}
          {activeTab === 'audit' && isAdmin && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>System Audit Trail ({auditLogs.length})</h1>
                  <p>Immutable log of financial events, state transitions, and security operations.</p>
                </div>
              </div>

              <div className="table-card">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Actor</th>
                        <th>Action</th>
                        <th>Target Entity</th>
                        <th>Event Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="empty-state">
                            No audit events logged yet.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {log.created_at?.slice(0, 19).replace('T', ' ')}
                            </td>
                            <td>
                              <strong>{log.user_name || 'System Engine'}</strong>
                            </td>
                            <td>
                              <span className="badge badge-active">{log.action}</span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                              {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 6)})` : ''}
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW: SETTINGS
             ================================================================= */}
          {activeTab === 'settings' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h1>Workspace Settings & Configuration</h1>
                  <p>Global parameters, currency standards, and billing engine guarantees.</p>
                </div>
              </div>

              <div className="chart-grid">
                <div className="chart-card">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Organization Profile</h3>
                  <div className="form-group">
                    <label className="form-label">Organization Legal Name</label>
                    <input className="form-input" value="Acme Systems Inc" readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Accounting Currency</label>
                    <input className="form-input" value="INR (₹) — Indian Rupee" readOnly />
                    <span className="form-hint">Financial math calculates via Python Decimal with ROUND_HALF_UP precision.</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timezone & Anchor Standard</label>
                    <input className="form-input" value="UTC / Calendar-Day Preservation" readOnly />
                  </div>
                </div>

                <div className="chart-card">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Billing Engine Integrity</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Idempotency Enforcement</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unique index on subscription & cycle dates</div>
                      </div>
                      <span className="badge badge-active">Active</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Row-Level Concurrency Locks</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SELECT FOR UPDATE serializes writes</div>
                      </div>
                      <span className="badge badge-active">Active</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Audit Trail Recording</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immutable log of all financial events</div>
                      </div>
                      <span className="badge badge-active">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          MODAL: CALCULATION RECEIPT (Feature 4.B Differentiator)
         ===================================================================== */}
      {activeReceipt && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-lg">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                <span className="modal-title">Transparent Calculation Receipt</span>
              </div>
              <button onClick={() => setActiveReceipt(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="receipt-container">
                <div className="receipt-header">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Invoice Number
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>{activeReceipt.invoice_number}</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Customer: {activeReceipt.customer_name}</div>
                  </div>
                  <div>
                    <span className="receipt-badge-reconciled">
                      <CheckCircle2 size={14} /> Mathematically Reconciled
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                      Cycle Date: {activeReceipt.cycle_date}
                    </div>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReceipt.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.description}</td>
                          <td className="tabular-nums">{it.quantity}</td>
                          <td className="tabular-nums">₹{parseFloat(it.unit_price).toFixed(2)}</td>
                          <td className="tabular-nums">
                            <strong>₹{parseFloat(it.line_total).toFixed(2)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="receipt-summary-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span>Base Plan Subtotal:</span>
                    <span className="tabular-nums font-semibold">₹{parseFloat(activeReceipt.subtotal).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span>Tax Assessment ({activeReceipt.tax_rate}% GST):</span>
                    <span className="tabular-nums font-semibold">₹{parseFloat(activeReceipt.tax).toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-default)',
                      paddingTop: '0.5rem',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>Final Amount:</span>
                    <span className="tabular-nums" style={{ color: 'var(--primary)' }}>
                      ₹{parseFloat(activeReceipt.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="receipt-formula">
                  <strong>Reconciliation Formula: </strong>
                  {activeReceipt.reconciliation_formula}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveReceipt(null)}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: INVOICE VOUCHER PREVIEW
         ===================================================================== */}
      {viewInvoice && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-lg">
            <div className="modal-header">
              <span className="modal-title">Tax Invoice Voucher #{viewInvoice.number}</span>
              <button onClick={() => setViewInvoice(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ fontWeight: 700 }}>Brightloop Technologies Ltd</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Corporate GSTIN: 29AAAAA0000A1Z5</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invoice Date: {viewInvoice.cycle_date}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Due Date: {viewInvoice.due_date}</div>
                  <span className={`badge badge-${viewInvoice.status}`} style={{ marginTop: '0.25rem' }}>
                    {viewInvoice.status}
                  </span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Billed To</div>
                <div style={{ fontWeight: 600 }}>{viewInvoice.customer_name}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border-default)', fontSize: '0.9rem' }}>
                <span>Total Invoiced:</span>
                <strong className="tabular-nums">₹{parseFloat(viewInvoice.total).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.9rem', color: 'var(--success)' }}>
                <span>Amount Paid:</span>
                <span className="tabular-nums">₹{parseFloat(viewInvoice.paid || '0').toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '1.05rem', fontWeight: 700, borderTop: '1px solid var(--border-default)' }}>
                <span>Net Balance Due:</span>
                <span className="tabular-nums" style={{ color: parseFloat(viewInvoice.balance) > 0 ? 'var(--danger-text)' : 'inherit' }}>
                  ₹{parseFloat(viewInvoice.balance || '0').toFixed(2)}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => handleViewReceipt(viewInvoice.id)}>
                View Math Receipt
              </button>
              <button className="btn btn-secondary" onClick={() => setViewInvoice(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CUSTOMER 360 DRAWER
         ===================================================================== */}
      {viewCustomer && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-lg">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--primary)" />
                <span className="modal-title">Customer 360: {viewCustomer.name}</span>
              </div>
              <button onClick={() => setViewCustomer(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="kpi-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="kpi-card">
                  <span className="kpi-label">Email Address</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{viewCustomer.email}</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Corporate Account</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{viewCustomer.company || 'Individual Account'}</div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Associated Contracts</h4>
              <div className="table-wrapper" style={{ marginBottom: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Plan</th>
                      <th>Interval</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.filter((s) => s.customer_id === viewCustomer.id).map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{sub.number}</td>
                        <td>{sub.plan_name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{sub.interval}</td>
                        <td>
                          <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: SUBSCRIPTION LIFECYCLE DRAWER
         ===================================================================== */}
      {viewSubscription && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Contract #{viewSubscription.number}</span>
              <button onClick={() => setViewSubscription(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer</div>
                <div style={{ fontWeight: 600 }}>{viewSubscription.customer_name}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plan Cadence</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{viewSubscription.interval}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contract Status</div>
                  <span className={`badge badge-${viewSubscription.status}`}>{viewSubscription.status}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Base Price</div>
                  <div style={{ fontWeight: 600 }} className="tabular-nums">₹{parseFloat(viewSubscription.plan_price).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next Billing Renewal</div>
                  <div style={{ fontWeight: 600 }} className="tabular-nums">{viewSubscription.next_billing}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                {viewSubscription.status === 'active' && (
                  <button className="btn btn-secondary" onClick={() => handleStatusTransition(viewSubscription.id, 'paused')}>
                    <Pause size={14} /> Pause Contract
                  </button>
                )}
                {viewSubscription.status === 'paused' && (
                  <button className="btn btn-primary" onClick={() => handleStatusTransition(viewSubscription.id, 'active')}>
                    <Play size={14} /> Resume Contract
                  </button>
                )}
                {(viewSubscription.status === 'active' || viewSubscription.status === 'paused') && (
                  <button className="btn btn-danger" onClick={() => handleStatusTransition(viewSubscription.id, 'closed')}>
                    Cancel Contract
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: RECORD PAYMENT
         ===================================================================== */}
      {paymentModalInvoice && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Record Payment · #{paymentModalInvoice.number}</span>
              <button onClick={() => setPaymentModalInvoice(null)}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    max={paymentModalInvoice.balance}
                    required
                  />
                  <span className="form-hint">Maximum outstanding balance: ₹{paymentModalInvoice.balance}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method *</label>
                  <select
                    className="form-input"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  >
                    <option value="bank_transfer">Electronic Bank Transfer (NEFT/RTGS)</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="cash">Direct Cash Clearing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Accounting Reference / Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bank Ref #TXN87291"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPaymentModalInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NEW SUBSCRIPTION (Staff/Admin)
         ===================================================================== */}
      {showNewSubModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Create New Subscription Contract</span>
              <button onClick={() => setShowNewSubModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubscription}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Customer *</label>
                  <select
                    className="form-input"
                    value={newSubForm.customer_id}
                    onChange={(e) => setNewSubForm({ ...newSubForm, customer_id: e.target.value })}
                    required
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Billing Plan *</label>
                  <select
                    className="form-input"
                    value={newSubForm.plan_id}
                    onChange={(e) => setNewSubForm({ ...newSubForm, plan_id: e.target.value })}
                    required
                  >
                    <option value="">Choose a plan...</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.price} / {p.interval}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Product Line *</label>
                  <select
                    className="form-input"
                    value={newSubForm.product_id}
                    onChange={(e) => setNewSubForm({ ...newSubForm, product_id: e.target.value })}
                    required
                  >
                    <option value="">Choose a product...</option>
                    {products.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name} (₹{pr.sales_price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity (Units / Licenses) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={newSubForm.quantity}
                    onChange={(e) => setNewSubForm({ ...newSubForm, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewSubModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NEW CUSTOMER
         ===================================================================== */}
      {showNewCustomerModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Add Customer Account</span>
              <button onClick={() => setShowNewCustomerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewCustomerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NEW PRODUCT
         ===================================================================== */}
      {showNewProductModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Create Product Offering</span>
              <button onClick={() => setShowNewProductModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sales Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={productForm.sales_price}
                    onChange={(e) => setProductForm({ ...productForm, sales_price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NEW BILLING PLAN
         ===================================================================== */}
      {showNewPlanModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Create Recurring Plan</span>
              <button onClick={() => setShowNewPlanModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePlan}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Plan Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Interval Cadence *</label>
                  <select
                    className="form-input"
                    value={planForm.interval}
                    onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Base Fee Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={planForm.minimum_quantity}
                    onChange={(e) => setPlanForm({ ...planForm, minimum_quantity: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewPlanModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NEW STAFF ACCOUNT
         ===================================================================== */}
      {showNewStaffModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Provision Staff Member</span>
              <button onClick={() => setShowNewStaffModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateStaff}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Staff Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Staff Corporate Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Initial Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    required
                  />
                  <span className="form-hint">At least 8 chars, 1 uppercase, 1 digit, 1 special character.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewStaffModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
