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
      <p className="text-sm text-slate-400 mb-2">
        <Link to="/settings" className="text-slate-400 no-underline">Settings</Link>
        {' > '}
        <span>{crumb}</span>
      </p>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/settings')}
          className="w-8 h-8 rounded-md border border-slate-200 bg-white flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft size={16} color="#333" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900 m-0">{title}</h1>
      </div>
    </>
  );
}
