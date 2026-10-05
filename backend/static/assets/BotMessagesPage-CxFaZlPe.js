import { j as jsxRuntimeExports } from "./query-vendor-DbSHy-Pt.js";
import { a as reactExports } from "./router-vendor-BtBWUifS.js";
import { u as useAuth, h as client, L as Layout } from "./index-Cpr2TX09.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-BXMma-RE.js";
import { R as RefreshCw, a3 as Search, u as ChevronRight, bf as MessageSquare, v as ChevronLeft, S as Send } from "./utils-vendor-CNf7xaAj.js";
import "./ui-vendor-CliYdUyU.js";
const fmt_time = (s) => {
  if (!s) return "";
  return new Date(s).toLocaleString();
};
function BotMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = reactExports.useState([]);
  const [messages, setMessages] = reactExports.useState([]);
  const [selectedChat, setSelectedChat] = reactExports.useState(null);
  const [reply, setReply] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  const [search, setSearch] = reactExports.useState("");
  const [sendError, setSendError] = reactExports.useState("");
  const [sendSuccess, setSendSuccess] = reactExports.useState(false);
  const [mobilePane, setMobilePane] = reactExports.useState("list");
  const messagesEndRef = reactExports.useRef(null);
  const fetchConversations = reactExports.useCallback(async () => {
    try {
      const { data, ok } = await client.get("/api/v1/bot-messages/conversations");
      if (ok) setConversations((data == null ? void 0 : data.items) || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);
  const fetchMessages = reactExports.useCallback(async (chatId) => {
    try {
      const params = new URLSearchParams({ chat_id: chatId, limit: "100" });
      const { data, ok } = await client.get(`/api/v1/bot-messages?${params}`);
      if (ok) {
        setMessages((data == null ? void 0 : data.items) || []);
        setTimeout(() => {
          var _a;
          return (_a = messagesEndRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);
  reactExports.useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, 15e3);
    return () => clearInterval(id);
  }, [fetchConversations]);
  reactExports.useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.chat_id);
    const id = setInterval(() => fetchMessages(selectedChat.chat_id), 15e3);
    return () => clearInterval(id);
  }, [selectedChat, fetchMessages]);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  const selectConversation = (c) => {
    setSelectedChat(c);
    setReply("");
    setSendError("");
    setSendSuccess(false);
    setMobilePane("thread");
    fetchMessages(c.chat_id);
  };
  const sendReply = async () => {
    if (!selectedChat || !reply.trim()) return;
    setSending(true);
    setSendError("");
    setSendSuccess(false);
    try {
      const { data, ok } = await client.post("/api/v1/bot-messages/reply", {
        chat_id: selectedChat.chat_id,
        message: reply.trim()
      });
      if (ok) {
        setSendSuccess(true);
        setReply("");
        fetchMessages(selectedChat.chat_id);
        setTimeout(() => setSendSuccess(false), 3e3);
      } else {
        setSendError((data == null ? void 0 : data.detail) || (data == null ? void 0 : data.message) || "Failed to send");
      }
    } catch (e) {
      setSendError(e.message);
    }
    setSending(false);
  };
  const filtered = conversations.filter(
    (c) => !search || (c.username || c.chat_id).toLowerCase().includes(search.toLowerCase())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold text-foreground", children: "Bot Messages" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-0.5", children: "View and reply to all bot conversations" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: fetchConversations,
          className: "flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm border border-border px-3 py-1.5 rounded-lg transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
            " Refresh"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 h-[calc(100svh-180px)] min-h-[400px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${mobilePane === "list" ? "flex" : "hidden"} md:flex w-full md:w-72 bg-background border border-border/40 rounded-2xl flex-col overflow-hidden md:shrink-0`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border-b border-border/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search users...",
              className: "w-full bg-muted/60 border border-border/40 rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 space-y-2", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-2 rounded-xl animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-full bg-muted/50 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-24 bg-muted/50 rounded" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2.5 w-32 bg-muted/30 rounded" })
          ] })
        ] }, i)) }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground text-sm", children: "No conversations yet" }) : filtered.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => selectConversation(c),
            className: `w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-border/20 hover:bg-muted/50 ${(selectedChat == null ? void 0 : selectedChat.chat_id) === c.chat_id ? "bg-blue-500/10 border-l-2 border-l-blue-500" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-xs font-semibold", children: (c.username || c.chat_id).charAt(0).toUpperCase() }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground truncate", children: c.username ? `@${c.username}` : c.chat_id }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate", children: c.last_message || "No messages" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 flex flex-col items-end gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: c.message_count }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3 text-muted-foreground" })
              ] })
            ]
          },
          c.chat_id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${mobilePane === "thread" ? "flex" : "hidden"} md:flex flex-1 bg-background border border-border/40 rounded-2xl flex-col overflow-hidden`, children: !selectedChat ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex items-center justify-center flex-col gap-4 text-center px-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 bg-muted rounded-2xl flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-7 w-7 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-medium", children: "Select a conversation" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Choose a user from the left to view their messages" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 border-b border-border/40 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0",
              onClick: () => setMobilePane("list"),
              "aria-label": "Back to conversations",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-xs font-semibold", children: (selectedChat.username || selectedChat.chat_id).charAt(0).toUpperCase() }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold text-sm", children: selectedChat.username ? `@${selectedChat.username}` : selectedChat.chat_id }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs", children: [
              "Chat ID: ",
              selectedChat.chat_id,
              " · ",
              selectedChat.message_count,
              " messages"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => fetchMessages(selectedChat.chat_id),
              className: "ml-auto text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-2", children: [
          messages.map((m) => {
            const isAdmin = m.log_type === "admin_reply";
            return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${isAdmin ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-[75%] rounded-2xl px-3 py-2 ${isAdmin ? "bg-blue-600 text-white rounded-br-sm" : "bg-muted text-slate-200 rounded-bl-sm"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm whitespace-pre-wrap break-words", children: m.message }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-[10px] mt-1 ${isAdmin ? "text-blue-200" : "text-muted-foreground"}`, children: fmt_time(m.created_at) })
            ] }) }, m.id);
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: messagesEndRef })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 border-t border-border/40", children: [
          sendError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-xs mb-2", children: sendError }),
          sendSuccess && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-emerald-400 text-xs mb-2", children: "✅ Message sent!" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                value: reply,
                onChange: (e) => setReply(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                },
                placeholder: "Type a reply... (Enter to send, Shift+Enter for newline)",
                rows: 2,
                className: "flex-1 bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: sendReply,
                disabled: sending || !reply.trim(),
                className: "px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-1.5 shrink-0",
                children: sending ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" })
              }
            )
          ] })
        ] })
      ] }) })
    ] })
  ] }) });
}
export {
  BotMessagesPage as default
};
