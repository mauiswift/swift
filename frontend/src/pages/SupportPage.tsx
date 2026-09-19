import { useEffect, useState } from 'react';
import { LifeBuoy, Send, CheckCircle2, Clock3, UserRound } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface TicketMessage {
  author_name: string;
  author_role: 'user' | 'admin';
  body: string;
  created_at: string;
}

interface Ticket {
  id: number;
  ticket_number: string;
  user_name?: string | null;
  user_email?: string | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: string | null;
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = ['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed'];
const CATEGORY_OPTIONS = ['general', 'payment', 'withdrawal', 'disbursement', 'account', 'technical'];

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function statusStyle(status: string) {
  if (status === 'resolved' || status === 'closed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'waiting_on_user') return 'bg-amber-50 text-amber-700';
  return 'bg-blue-50 text-blue-700';
}

export default function SupportPage() {
  const { user, isSuperAdmin } = useAuth();
  const { language } = useLanguage();
  const tx = (en: string, ko: string) => language === 'ko' ? ko : en;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [reply, setReply] = useState('');

  const selectedTicket = tickets.find(ticket => ticket.id === selectedId) || null;

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await client.get('/api/v1/support/tickets');
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to load support tickets');
      const nextTickets = Array.isArray(response.data?.tickets) ? response.data.tickets : [];
      setTickets(nextTickets);
      setSelectedId(current => current && nextTickets.some((ticket: Ticket) => ticket.id === current) ? current : nextTickets[0]?.id || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const submitTicket = async () => {
    if (!subject.trim() || description.trim().length < 10) {
      toast.error('Add a subject and at least 10 characters describing the issue.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await client.post('/api/v1/support/tickets', { subject, description, category, priority });
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to submit ticket');
      setSubject('');
      setDescription('');
      setCategory('general');
      setPriority('normal');
      await loadTickets();
      setSelectedId(response.data.ticket.id);
      toast.success(`Ticket ${response.data.ticket.ticket_number} submitted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setReplying(true);
    try {
      const response = await client.post(`/api/v1/support/tickets/${selectedTicket.id}/messages`, { body: reply });
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to send reply');
      setReply('');
      await loadTickets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send reply');
    } finally {
      setReplying(false);
    }
  };

  const updateTicket = async (updates: Record<string, string>) => {
    if (!selectedTicket) return;
    const response = await client.patch(`/api/v1/support/tickets/${selectedTicket.id}`, updates);
    if (!response.ok) {
      toast.error(response.data?.detail || 'Unable to update ticket');
      return;
    }
    await loadTickets();
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><LifeBuoy className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{tx('Support', '고객 지원')}</h1>
            <p className="mt-1 text-sm text-slate-500">{tx('File a request and follow every response in one place.', '문의 내용을 등록하고 모든 답변을 한곳에서 확인하세요.')}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{isSuperAdmin ? tx('Ticket queue', '문의 대기열') : tx('My tickets', '내 문의')}</h2>
              <span className="text-xs font-semibold text-slate-400">{tickets.length}</span>
            </div>
            {loading ? <p className="py-8 text-center text-sm text-slate-400">{tx('Loading tickets...', '문의 불러오는 중...')}</p> : tickets.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">{tx('No tickets yet.', '문의가 없습니다.')}</p> : (
              <div className="space-y-2">
                {tickets.map(ticket => (
                  <button key={ticket.id} onClick={() => setSelectedId(ticket.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === ticket.id ? 'border-blue-300 bg-blue-50/60' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] text-slate-400">{ticket.ticket_number}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle(ticket.status)}`}>{statusLabel(ticket.status)}</span></div>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-800">{ticket.subject}</p>
                    {isSuperAdmin && <p className="mt-1 truncate text-xs text-slate-400">{ticket.user_name || ticket.user_email || 'User'}</p>}
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-6">
            {!selectedTicket && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">{tx('Start a support request', '지원 문의 작성')}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input value={subject} onChange={event => setSubject(event.target.value)} placeholder={tx('Subject', '제목')} className="sm:col-span-2" maxLength={200} />
                  <select value={category} onChange={event => setCategory(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">{CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{statusLabel(option)}</option>)}</select>
                  <select value={priority} onChange={event => setPriority(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="normal">{tx('Normal priority', '일반 우선순위')}</option><option value="high">{tx('High priority', '높은 우선순위')}</option><option value="urgent">{tx('Urgent', '긴급')}</option></select>
                  <Textarea value={description} onChange={event => setDescription(event.target.value)} placeholder={tx('Describe what happened and what you need help with...', '문제 상황과 도움이 필요한 내용을 설명해 주세요...')} className="min-h-36 sm:col-span-2" maxLength={10000} />
                </div>
                <Button onClick={submitTicket} disabled={submitting} variant="default" className="mt-4 bg-blue-600 !text-white hover:bg-blue-700">{submitting ? 'Submitting...' : 'Submit ticket'}<Send className="ml-2 h-4 w-4" /></Button>
              </section>
            )}

            {selectedTicket && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs text-slate-400">{selectedTicket.ticket_number}</p><h2 className="mt-1 text-xl font-semibold text-slate-900">{selectedTicket.subject}</h2><p className="mt-1 text-sm text-slate-500">{statusLabel(selectedTicket.category)} · {statusLabel(selectedTicket.priority)} priority</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(selectedTicket.status)}`}>{statusLabel(selectedTicket.status)}</span></div>
                  {isSuperAdmin && <div className="mt-4 flex flex-wrap items-center gap-3"><UserRound className="h-4 w-4 text-slate-400" /><span className="text-sm text-slate-600">{selectedTicket.user_name || selectedTicket.user_email || 'User'}</span><select value={selectedTicket.status} onChange={event => updateTicket({ status: event.target.value })} className="ml-auto h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700">{STATUS_OPTIONS.map(option => <option key={option} value={option}>{statusLabel(option)}</option>)}</select></div>}
                </div>
                <div className="max-h-[520px] space-y-4 overflow-y-auto bg-slate-50/60 p-6">{selectedTicket.messages.map((message, index) => <div key={`${message.created_at}-${index}`} className={`flex ${message.author_role === 'admin' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.author_role === 'admin' ? 'border border-slate-200 bg-white' : 'bg-blue-600 text-white'}`}><div className={`mb-1 flex items-center gap-2 text-[11px] font-semibold ${message.author_role === 'admin' ? 'text-slate-400' : 'text-blue-100'}`}><span>{message.author_name}</span><span>{new Date(message.created_at).toLocaleString()}</span></div><p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p></div></div>)}</div>
                {selectedTicket.status !== 'closed' && <div className="border-t border-slate-100 p-5"><Textarea value={reply} onChange={event => setReply(event.target.value)} placeholder={isSuperAdmin ? 'Reply to the user...' : 'Add more information...'} className="min-h-24" maxLength={10000} /><Button onClick={sendReply} disabled={replying || !reply.trim()} className="mt-3 bg-slate-900 text-white hover:bg-slate-800">{replying ? 'Sending...' : 'Send reply'}<Send className="ml-2 h-4 w-4" /></Button></div>}
              </section>
            )}
            {selectedTicket && <button onClick={() => setSelectedId(null)} className="text-sm font-semibold text-blue-600 hover:text-blue-700">File another ticket</button>}
          </div>
        </div>
      </div>
    </Layout>
  );
}