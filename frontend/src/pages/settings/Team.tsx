import { useState } from 'react';
import { ChevronLeft, UserPlus, Trash2, Edit2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

const mockUsers = [
  { id: 1, name: 'DEN RUSSELL LEONARDO', email: 'drltechgroup2024@gmail.com', role: 'Owner', added: 'Jul 7, 2026' },
  { id: 2, name: 'Test Test', email: 'denshitz88@outlook.com', role: 'Admin', added: 'Jun 18, 2026' },
];

export default function Team() {
  const navigate = useNavigate();
  const [approvalWorkflow, setApprovalWorkflow] = useState(true);

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Team</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-5 mb-12">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Team</h1>
        </div>

        {/* Approval Workflow Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-10 mb-12 shadow-sm flex items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Approval workflow</h3>
            <p className="text-[13px] text-slate-500 font-medium">Adds financial security by requiring approval from another user for sensitive operations.</p>
          </div>
          <button
            onClick={() => setApprovalWorkflow(!approvalWorkflow)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${approvalWorkflow ? 'bg-[#2DD4BF] shadow-[0_0_8px_rgba(45,212,191,0.4)]' : 'bg-slate-200'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${approvalWorkflow ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <p className="text-[14px] font-semibold text-slate-900">{mockUsers.length} users</p>
          <button className="flex items-center gap-2 bg-[#111111] text-white px-6 py-3 rounded-xl font-semibold text-[14px] shadow-lg hover:bg-black transition-all">
            <UserPlus size={18} />
            Invite user
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">USER</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">
                   <div className="flex items-center justify-center gap-1">
                      ROLE
                      <Info size={12} className="text-slate-300" />
                   </div>
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">DATE ADDED</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <UserPlus size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{u.name}</p>
                        <p className="text-[12px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="text-[11px] font-semibold text-[#FF6B00] bg-[#FFF5F1] px-3 py-1 rounded-full border border-[#FFDCCB]">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center text-[12px] text-slate-600 font-medium">
                    {u.added}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-rose-500 transition-colors">
                        <Trash2 size={14} />
                        Remove
                      </button>
                      <button className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-[#FF6B00] transition-colors">
                        <Edit2 size={14} />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
