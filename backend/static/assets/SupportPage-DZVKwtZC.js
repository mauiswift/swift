import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { u as useAuth, a as useLanguage, L as Layout, T as Textarea, e as Button, g as client, b as ue } from "./index-DI9hQtnS.js";
import { I as Input } from "./input-BdTqxRfS.js";
import { y as LifeBuoy, S as Send, bg as UserRound } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
const STATUS_OPTIONS = ["open", "in_progress", "waiting_on_user", "resolved", "closed"];
const CATEGORY_OPTIONS = ["general", "payment", "withdrawal", "disbursement", "account", "technical"];
function statusLabel(status, language = "en") {
  if (language === "ko") {
    const labels = {
      open: "열림",
      in_progress: "진행 중",
      waiting_on_user: "답변 대기 중",
      resolved: "해결됨",
      closed: "종료됨",
      general: "일반",
      payment: "결제",
      withdrawal: "출금",
      disbursement: "지급",
      account: "계정",
      technical: "기술 지원",
      normal: "일반",
      high: "높음",
      urgent: "긴급"
    };
    return labels[status] || status;
  }
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function statusStyle(status) {
  if (status === "resolved" || status === "closed") return "bg-emerald-50 text-emerald-700";
  if (status === "waiting_on_user") return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
}
function SupportPage() {
  const { user, isSuperAdmin } = useAuth();
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? zh ?? en : language === "en" ? en : ko;
  const [tickets, setTickets] = reactExports.useState([]);
  const [selectedId, setSelectedId] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [replying, setReplying] = reactExports.useState(false);
  const [subject, setSubject] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [category, setCategory] = reactExports.useState("general");
  const [priority, setPriority] = reactExports.useState("normal");
  const [reply, setReply] = reactExports.useState("");
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) || null;
  const loadTickets = async () => {
    var _a, _b;
    setLoading(true);
    try {
      const response = await client.get("/api/v1/support/tickets");
      if (!response.ok) throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || tx("Unable to load support tickets", "문의 내용을 불러오지 못했습니다"));
      const nextTickets = Array.isArray((_b = response.data) == null ? void 0 : _b.tickets) ? response.data.tickets : [];
      setTickets(nextTickets);
      setSelectedId((current) => {
        var _a2;
        return current && nextTickets.some((ticket) => ticket.id === current) ? current : ((_a2 = nextTickets[0]) == null ? void 0 : _a2.id) || null;
      });
    } catch (error) {
      ue.error(error instanceof Error ? error.message : tx("Unable to load support tickets", "문의 내용을 불러오지 못했습니다"));
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadTickets();
  }, []);
  const submitTicket = async () => {
    var _a;
    if (!subject.trim() || description.trim().length < 10) {
      ue.error(tx("Add a subject and at least 10 characters describing the issue.", "제목과 문제 설명을 10자 이상 입력해 주세요."));
      return;
    }
    setSubmitting(true);
    try {
      const response = await client.post("/api/v1/support/tickets", { subject, description, category, priority });
      if (!response.ok) throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || tx("Unable to submit ticket", "문의 등록에 실패했습니다"));
      setSubject("");
      setDescription("");
      setCategory("general");
      setPriority("normal");
      await loadTickets();
      setSelectedId(response.data.ticket.id);
      ue.success(tx(`Ticket ${response.data.ticket.ticket_number} submitted`, `문의 ${response.data.ticket.ticket_number}가 등록되었습니다`));
    } catch (error) {
      ue.error(error instanceof Error ? error.message : tx("Unable to submit ticket", "문의 등록에 실패했습니다"));
    } finally {
      setSubmitting(false);
    }
  };
  const sendReply = async () => {
    var _a;
    if (!selectedTicket || !reply.trim()) return;
    setReplying(true);
    try {
      const response = await client.post(`/api/v1/support/tickets/${selectedTicket.id}/messages`, { body: reply });
      if (!response.ok) throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || tx("Unable to send reply", "답변을 보내지 못했습니다"));
      setReply("");
      await loadTickets();
    } catch (error) {
      ue.error(error instanceof Error ? error.message : tx("Unable to send reply", "답변을 보내지 못했습니다"));
    } finally {
      setReplying(false);
    }
  };
  const updateTicket = async (updates) => {
    var _a;
    if (!selectedTicket) return;
    const response = await client.patch(`/api/v1/support/tickets/${selectedTicket.id}`, updates);
    if (!response.ok) {
      ue.error(((_a = response.data) == null ? void 0 : _a.detail) || tx("Unable to update ticket", "문의를 업데이트하지 못했습니다"));
      return;
    }
    await loadTickets();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900", children: tx("Support", "고객 지원") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: tx("File a request and follow every response in one place.", "문의 내용을 등록하고 모든 답변을 한곳에서 확인하세요.") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-[340px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-slate-900", children: isSuperAdmin ? tx("Ticket queue", "문의 대기열") : tx("My tickets", "내 문의") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-slate-400", children: tickets.length })
        ] }),
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-8 text-center text-sm text-slate-400", children: tx("Loading tickets...", "문의 불러오는 중...") }) : tickets.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-8 text-center text-sm text-slate-400", children: tx("No tickets yet.", "문의가 없습니다.") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: tickets.map((ticket) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setSelectedId(ticket.id), className: `w-full rounded-xl border p-3 text-left transition ${selectedId === ticket.id ? "border-blue-300 bg-blue-50/60" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[11px] text-slate-400", children: ticket.ticket_number }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle(ticket.status)}`, children: statusLabel(ticket.status, language) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate text-sm font-semibold text-slate-800", children: ticket.subject }),
          isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-slate-400", children: ticket.user_name || ticket.user_email || tx("User", "사용자") })
        ] }, ticket.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        !selectedTicket && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-slate-900", children: tx("Start a support request", "지원 문의 작성") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: subject, onChange: (event) => setSubject(event.target.value), placeholder: tx("Subject", "제목"), className: "sm:col-span-2", maxLength: 200 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: category, onChange: (event) => setCategory(event.target.value), className: "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700", children: CATEGORY_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option, children: statusLabel(option, language) }, option)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: priority, onChange: (event) => setPriority(event.target.value), className: "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "normal", children: tx("Normal priority", "일반 우선순위") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "high", children: tx("High priority", "높은 우선순위") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "urgent", children: tx("Urgent", "긴급") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: description, onChange: (event) => setDescription(event.target.value), placeholder: tx("Describe what happened and what you need help with...", "문제 상황과 도움이 필요한 내용을 설명해 주세요..."), className: "min-h-36 sm:col-span-2", maxLength: 1e4 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: submitTicket, disabled: submitting, variant: "default", className: "mt-4 bg-blue-600 !text-white hover:bg-blue-700", children: [
            submitting ? tx("Submitting...", "등록 중...") : tx("Submit ticket", "문의 등록"),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "ml-2 h-4 w-4" })
          ] })
        ] }),
        selectedTicket && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-slate-100 p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-xs text-slate-400", children: selectedTicket.ticket_number }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-xl font-semibold text-slate-900", children: selectedTicket.subject }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-slate-500", children: [
                  statusLabel(selectedTicket.category, language),
                  " · ",
                  statusLabel(selectedTicket.priority, language),
                  " ",
                  tx("priority", "우선순위")
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(selectedTicket.status)}`, children: statusLabel(selectedTicket.status, language) })
            ] }),
            isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "h-4 w-4 text-slate-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-600", children: selectedTicket.user_name || selectedTicket.user_email || tx("User", "사용자") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: selectedTicket.status, onChange: (event) => updateTicket({ status: event.target.value }), className: "ml-auto h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700", children: STATUS_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option, children: statusLabel(option, language) }, option)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[520px] space-y-4 overflow-y-auto bg-slate-50/60 p-6", children: selectedTicket.messages.map((message, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${message.author_role === "admin" ? "justify-start" : "justify-end"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-[85%] rounded-2xl px-4 py-3 ${message.author_role === "admin" ? "border border-slate-200 bg-white" : "bg-blue-600 text-white"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mb-1 flex items-center gap-2 text-[11px] font-semibold ${message.author_role === "admin" ? "text-slate-400" : "text-blue-100"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: message.author_name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(message.created_at).toLocaleString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap text-sm leading-relaxed", children: message.body })
          ] }) }, `${message.created_at}-${index}`)) }),
          selectedTicket.status !== "closed" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: reply, onChange: (event) => setReply(event.target.value), placeholder: isSuperAdmin ? tx("Reply to the user...", "사용자에게 답변하세요...") : tx("Add more information...", "추가 정보를 입력하세요..."), className: "min-h-24", maxLength: 1e4 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: sendReply, disabled: replying || !reply.trim(), className: "mt-3 bg-slate-900 text-white hover:bg-slate-800", children: [
              replying ? tx("Sending...", "전송 중...") : tx("Send reply", "답변 보내기"),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "ml-2 h-4 w-4" })
            ] })
          ] })
        ] }),
        selectedTicket && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSelectedId(null), className: "text-sm font-semibold text-blue-600 hover:text-blue-700", children: tx("File another ticket", "새 문의 작성") })
      ] })
    ] })
  ] }) });
}
export {
  SupportPage as default
};
