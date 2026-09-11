import { useCallback, useEffect, useState } from 'react';
import { LifeBuoy, MessageCircle, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ChatMessage {
  author_name: string;
  author_role: 'user' | 'admin';
  body: string;
  created_at: string;
}

interface ChatTicket {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  messages: ChatMessage[];
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting_on_user: 'Waiting for you',
  resolved: 'Resolved',
  closed: 'Closed',
};

const iconButtonClass = 'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';
const subtleButtonClass = `${iconButtonClass} text-slate-500 hover:bg-slate-100 hover:text-blue-600`;

function statusClass(status: string) {
  if (status === 'resolved' || status === 'closed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'waiting_on_user') return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
}

export default function LiveChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<ChatTicket[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [newConversation, setNewConversation] = useState(false);

  const selectedTicket = tickets.find(ticket => ticket.id === selectedId) || null;

  const loadTickets = useCallback(async (showLoader = false) => {
    if (!user) return;
    if (showLoader) setLoading(true);
    try {
      const response = await client.get('/api/v1/support/tickets');
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to load chat');
      const nextTickets = Array.isArray(response.data?.tickets) ? response.data.tickets : [];
      setTickets(nextTickets);
      setSelectedId(current => current && nextTickets.some((ticket: ChatTicket) => ticket.id === current)
        ? current
        : nextTickets[0]?.id || null);
    } catch (error) {
      if (showLoader) toast.error(error instanceof Error ? error.message : 'Unable to load chat');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!open || !user) return undefined;
    void loadTickets(true);
    const refresh = window.setInterval(() => { void loadTickets(); }, 15000);
    return () => window.clearInterval(refresh);
  }, [open, user, loadTickets]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (newConversation || !selectedTicket) {
        const response = await client.post('/api/v1/support/tickets', {
          subject: 'Website live chat request',
          description: text,
          category: 'general',
          priority: 'normal',
        });
        if (!response.ok) throw new Error(response.data?.detail || 'Unable to start chat');
        setNewConversation(false);
      } else {
        const response = await client.post(`/api/v1/support/tickets/${selectedTicket.id}/messages`, { body: text });
        if (!response.ok) throw new Error(response.data?.detail || 'Unable to send message');
      }
      setMessage('');
      await loadTickets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <header className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500"><LifeBuoy className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold">SwiftPay Support</p><p className="text-[11px] text-slate-300">We will reply in this chat</p></div>
            </div>
            <button type="button" aria-label="Close support chat" title="Close chat" onClick={() => setOpen(false)} className={`${iconButtonClass} h-9 w-9 text-slate-300 hover:bg-white/10 hover:text-white`}><X className="h-4 w-4" /></button>
          </header>

          {!user ? (
            <div className="flex flex-1 flex-col justify-center bg-slate-50 p-6 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Chat with SwiftPay Support</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Sign in to start a conversation with our support team.</p>
              <Link to="/login" onClick={() => setOpen(false)} className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Sign in to chat
              </Link>
            </div>
          ) : !selectedTicket || newConversation ? (
            <div className="flex flex-1 flex-col justify-end bg-slate-50 p-4">
              <div className="mb-4 rounded-2xl rounded-bl-md bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200">
                Hi{user.name ? ` ${user.name}` : ''}. Tell us what you need help with and our support team will follow up here.
              </div>
              {newConversation && <button type="button" onClick={() => setNewConversation(false)} className="mb-3 self-start text-xs font-semibold text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline">Back to existing conversations</button>}
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3">
                {tickets.map(ticket => <button key={ticket.id} type="button" onClick={() => setSelectedId(ticket.id)} aria-pressed={ticket.id === selectedId} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${ticket.id === selectedId ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}><span className="block max-w-32 truncate">{ticket.subject}</span><span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] ${statusClass(ticket.status)}`}>{statusLabels[ticket.status] || ticket.status}</span></button>)}
                <button type="button" onClick={() => setNewConversation(true)} className={`${subtleButtonClass} shrink-0 border border-dashed border-slate-300 px-3 py-1.5 text-[11px] font-semibold hover:border-blue-400`}>New chat</button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {selectedTicket.messages.map((entry, index) => <div key={`${entry.created_at}-${index}`} className={`flex ${entry.author_role === 'admin' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm ${entry.author_role === 'admin' ? 'rounded-bl-md bg-white text-slate-700 shadow-sm ring-1 ring-slate-200' : 'rounded-br-md bg-blue-600 text-white'}`}><p className="mb-1 text-[10px] font-semibold opacity-60">{entry.author_name}</p><p className="whitespace-pre-wrap leading-relaxed">{entry.body}</p></div></div>)}
              </div>
            </>
          )}

          {loading && <p className="border-t border-slate-100 px-4 py-2 text-center text-[11px] text-slate-400">Loading conversations...</p>}
          {user && (!selectedTicket || newConversation || selectedTicket.status !== 'closed') && <div className="flex items-end gap-2 border-t border-slate-200 bg-white p-3"><Textarea value={message} onChange={event => { setMessage(event.target.value); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Write a message..." className="min-h-11 max-h-28 resize-none" maxLength={10000} /><Button type="button" size="icon" onClick={() => void sendMessage()} disabled={sending || !message.trim()} aria-label={sending ? 'Sending support message' : 'Send support message'} title="Send message" className="live-chat-send h-10 w-10 shrink-0 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"><Send className="h-4 w-4 stroke-current" /></Button></div>}
        </section>
      )}
      <Button type="button" onClick={() => setOpen(value => !value)} aria-label={open ? 'Close support chat' : 'Open support chat'} title={open ? 'Close support chat' : 'Open support chat'} className="ml-auto flex h-12 w-12 rounded-full border border-black bg-white p-0 text-black shadow-lg shadow-slate-900/20 hover:bg-slate-100"><MessageCircle className="h-5 w-5 stroke-black" /></Button>
    </div>
  );
}