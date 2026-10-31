import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import {
  ShieldCheck,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  Lock,
  Database,
  ExternalLink,
  Play,
  Pause as PauseIcon,
  Check,
  XCircle,
  Activity,
  DollarSign,
  Users
} from 'lucide-react';

export default function LandingPage({ onLaunchApp, onDemoLogin }) {
  // Signature Animation: "The Billing Loop" State
  const [activeLoopStep, setActiveLoopStep] = useState(0);
  const [isPlayingLoop, setIsPlayingLoop] = useState(true);
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Showcase Active Tab
  const [showcaseTab, setShowcaseTab] = useState('dashboard');

  // Loop Step Definitions
  const loopSteps = [
    {
      step: '01',
      title: 'Subscription Creation',
      tag: 'CONTRACT INITIALIZED',
      desc: 'Customer selects an enterprise plan with product variants. The subscription engine snapshots pricing, applies calendar-day anchor rules (preserving month-end dates), and enters active state.',
      recordType: 'SUBSCRIPTION_CONTRACT',
      id: 'SUB-2026-904',
      status: 'active',
      details: {
        Customer: 'Acme Cloud Systems Ltd',
        Plan: 'Growth Annual (₹48,000 / yr)',
        'Billing Anchor': 'Day 31 (Leap-year preserved)',
        Quantity: '5 Dedicated Seats',
      },
    },
    {
      step: '02',
      title: 'Obligation Generation',
      tag: 'AUDITED CYCLE SCHEDULED',
      desc: 'The billing engine generates a tracked BillingObligation ledger record. Database constraints uniquely index (subscription_id, period_start, period_end), guaranteeing exactly one invoice per cycle.',
      recordType: 'BILLING_OBLIGATION',
      id: 'OBL-2026-0881',
      status: simulateFailure ? 'failed' : 'pending',
      details: {
        Cycle: '2026-11-01 → 2026-11-30',
        'Due Date': '2026-11-01 (Due Today)',
        Constraint: 'uq_obligation_period Active',
        'State Machine': simulateFailure ? 'Failed (Worker Timeout)' : 'Pending Automated Execution',
      },
    },
    {
      step: '03',
      title: 'Deterministic Invoicing',
      tag: 'SHARED CALCULATION CORE',
      desc: 'The background billing scheduler executes within row-level locks. It computes base plan fee + variant adjustments + line items + 18% GST using Python Decimal precision and half-up rounding.',
      recordType: 'TAX_INVOICE',
      id: simulateFailure ? 'GENERATION_BLOCKED' : 'INV-2026-0142',
      status: simulateFailure ? 'error' : 'confirmed',
      details: {
        'Base Subtotal': simulateFailure ? 'N/A' : '₹4,000.00',
        'GST (18%)': simulateFailure ? 'N/A' : '₹720.00',
        'Total Due': simulateFailure ? 'N/A' : '₹4,720.00',
        'Overpayment Protection': 'Strict SQL Balance Lock',
      },
    },
    {
      step: '04',
      title: 'Assurance Verification',
      tag: 'COVERAGE AUDIT PASS',
      desc: 'The Coverage Monitor audits total expected obligations versus successfully invoiced cycles. It mathematically checks that subtotal + tax equals total and guarantees 0 duplicate attempts.',
      recordType: 'ASSURANCE_RECEIPT',
      id: simulateFailure ? 'ANOMALY_FLAGGED' : 'RCPT-INV-0142',
      status: simulateFailure ? 'delayed' : 'reconciled',
      details: {
        'Billing Coverage': simulateFailure ? '94.2% (1 Missing)' : '100.0% Verified',
        Duplicates: '0 Duplicates Prevented',
        Reconciliation: simulateFailure ? 'Unfulfilled Obligation' : 'subtotal + tax == total (Verified)',
        Audit: 'Transactional AuditLog Recorded',
      },
    },
    {
      step: '05',
      title: simulateFailure ? 'Recovery & Retry' : 'Payment Reconciliation',
      tag: simulateFailure ? 'RECOVERY CONSOLE ACTION' : 'CASH RECONCILED',
      desc: simulateFailure
        ? 'The Recovery Console isolates the failed obligation, reveals the timeout cause, and executes an authorized idempotent retry to restore 100% billing coverage.'
        : 'Payment is matched against the confirmed invoice. Partial and full payments reconcile immediately, updating outstanding balance and posting to customer history.',
      recordType: simulateFailure ? 'RECOVERY_EVENT' : 'PAYMENT_RECORD',
      id: simulateFailure ? 'REC-OBL-0881' : 'PAY-2026-7819',
      status: 'active',
      details: {
        Action: simulateFailure ? 'Retry Obligation Executed' : 'Bank Transfer Cleared',
        Amount: '₹4,720.00',
        'Balance Due': '₹0.00 (Fully Paid)',
        Resolution: simulateFailure ? 'Cycle Recovered & Invoiced' : 'Payment Reconciled in Ledger',
      },
    },
  ];

  // Auto-play the loop sequence if enabled
  useEffect(() => {
    if (!isPlayingLoop) return;
    const timer = setInterval(() => {
      setActiveLoopStep((prev) => (prev + 1) % loopSteps.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [isPlayingLoop, loopSteps.length]);

  const currentStage = loopSteps[activeLoopStep];

  return (
    <div className="landing-root">
      {/* =====================================================================
          NAVIGATION BAR
         ===================================================================== */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="brand-emblem">✦</div>
            <span className="brand-wordmark">Brightloop</span>
          </div>

          <div className="nav-links">
            <a href="#problem" className="nav-link">The Problem</a>
            <a href="#loop" className="nav-link">The Billing Loop</a>
            <a href="#assurance" className="nav-link">Assurance Engine</a>
            <a href="#showcase" className="nav-link">Product Showcase</a>
            <a href="#architecture" className="nav-link">Security & DB</a>
          </div>

          <div className="nav-actions">
            <button className="btn-landing-ghost" onClick={() => onDemoLogin('admin')}>
              Sign In
            </button>
            <button className="btn-landing-primary" onClick={onLaunchApp}>
              Explore the platform <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* =====================================================================
          HERO SECTION
         ===================================================================== */}
      <section className="hero-section">
        <div className="hero-tagline-pill">
          <Sparkles size={13} />
          <span>The Subscription & Revenue Intelligence Platform</span>
        </div>

        <h1 className="hero-heading">
          Revenue moves in cycles.<br />
          <span className="hero-heading-gradient">Make every one count.</span>
        </h1>

        <p className="hero-description">
          Brightloop connects subscriptions, recurring billing and revenue assurance —
          so every expected charge is accounted for, mathematically reconciled, and protected against silent leaks.
        </p>

        <div className="hero-cta-group">
          <button className="btn-landing-primary" style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }} onClick={onLaunchApp}>
            Explore the platform <ArrowRight size={16} />
          </button>
          <button
            className="btn-landing-ghost"
            style={{ border: '1px solid var(--landing-dark-border)', padding: '0.75rem 1.4rem', fontSize: '0.95rem' }}
            onClick={() => onDemoLogin('admin')}
          >
            Launch Demo Workspace
          </button>
        </div>

        <div className="hero-badge-strip">
          <div className="hero-badge-item">
            <CheckCircle2 size={15} color="var(--landing-accent-cyan)" />
            <span>Zero Duplicate Invoices Guaranteed</span>
          </div>
          <div className="hero-badge-item">
            <ShieldCheck size={15} color="var(--landing-accent-cyan)" />
            <span>Database Idempotency Constraints</span>
          </div>
          <div className="hero-badge-item">
            <FileText size={15} color="var(--landing-accent-cyan)" />
            <span>Transparent Calculation Receipts</span>
          </div>
          <div className="hero-badge-item">
            <Lock size={15} color="var(--landing-accent-cyan)" />
            <span>PostgreSQL Row-Level Concurrency</span>
          </div>
        </div>

        {/* ===================================================================
            SIGNATURE ANIMATION: "THE BILLING LOOP"
           =================================================================== */}
        <div id="loop" className="billing-loop-container">
          <div className="loop-header-bar">
            <div className="loop-title-meta">
              <span style={{ color: 'var(--landing-accent-cyan)', fontFamily: 'var(--font-mono)' }}>THE BILLING LOOP</span>
              <span style={{ color: '#475569' }}>/</span>
              <span>Continuous Revenue Assurance Lifecycle</span>
            </div>

            <div className="loop-controls">
              <button
                className={`loop-control-btn ${simulateFailure ? 'active' : ''}`}
                onClick={() => setSimulateFailure(!simulateFailure)}
                title="Inject a simulated failure to see detection & recovery in action"
              >
                {simulateFailure ? 'Failure Injected (Active)' : 'Simulate Failure & Recovery'}
              </button>
              <button
                className="loop-control-btn"
                onClick={() => setIsPlayingLoop(!isPlayingLoop)}
                title={isPlayingLoop ? 'Pause auto-play' : 'Resume auto-play'}
              >
                {isPlayingLoop ? <PauseIcon size={12} /> : <Play size={12} />}
              </button>
            </div>
          </div>

          {/* Stepper Track */}
          <div className="loop-stepper-track">
            {loopSteps.map((s, idx) => (
              <button
                key={idx}
                className={`stepper-stage-btn ${activeLoopStep === idx ? 'active' : ''}`}
                onClick={() => {
                  setActiveLoopStep(idx);
                  setIsPlayingLoop(false);
                }}
              >
                <div className="stepper-step-num">{s.step}</div>
                <div className="stepper-step-name">{s.title}</div>
              </button>
            ))}
          </div>

          {/* Stage Details Body */}
          <div className="loop-stage-body">
            <div className="stage-explanation">
              <span className="editorial-label" style={{ fontSize: '0.7rem' }}>
                {currentStage.tag}
              </span>
              <h3>{currentStage.title}</h3>
              <p>{currentStage.desc}</p>

              <div className="stage-meta-tags">
                <div className="stage-tag-row">
                  <CheckCircle2 size={14} color="var(--landing-accent-cyan)" />
                  <span>Enforced at database layer, not client side</span>
                </div>
                <div className="stage-tag-row">
                  <Database size={14} color="var(--landing-accent-cyan)" />
                  <span>Transactional write with SELECT FOR UPDATE locks</span>
                </div>
              </div>
            </div>

            {/* Live Visualizer Card */}
            <div className="stage-live-card">
              <div className="card-terminal-bar">
                <span>ENTITY: {currentStage.recordType}</span>
                <span style={{ color: currentStage.status === 'failed' || currentStage.status === 'error' ? '#f87171' : '#34d399' }}>
                  ● {currentStage.status.toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>RECORD IDENTIFIER</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  {currentStage.id}
                </div>
              </div>

              <div>
                {Object.entries(currentStage.details).map(([key, val]) => (
                  <div key={key} className="card-key-val">
                    <span style={{ color: '#94a3b8' }}>{key}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#e2e8f0' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 1: THE PROBLEM — RECURRING BILLING HAS HIDDEN GAPS
         ===================================================================== */}
      <section id="problem" className="editorial-section">
        <div className="editorial-header">
          <span className="editorial-label">The Operational Vulnerability</span>
          <h2 className="editorial-title">
            Traditional recurring billing runs on blind faith.
          </h2>
          <p style={{ color: 'var(--landing-text-muted)', fontSize: '1.05rem', marginTop: '1rem', maxWidth: '640px' }}>
            Cron jobs crash, webhooks fail silently, and spreadsheets drift out of sync.
            Without an obligation ledger, finance teams discover billing gaps weeks after the cycle has closed.
          </p>
        </div>

        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-stat problem-stat-red">4.8%</div>
            <div className="problem-title">Silent Revenue Leaks</div>
            <div className="problem-desc">
              Annual recurring revenue lost due to unbilled renew cycles, worker dropouts, and missed scheduler executions that never trigger an alert.
            </div>
          </div>

          <div className="problem-card">
            <div className="problem-stat">0</div>
            <div className="problem-title">Duplicate Protection Guarantee</div>
            <div className="problem-desc">
              Retried jobs and simultaneous webhook deliveries generate duplicate charges. Brightloop binds every cycle to compound database constraints.
            </div>
          </div>

          <div className="problem-card">
            <div className="problem-stat">100%</div>
            <div className="problem-title">Transparent Math Receipts</div>
            <div className="problem-desc">
              Opaque customer invoices create friction. Every Brightloop invoice includes an itemized Calculation Receipt with proven mathematical reconciliation.
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="comparison-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Standard Invoicing Scripts</th>
                <th>Brightloop Assurance Engine</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="comparison-feature-name">Cycle Tracking</td>
                <td className="comparison-bad"><XCircle size={14} color="#f87171" /> In-memory flags & loose timestamps</td>
                <td className="comparison-good"><CheckCircle2 size={14} color="#34d399" /> Obligation Ledger (Pending, Invoiced, Failed)</td>
              </tr>
              <tr>
                <td className="comparison-feature-name">Duplicate Prevention</td>
                <td className="comparison-bad"><XCircle size={14} color="#f87171" /> Redis lock or hope</td>
                <td className="comparison-good"><CheckCircle2 size={14} color="#34d399" /> Compound DB unique constraint (uq_obligation_period)</td>
              </tr>
              <tr>
                <td className="comparison-feature-name">Missed Scheduler Recovery</td>
                <td className="comparison-bad"><XCircle size={14} color="#f87171" /> Cycle skipped or billed in lumped bulk</td>
                <td className="comparison-good"><CheckCircle2 size={14} color="#34d399" /> Sequential historical catch-up</td>
              </tr>
              <tr>
                <td className="comparison-feature-name">Calculation Proof</td>
                <td className="comparison-bad"><XCircle size={14} color="#f87171" /> Single opaque total line</td>
                <td className="comparison-good"><CheckCircle2 size={14} color="#34d399" /> Itemized calculation receipt (subtotal + tax = total)</td>
              </tr>
              <tr>
                <td className="comparison-feature-name">Failure Triage</td>
                <td className="comparison-bad"><XCircle size={14} color="#f87171" /> Silent failure in log files</td>
                <td className="comparison-good"><CheckCircle2 size={14} color="#34d399" /> Dedicated Recovery Console with safe retry</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: PRODUCT SHOWCASE (INTERACTIVE SCREEN VIEWS)
         ===================================================================== */}
      <section id="showcase" className="editorial-section" style={{ paddingTop: '2rem' }}>
        <div className="editorial-header">
          <span className="editorial-label">Product Showcase</span>
          <h2 className="editorial-title">
            Engineered for finance, operations, and customers.
          </h2>
        </div>

        <div className="showcase-wrapper">
          <div className="showcase-tabs-bar">
            <button
              className={`showcase-tab-btn ${showcaseTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setShowcaseTab('dashboard')}
            >
              <TrendingUp size={16} /> Revenue Intelligence
            </button>
            <button
              className={`showcase-tab-btn ${showcaseTab === 'assurance' ? 'active' : ''}`}
              onClick={() => setShowcaseTab('assurance')}
            >
              <ShieldCheck size={16} /> Coverage Monitor
            </button>
            <button
              className={`showcase-tab-btn ${showcaseTab === 'recovery' ? 'active' : ''}`}
              onClick={() => setShowcaseTab('recovery')}
            >
              <RotateCw size={16} /> Recovery Console
            </button>
            <button
              className={`showcase-tab-btn ${showcaseTab === 'receipt' ? 'active' : ''}`}
              onClick={() => setShowcaseTab('receipt')}
            >
              <FileText size={16} /> Calculation Receipt
            </button>
            <button
              className={`showcase-tab-btn ${showcaseTab === 'portal' ? 'active' : ''}`}
              onClick={() => setShowcaseTab('portal')}
            >
              <Users size={16} /> Customer Portal
            </button>
          </div>

          <div className="showcase-body">
            {showcaseTab === 'dashboard' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
                    Real-time MRR, ARR, and cash collection intelligence.
                  </h3>
                  <p style={{ color: 'var(--landing-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Calculate recurring revenue metrics directly from saved database contracts, not estimate guesses.
                    Track collections by month, monitor overdue invoices, and gauge portfolio health with instant accuracy.
                  </p>
                  <button className="btn-landing-primary" onClick={onLaunchApp}>
                    Open Live Dashboard <ArrowRight size={14} />
                  </button>
                </div>

                <div className="showcase-preview-frame" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>MONTHLY RECURRING REVENUE</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>₹1,48,200.00</div>
                    </div>
                    <span style={{ background: '#ecfdf5', color: '#065f46', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, height: 'fit-content' }}>
                      +14.2% YoY
                    </span>
                  </div>
                  <div style={{ height: '100px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'flex-end', gap: '0.75rem', padding: '0.75rem' }}>
                    <div style={{ width: '16%', height: '40%', background: '#3b82f6', borderRadius: '3px' }}></div>
                    <div style={{ width: '16%', height: '55%', background: '#3b82f6', borderRadius: '3px' }}></div>
                    <div style={{ width: '16%', height: '65%', background: '#3b82f6', borderRadius: '3px' }}></div>
                    <div style={{ width: '16%', height: '78%', background: '#3b82f6', borderRadius: '3px' }}></div>
                    <div style={{ width: '16%', height: '88%', background: '#3b82f6', borderRadius: '3px' }}></div>
                    <div style={{ width: '16%', height: '100%', background: '#2563eb', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>
            )}

            {showcaseTab === 'assurance' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
                    Continuous billing coverage and duplicate prevention.
                  </h3>
                  <p style={{ color: 'var(--landing-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    The Coverage Monitor benchmarks expected billing obligations against actual generated invoices in real time.
                    Instantly identify missing, delayed, or unbilled subscriptions before customers ever notice.
                  </p>
                  <button className="btn-landing-primary" onClick={onLaunchApp}>
                    Inspect Coverage Ledger <ArrowRight size={14} />
                  </button>
                </div>

                <div className="showcase-preview-frame" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.675rem', color: '#64748b' }}>TOTAL EXPECTED</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>142 Cycles</div>
                    </div>
                    <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.675rem', color: '#065f46' }}>COVERAGE RATE</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>100.0%</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} color="#059669" /> Zero duplicate attempts allowed
                  </div>
                </div>
              </div>
            )}

            {showcaseTab === 'recovery' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
                    Operational triage with one-click safe retry.
                  </h3>
                  <p style={{ color: 'var(--landing-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    When a payment gateway or worker execution fails, the Recovery Console isolates the obligation, records the diagnostic reason, and enables authorized operators to safely retry without duplicate risk.
                  </p>
                  <button className="btn-landing-primary" onClick={onLaunchApp}>
                    Open Recovery Console <ArrowRight size={14} />
                  </button>
                </div>

                <div className="showcase-preview-frame" style={{ padding: '1.25rem' }}>
                  <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>FAILED OBLIGATION #OBL-0881</div>
                    <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>Upstream API Gateway Timeout</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Attempt 1 of 3</span>
                    <span style={{ background: '#2563eb', color: '#ffffff', padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Retry Safe
                    </span>
                  </div>
                </div>
              </div>
            )}

            {showcaseTab === 'receipt' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
                    Mathematical proof behind every single rupee.
                  </h3>
                  <p style={{ color: 'var(--landing-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Eliminate customer billing disputes. Brightloop computes a line-item Calculation Receipt for every invoice, itemizing plan base fees, variant adjustments, and tax rounding with verifiable reconciliation.
                  </p>
                  <button className="btn-landing-primary" onClick={onLaunchApp}>
                    View Sample Receipt <ArrowRight size={14} />
                  </button>
                </div>

                <div className="showcase-preview-frame" style={{ padding: '1.25rem', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                    <span>INV-2026-0142</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>✓ RECONCILED</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', margin: '0.25rem 0' }}>
                    <span>Base Plan (Scale Annual)</span>
                    <span>₹40,000.00</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', margin: '0.25rem 0' }}>
                    <span>GST Assessment (18.0%)</span>
                    <span>₹7,200.00</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0f172a', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span>Total Verified</span>
                    <span>₹47,200.00</span>
                  </div>
                </div>
              </div>
            )}

            {showcaseTab === 'portal' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
                    Clean self-service portal for your subscribers.
                  </h3>
                  <p style={{ color: 'var(--landing-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Give customers immediate access to explore available plans, self-subscribe, review invoices, inspect calculation receipts, and manage pauses or cancellations without manual support tickets.
                  </p>
                  <button className="btn-landing-primary" onClick={() => onDemoLogin('customer')}>
                    Try Customer Portal <ArrowRight size={14} />
                  </button>
                </div>

                <div className="showcase-preview-frame" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CUSTOMER PORTAL</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Growth Plan (Active)</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ background: '#f1f5f9', color: '#0f172a', padding: '0.3rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Pause Contract
                    </span>
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.3rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      View Receipt ↗
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: ARCHITECTURE & DATABASE INTEGRITY
         ===================================================================== */}
      <section id="architecture" className="editorial-section">
        <div className="editorial-header">
          <span className="editorial-label">Financial Engineering</span>
          <h2 className="editorial-title">
            Built on ACID transactions and compound uniqueness constraints.
          </h2>
        </div>

        <div className="architecture-grid">
          <div className="arch-card">
            <div>
              <div className="arch-header">
                <div className="arch-icon"><Database size={20} /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Strict Idempotency Constraints</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--landing-text-muted)', lineHeight: 1.6 }}>
                Every billing cycle is guaranteed unique at the PostgreSQL schema layer. Concurrent scheduler runs or duplicate webhook events collide on the unique index and abort cleanly with 0 duplicate invoices.
              </p>
            </div>
            <div className="arch-code-snippet">
              {`Index('uq_obligation_period', 'subscription_id', 'period_start', 'period_end', unique=True)`}
            </div>
          </div>

          <div className="arch-card">
            <div>
              <div className="arch-header">
                <div className="arch-icon"><Lock size={20} /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Row-Level Concurrency Locks</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--landing-text-muted)', lineHeight: 1.6 }}>
                Financial writes serialize through PostgreSQL SELECT FOR UPDATE locks. Overpayments are mathematically rejected before commit, ensuring the invoice balance never drops below zero.
              </p>
            </div>
            <div className="arch-code-snippet">
              {`s.execute(select(Invoice).where(Invoice.id == id).with_for_update())`}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CLOSING CTA & FOOTER
         ===================================================================== */}
      <section className="closing-cta-section">
        <h2 className="closing-title">Stop spreadsheet reconciliation.<br />Protect every cycle.</h2>
        <p className="closing-desc">
          Experience how Brightloop guarantees recurring billing coverage and gives your organization total revenue clarity.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-landing-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }} onClick={onLaunchApp}>
            Explore the platform <ArrowRight size={16} />
          </button>
          <button
            className="btn-landing-ghost"
            style={{ border: '1px solid var(--landing-dark-border)', padding: '0.85rem 1.75rem', fontSize: '1rem' }}
            onClick={() => onDemoLogin('admin')}
          >
            Launch Live Demo
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-emblem" style={{ width: 22, height: 22, fontSize: '0.75rem' }}>✦</div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Brightloop</span>
          </div>

          <div className="footer-copy">
            © 2026 Brightloop Inc. All rights reserved. Subscription & Revenue Intelligence Platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
