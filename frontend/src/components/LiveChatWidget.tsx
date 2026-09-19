import { useCallback, useEffect, useMemo, useState } from 'react';
import { LifeBuoy, LoaderCircle, MessageCircle, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const ui = useMemo(() => isKorean ? {
    reply: '이 채팅으로 답변해 드립니다',
    close: '지원 채팅 닫기',
    open: '지원 채팅 열기',
    chatSupport: 'SwiftPay 고객지원과 채팅',
    signInPrompt: '지원팀과 대화를 시작하려면 로그인하세요.',
    signIn: '채팅하려면 로그인',
    greeting: '안녕하세요',
    helpPrompt: '필요한 도움을 말씀해 주시면 지원팀이 이곳에서 답변해 드립니다.',
    back: '기존 대화로 돌아가기',
    newChat: '새 대화',
    loading: '대화 불러오는 중...',
    placeholder: '메시지를 입력하세요...',
    sending: '지원 메시지 전송 중',
    send: '지원 메시지 보내기',
    sendTitle: '메시지 보내기',
    unableLoad: '채팅을 불러올 수 없습니다',
    unableStart: '채팅을 시작할 수 없습니다',
    unableSend: '메시지를 보낼 수 없습니다',
    newSubject: '웹사이트 실시간 채팅 문의',
  } : {
    reply: 'We will reply in this chat',
    close: 'Close support chat',
    open: 'Open support chat',
    chatSupport: 'Chat with SwiftPay Support',
    signInPrompt: 'Sign in to start a conversation with our support team.',
    signIn: 'Sign in to chat',
    greeting: 'Hi',
    helpPrompt: 'Tell us what you need help with and our support team will follow up here.',
    back: 'Back to existing conversations',
    newChat: 'New chat',
    loading: 'Loading conversations...',
    placeholder: 'Write a message...',
    sending: 'Sending support message',
    send: 'Send support message',
    sendTitle: 'Send message',
    unableLoad: 'Unable to load chat',
    unableStart: 'Unable to start chat',
    unableSend: 'Unable to send message',
    newSubject: 'Website live chat request',
  }, [isKorean]);
  const localizedStatusLabels = isKorean ? {
    open: '열림',
    in_progress: '처리 중',
    waiting_on_user: '답변 대기 중',
    resolved: '해결됨',
    closed: '종료됨',
  } : statusLabels;
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
      if (!response.ok) throw new Error(response.data?.detail || ui.unableLoad);
      const nextTickets = Array.isArray(response.data?.tickets) ? response.data.tickets : [];
      setTickets(nextTickets);
      setSelectedId(current => current && nextTickets.some((ticket: ChatTicket) => ticket.id === current)
        ? current
        : nextTickets[0]?.id || null);
    } catch (error) {
      if (showLoader) toast.error(error instanceof Error ? error.message : ui.unableLoad);
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
          subject: ui.newSubject,
          description: text,
          category: 'general',
          priority: 'normal',
        });
        if (!response.ok) throw new Error(response.data?.detail || ui.unableStart);
        setNewConversation(false);
      } else {
        const response = await client.post(`/api/v1/support/tickets/${selectedTicket.id}/messages`, { body: text });
        if (!response.ok) throw new Error(response.data?.detail || ui.unableSend);
      }
      setMessage('');
      await loadTickets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ui.unableSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <section className="live-chat-panel mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <header className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="live-chat-support-icon flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500"><LifeBuoy className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold">SwiftPay 고객지원</p><p className="text-[11px] text-slate-300">{ui.reply}</p></div>
            </div>
            <button type="button" aria-label={ui.close} title={ui.close} onClick={() => setOpen(false)} className={`live-chat-close ${iconButtonClass} h-9 w-9 text-slate-300 hover:bg-white/10 hover:text-white`}><X className="h-4 w-4" /></button>
          </header>

          {!user ? (
            <div className="flex flex-1 flex-col justify-center bg-slate-50 p-6 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-800">{ui.chatSupport}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{ui.signInPrompt}</p>
              <Link to="/login" onClick={() => setOpen(false)} className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                {ui.signIn}
              </Link>
            </div>
          ) : !selectedTicket || newConversation ? (
            <div className="flex flex-1 flex-col justify-end bg-slate-50 p-4">
              <div className="mb-4 rounded-2xl rounded-bl-md bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200">
                {ui.greeting}{user.name ? ` ${user.name}` : ''}. {ui.helpPrompt}
              </div>
              {newConversation && <button type="button" onClick={() => setNewConversation(false)} className="mb-3 self-start text-xs font-semibold text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline">{ui.back}</button>}
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3">
                {tickets.map(ticket => <button key={ticket.id} type="button" onClick={() => setSelectedId(ticket.id)} aria-pressed={ticket.id === selectedId} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${ticket.id === selectedId ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}><span className="block max-w-32 truncate">{ticket.subject}</span><span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] ${statusClass(ticket.status)}`}>{localizedStatusLabels[ticket.status] || ticket.status}</span></button>)}
                <button type="button" onClick={() => setNewConversation(true)} className={`${subtleButtonClass} shrink-0 border border-dashed border-slate-300 px-3 py-1.5 text-[11px] font-semibold hover:border-blue-400`}>{ui.newChat}</button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {selectedTicket.messages.map((entry, index) => <div key={`${entry.created_at}-${index}`} className={`flex ${entry.author_role === 'admin' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm ${entry.author_role === 'admin' ? 'rounded-bl-md bg-white text-slate-700 shadow-sm ring-1 ring-slate-200' : 'rounded-br-md bg-blue-600 text-white'}`}><p className="mb-1 text-[10px] font-semibold opacity-60">{entry.author_name}</p><p className="whitespace-pre-wrap leading-relaxed">{entry.body}</p></div></div>)}
              </div>
            </>
          )}

          {loading && <p className="border-t border-slate-100 px-4 py-2 text-center text-[11px] text-slate-400">{ui.loading}</p>}
          {user && (!selectedTicket || newConversation || selectedTicket.status !== 'closed') && <div className="flex items-end gap-2 border-t border-slate-200 bg-white p-3"><Textarea value={message} onChange={event => { setMessage(event.target.value); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder={ui.placeholder} className="min-h-11 max-h-28 resize-none" maxLength={10000} /><Button type="button" size="icon" onClick={() => void sendMessage()} disabled={sending || !message.trim()} aria-label={sending ? ui.sending : ui.send} title={ui.sendTitle} className={`live-chat-send h-10 w-10 shrink-0 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 ${sending ? 'is-sending' : ''}`}>{sending ? <LoaderCircle className="h-4 w-4 stroke-current" /> : <Send className="h-4 w-4 stroke-current" />}</Button></div>}
        </section>
      )}
      <Button type="button" onClick={() => setOpen(value => !value)} aria-label={open ? ui.close : ui.open} title={open ? ui.close : ui.open} className={`live-chat-launcher ml-auto flex h-12 w-12 rounded-full border border-black bg-white p-0 text-black shadow-lg shadow-slate-900/20 hover:bg-slate-100 ${open ? 'is-open' : ''}`}><MessageCircle className="h-5 w-5 stroke-black" /></Button>
    </div>
  );
}