import { useEffect, useState, CSSProperties } from 'react';
import { UserPlus, X, ChevronDown, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleDisplayName } from '@/lib/roleDisplay';
import SettingsBanner from '@/components/settings/SettingsBanner';
import SettingsHeader from '@/components/settings/SettingsHeader';

interface TeamMember {
  id: number;
  name?: string;
  email?: string;
  telegram_id: string;
  role: string;
  joined_at?: string;
}

const ROLE_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'editor' },
  { label: 'Operator', value: 'approver' },
  { label: 'Viewer', value: 'viewer' },
];

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

function InviteUserModal({ orgName, onClose, onInvited }: { orgName: string; onClose: () => void; onInvited: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [roleOpen, setRoleOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedLabel = ROLE_OPTIONS.find((r) => r.value === role)?.label || 'Viewer';

  const handleSend = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    setSending(true);
    setError('');
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      await apiFetch('/api/v1/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          role,
          notes: fullName || undefined,
        }),
      });
      onInvited();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 420, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={18} color="#111" />
        </button>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#fbe3cf',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <UserPlus size={18} color="#c2530f" />
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>Invite User</h2>
        <p style={{ fontSize: 12.5, color: '#6b7280', margin: '0 0 18px' }}>
          To invite a new user to <b>{orgName}</b>, enter their email address.
        </p>

        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#111', display: 'block', marginBottom: 5 }}>First name</label>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />

        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#111', display: 'block', margin: '14px 0 5px' }}>Last name</label>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />

        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#111', display: 'block', margin: '14px 0 5px' }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={inputStyle} />

        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#111', display: 'block', margin: '14px 0 5px' }}>Role</label>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setRoleOpen((v) => !v)}
            style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#fff' }}
          >
            <span>{selectedLabel}</span>
            <ChevronDown size={14} color="#6b7280" />
          </button>
          {roleOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setRole(opt.value); setRoleOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                >
                  <span>{opt.label}</span>
                  {opt.value === role && <Check size={14} color="#22c55e" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 10 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, border: '1px solid #d1d5db', background: '#fff', color: '#111', borderRadius: 8, padding: '10px 0', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{ flex: 1, border: 'none', background: '#111', color: '#fff', borderRadius: 8, padding: '10px 0', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
          >
            {sending ? 'Sending...' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13.5,
};

export default function Team() {
  const { user, isSuperAdmin, permissions } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalWorkflow, setApprovalWorkflow] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/v1/team/members');
      setMembers(data?.members || []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  if (!isSuperAdmin && !permissions?.can_manage_team) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-16 text-center text-sm text-muted-foreground">
          You don't have permission to view this page.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SettingsBanner />
        <SettingsHeader crumb="Team" title="Team" />

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#111', margin: 0 }}>Approval workflow</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
              Adds financial security by requiring approval from another user for sensitive operations.
            </p>
          </div>
          <span
            onClick={() => setApprovalWorkflow((v) => !v)}
            style={{
              width: 40,
              height: 22,
              borderRadius: 999,
              background: approvalWorkflow ? '#2dd4bf' : '#d1d5db',
              position: 'relative',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'inline-block',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: approvalWorkflow ? 20 : 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.15s',
              }}
            />
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{members.length} users</p>
          <button
            onClick={() => setInviteOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <UserPlus size={14} /> Invite user
          </button>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 20px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <span>User</span>
            <span>Role</span>
            <span>Date added</span>
            <span>Actions</span>
          </div>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>Loading...</div>
          ) : members.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No team members yet.</div>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{(m.name || m.telegram_id || '?').charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: '#111', margin: 0, textTransform: 'uppercase' }}>{m.name || m.telegram_id}</p>
                    {m.email && <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{m.email}</p>}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#c2530f',
                    background: '#fdf1e7',
                    borderRadius: 999,
                    padding: '3px 10px',
                    width: 'fit-content',
                  }}
                >
                  {getRoleDisplayName(m.role)}
                </span>
                <span style={{ fontSize: 12.5, color: '#374151' }}>
                  {m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
                <span />
              </div>
            ))
          )}
        </div>
      </div>

      {inviteOpen && (
        <InviteUserModal
          orgName={user?.organization_name || 'your organization'}
          onClose={() => setInviteOpen(false)}
          onInvited={fetchMembers}
        />
      )}
    </Layout>
  );
}
