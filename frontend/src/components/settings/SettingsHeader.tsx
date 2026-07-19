import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface SettingsHeaderProps {
  crumb: string;
  title: string;
}

export default function SettingsHeader({ crumb, title }: SettingsHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      <p style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 8 }}>
        <Link to="/settings" style={{ color: '#8a8a8a', textDecoration: 'none' }}>Settings</Link>
        {' > '}
        <span>{crumb}</span>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={16} color="#333" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>{title}</h1>
      </div>
    </>
  );
}
