import React, { useState } from 'react';
import { Building2, Shield, BarChart2, Users, CheckCircle2, Mail } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import { submitEnterpriseInquiry } from '../services/api.js';

const PLANS = [
  {
    name: 'Team',
    price: '$49/mo',
    desc: 'For gyms, fitness studios, and small teams',
    color: 'var(--secondary)',
    features: ['Up to 25 users', 'Team nutrition dashboard', 'Bulk scan reports', 'Priority support'],
  },
  {
    name: 'Corporate',
    price: '$199/mo',
    desc: 'For companies running wellness programs',
    color: 'var(--primary)',
    features: ['Unlimited users', 'HR dashboard', 'Anonymous health insights', 'Custom branding', 'API access'],
    highlight: true,
  },
  {
    name: 'Insurance',
    price: 'Custom',
    desc: 'For health insurers and healthcare providers',
    color: 'var(--tertiary)',
    features: ['Population health data', 'Risk stratification', 'HIPAA compliance', 'White-label', 'Dedicated support'],
  },
];

export default function EnterprisePage() {
  const [submitted, setSubmitted] = useState(false);
  const [email,     setEmail]     = useState('');
  const [company,   setCompany]   = useState('');
  const [plan,      setPlan]      = useState('Corporate');

  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await submitEnterpriseInquiry({ email, company, plan });
      setSubmitted(true);
    } catch {
      alert("Failed to submit inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar showBack title="Enterprise" showSettings={false} />
      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">Enterprise & Insurance</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Nutrition intelligence at scale — for teams, companies, and healthcare providers
          </p>
        </div>

        {/* Value props */}
        <div className="anim-fade-up stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)' }}>
          {[
            { icon: BarChart2, label: 'Population Insights',  desc: 'Aggregate nutrition trends across your users',    color: 'var(--primary)' },
            { icon: Shield,    label: 'Risk Intelligence',    desc: 'Identify high-risk eating patterns early',         color: 'var(--error)' },
            { icon: Users,     label: 'Team Dashboards',      desc: 'Monitor team nutrition and wellness goals',        color: 'var(--secondary)' },
            { icon: Building2, label: 'White Label',          desc: 'Your brand, our AI — fully customizable',          color: 'var(--tertiary)' },
          ].map(({ icon: Icon, label, desc, color }) => (
            <GlassCard key={label} padding="p-4">
              <Icon size={18} color={color} style={{ marginBottom: 'var(--sp-2)' }} />
              <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
              <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Plans */}
        <div className="anim-fade-up stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <p className="text-label-md" style={{ color: 'var(--on-surface-muted)' }}>PLANS</p>
          {PLANS.map(p => (
            <GlassCard key={p.name} padding="p-5" style={{ borderColor: plan === p.name ? `${p.color}50` : 'var(--glass-border)', cursor: 'pointer', boxShadow: plan === p.name ? `0 0 12px ${p.color}30` : 'none' }} onClick={() => setPlan(p.name)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                <div>
                  <p className="text-title" style={{ color: p.highlight ? p.color : 'var(--on-surface)' }}>{p.name}</p>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 2 }}>{p.desc}</p>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: p.color }}>{p.price}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <CheckCircle2 size={12} color={p.color} />
                    <span className="text-body-sm" style={{ color: 'var(--on-surface-muted)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Contact form */}
        {!submitted ? (
          <GlassCard className="anim-fade-up stagger-4" style={{ borderColor: 'rgba(0,230,57,0.2)' }}>
            <p className="text-label-md" style={{ color: 'var(--primary)', marginBottom: 'var(--sp-4)' }}>GET IN TOUCH</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {[
                { label: 'Work Email', value: email, set: setEmail, placeholder: 'you@company.com', type: 'email' },
                { label: 'Company Name', value: company, set: setCompany, placeholder: 'Acme Corp', type: 'text' },
              ].map(({ label, value, set, placeholder, type }) => (
                <div key={label}>
                  <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                  <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                    style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', color: 'var(--on-surface)', fontFamily: 'var(--font-body)', fontSize: 16, padding: '8px 0', width: '100%', outline: 'none' }} />
                </div>
              ))}
              <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>Selected plan: {plan}</p>
              <Button variant="primary" icon={<Mail size={14} />} fullWidth onClick={handleSubmit} disabled={loading}>REQUEST DEMO</Button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="anim-scale-in" style={{ textAlign: 'center', padding: 'var(--sp-8)', borderColor: 'rgba(0,230,57,0.3)' }}>
            <CheckCircle2 size={32} color="var(--primary)" style={{ margin: '0 auto var(--sp-3)' }} />
            <p className="text-title" style={{ color: 'var(--primary)' }}>Request Sent</p>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
              We'll reach out to {email} within 24 hours.
            </p>
          </GlassCard>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
