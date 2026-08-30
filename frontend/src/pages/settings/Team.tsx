import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

export default function Team() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin-management', { replace: true });
  }, [navigate]);

  return (
    <Layout>
      <div className="page-enter flex min-h-[300px] items-center justify-center">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Redirecting to admin management…
        </div>
      </div>
    </Layout>
  );
}
