import { j as jsxRuntimeExports } from "./query-vendor-DbSHy-Pt.js";
import { a as reactExports } from "./router-vendor-BtBWUifS.js";
import { u as useAuth, h as client, b as ue, L as Layout, x as Badge, f as Button, ax as Card, ay as CardHeader, az as CardTitle, aB as CardContent, l as Label, I as Input, y as Textarea } from "./index-DalsMdL9.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BUl_YpK8.js";
import { S as Switch } from "./switch-DeumhtY8.js";
import { S as SiteContainer } from "./SiteContainer-D0V41x1y.js";
import { j as Bot, o as CircleCheckBig, b6 as Wrench, a0 as CircleX, I as Info, h as Settings, b7 as ToggleLeft, aP as FileText, aa as Terminal, al as Zap, b8 as FlaskConical, au as Copy, b9 as EyeOff, aW as Eye, z as LoaderCircle, ba as Webhook, T as TriangleAlert, R as RefreshCw, P as Power, a9 as Globe, bb as RotateCcw, aC as Save, a3 as Search, bc as Hash, _ as ChevronUp, Z as ChevronDown, S as Send, X, v as ChevronLeft, u as ChevronRight, bd as MessageSquare, ah as Key, F as Sparkles } from "./utils-vendor-Dj1Vigod.js";
import "./ui-vendor-CliYdUyU.js";
const TUTORIAL_KEY = "bot_settings_tutorial_done_v1";
const BOT_COMMANDS = [
  { cmd: "/start", emoji: "🚀", category: "General", desc: "Welcome screen with language selection" },
  { cmd: "/help", emoji: "❓", category: "General", desc: "Full command reference and bot quick actions" },
  { cmd: "/login", emoji: "🔐", category: "General", desc: "Authenticate with your PIN" },
  { cmd: "/setpin", emoji: "🔑", category: "General", desc: "Set your account PIN" },
  { cmd: "/logout", emoji: "🚪", category: "General", desc: "End the current PIN session" },
  { cmd: "/link", emoji: "🔗", category: "Payments", desc: "Create a SwiftPay payment link" },
  { cmd: "/scanqr", emoji: "📱", category: "Payments", desc: "Create a SwiftPay QRPH payment" },
  { cmd: "/alipay", emoji: "🔴", category: "Payments", desc: "Create a Magpie Alipay payment" },
  { cmd: "/wechat", emoji: "💚", category: "Payments", desc: "Create a Magpie WeChat payment" },
  { cmd: "/wallet", emoji: "💰", category: "Wallet", desc: "Check wallet balance and recent activity" },
  { cmd: "/balance", emoji: "💵", category: "Wallet", desc: "View your PHP balance" },
  { cmd: "/usdbalance", emoji: "💲", category: "Wallet", desc: "View your USD balance" },
  { cmd: "/topup", emoji: "⬆️", category: "TopUp", desc: "Top up via USDT or fiat funding flow" },
  { cmd: "/send", emoji: "📤", category: "Transfers", desc: "Send PHP to another Telegram user" },
  { cmd: "/sendusd", emoji: "💲", category: "Transfers", desc: "Send USD to another Telegram user" },
  { cmd: "/sendusdt", emoji: "🪙", category: "Transfers", desc: "Send USDT to a TRC20 wallet" },
  { cmd: "/disburse", emoji: "💸", category: "Transfers", desc: "Send a payout to a bank or e-wallet" },
  { cmd: "/status", emoji: "🔍", category: "Tools", desc: "Check the status of an invoice or transfer" },
  { cmd: "/register", emoji: "📝", category: "General", desc: "Begin merchant onboarding / KYB flow" },
  { cmd: "/refund", emoji: "↩️", category: "Transfers", desc: "Process a refund request" },
  { cmd: "/withdraw", emoji: "⬇️", category: "Transfers", desc: "Withdraw to a linked bank account" },
  { cmd: "/report", emoji: "📊", category: "Tools", desc: "View transaction reports" },
  { cmd: "/fees", emoji: "🧾", category: "Tools", desc: "Check payment fees" },
  { cmd: "/subscribe", emoji: "🔔", category: "Tools", desc: "Manage payment notifications" },
  { cmd: "/remind", emoji: "⏰", category: "Tools", desc: "Send a payment reminder" }
];
const COMMAND_CATEGORIES = ["General", "Wallet", "Payments", "TopUp", "Transfers", "Tools"];
const PRESET_BUTTONS = [
  {
    category: "Payments",
    buttons: [
      { label: "🔗 SwiftPay Link", callback_data: "wizard:/link" },
      { label: "📱 SwiftPay QRPH", callback_data: "wizard:/scanqr" },
      { label: "🔴 Alipay", callback_data: "wizard:/alipay" },
      { label: "💚 WeChat", callback_data: "wizard:/wechat" }
    ]
  },
  {
    category: "Wallet",
    buttons: [
      { label: "💰 Wallet", switch_inline_query_current_chat: "/wallet " },
      { label: "💸 Payout", callback_data: "wizard:/disburse" }
    ]
  },
  {
    category: "Transfers",
    buttons: [
      { label: "📤 Send PHP", callback_data: "wizard:/send" },
      { label: "🔍 Status", callback_data: "wizard:/status" }
    ]
  },
  {
    category: "Top Up",
    buttons: [
      { label: "⬆️ Top Up", callback_data: "wizard:/topup" },
      { label: "Bank Deposit", callback_data: "wizard:/deposit" }
    ]
  }
];
const DEFAULT_TEMPLATES = {
  welcome_message_en: "👋 Welcome to SwiftPay Philippines!\n────────────────────────\nHi {name}! 🎉 Your merchant bot is ready.\n\nYou can now:\n🔗 Create SwiftPay payment links\n📱 Accept SwiftPay QRPH payments\n🔴 Accept Alipay via Magpie\n💚 Accept WeChat Pay via Magpie\n💰 Manage your wallet and payouts\n\nType /help for the full command guide.",
  welcome_message_zh: "👋 欢迎使用 SwiftPay Philippines！\n────────────────────────\n你好 {name}！🎉 您的商户机器人已就绪。\n\n现在您可以：\n🔗 生成 SwiftPay 付款链接\n📱 接受 SwiftPay QRPH 付款\n🔴 通过 Magpie 接受支付宝\n💚 通过 Magpie 接受微信支付\n💰 管理钱包和付款\n\n输入 /help 查看完整命令列表。",
  payment_success_message: "✅ Payment Successful!\n────────────────────────\nYour payment has been confirmed and processed.\n\nAmount: {amount}\nReference: {reference}\nTime: {timestamp}\n\nThank you for using SwiftPay!",
  payment_failed_message: "❌ Payment Failed\n────────────────────────\nUnfortunately, your payment could not be processed.\n\nAmount: {amount}\nReason: Payment expired or cancelled\n\nPlease try again or contact support if the issue persists.",
  payment_pending_message: "⏳ Payment Pending\n────────────────────────\nYour payment is awaiting confirmation.\n\nAmount: {amount}\nReference: {reference}\nStatus: Processing...\n\nWe'll notify you once it's complete.",
  maintenance_message: "🔧 Bot is under maintenance\nWe'll be back shortly. Thank you for your patience!"
};
const TUTORIAL_STEPS = [
  {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-10 w-10 text-blue-400" }),
    title: "Create a bot on BotFather",
    body: 'Open Telegram and search for @BotFather. Send /newbot, pick any display name, then choose a username that ends in "bot". BotFather will give you a bot token.',
    tip: "Keep your token safe. Anyone with the token can control your bot.",
    color: "blue"
  },
  {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "h-10 w-10 text-violet-400" }),
    title: "Enter your bot token",
    body: "Go to the Overview tab. Paste your BotFather token into the input field, then click Validate Token to confirm it works.",
    tip: "The token is stored securely and never shared.",
    color: "violet"
  },
  {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Webhook, { className: "h-10 w-10 text-purple-400" }),
    title: "Setup the webhook",
    body: "After validating your token, click Setup Webhook. This registers your bot with this platform so all messages are handled automatically.",
    tip: "Webhook = the platform receives messages live, 24/7.",
    color: "purple"
  },
  {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-10 w-10 text-emerald-400" }),
    title: "You're ready!",
    body: "Open Telegram, find your bot, and send /start. Customise welcome messages in the Messages tab and check available commands in the Commands tab.",
    tip: "Share your bot link t.me/yourbotusername with customers.",
    color: "emerald"
  }
];
function TutorialOverlay({ onDone }) {
  const [step, setStep] = reactExports.useState(0);
  const s = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const colorMap = {
    blue: "bg-blue-500/15 border-blue-500/30",
    violet: "bg-violet-500/15 border-violet-500/30",
    purple: "bg-purple-500/15 border-purple-500/30",
    emerald: "bg-emerald-500/15 border-emerald-500/30"
  };
  const tipMap = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-300",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-300",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-auto relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-5 pt-5 pb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-5 w-5 text-blue-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-semibold text-sm", children: "Bot Setup Guide" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Close bot setup guide", title: "Close bot setup guide", onClick: onDone, className: "text-muted-foreground hover:text-foreground transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-5 pb-4", children: [
      TUTORIAL_STEPS.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": `Go to tutorial step ${i + 1}`, title: `Go to tutorial step ${i + 1}`, onClick: () => setStep(i), className: `h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-blue-400" : i < step ? "w-3 bg-blue-600" : "w-3 bg-muted"}` }, i)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto text-[11px] text-muted-foreground", children: [
        step + 1,
        " of ",
        TUTORIAL_STEPS.length
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto px-5 pb-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex items-center justify-center h-20 w-20 rounded-2xl border mx-auto mb-5 ${colorMap[s.color]}`, children: s.icon }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-foreground font-semibold text-lg text-center mb-3", children: s.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm text-center leading-relaxed mb-4", children: s.body }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-start gap-2 rounded-xl border px-3 py-2.5 mb-6 ${tipMap[s.color]}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed", children: s.tip })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        step > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setStep(step - 1), className: "flex-1 border-border text-muted-foreground hover:text-foreground hover:bg-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }),
          "Back"
        ] }),
        step === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onDone, className: "flex-1 text-muted-foreground hover:text-foreground", children: "Skip tutorial" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: isLast ? onDone : () => setStep(step + 1), className: "flex-1 bg-blue-600 hover:bg-blue-700 text-white", children: isLast ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 mr-1" }),
          " Get Started"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "Next ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 ml-1" })
        ] }) })
      ] })
    ] })
  ] }) });
}
function BotSettings() {
  const { user, login } = useAuth();
  const [showTutorial, setShowTutorial] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_KEY)) setShowTutorial(true);
  }, []);
  const dismissTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setShowTutorial(false);
  };
  const [cloneToken, setCloneToken] = reactExports.useState("");
  const [showToken, setShowToken] = reactExports.useState(false);
  const [cloneValidating, setCloneValidating] = reactExports.useState(false);
  const [cloneSaving, setCloneSaving] = reactExports.useState(false);
  const [cloneValidated, setCloneValidated] = reactExports.useState(null);
  const [cloneInfo, setCloneInfo] = reactExports.useState(null);
  const [botInfo, setBotInfo] = reactExports.useState(null);
  const [botLoading, setBotLoading] = reactExports.useState(false);
  const [botError, setBotError] = reactExports.useState("");
  const [webhookUrl, setWebhookUrl] = reactExports.useState("");
  const [webhookLoading, setWebhookLoading] = reactExports.useState(false);
  const [webhookInfo, setWebhookInfo] = reactExports.useState(null);
  const [webhookInfoLoading, setWebhookInfoLoading] = reactExports.useState(false);
  const [autoSetupLoading, setAutoSetupLoading] = reactExports.useState(false);
  const [chatId, setChatId] = reactExports.useState("");
  const [testMessage, setTestMessage] = reactExports.useState("");
  const [sendLoading, setSendLoading] = reactExports.useState(false);
  const [testChecks, setTestChecks] = reactExports.useState([]);
  const [testLoading, setTestLoading] = reactExports.useState(false);
  const [testRan, setTestRan] = reactExports.useState(false);
  const [botConfig, setBotConfig] = reactExports.useState(null);
  const [configLoading, setConfigLoading] = reactExports.useState(false);
  const [configSaving, setConfigSaving] = reactExports.useState(false);
  const [localConfig, setLocalConfig] = reactExports.useState({
    bot_status: "inactive",
    maintenance_mode: "off",
    welcome_message_en: "",
    welcome_message_zh: "",
    payment_success_message: "",
    payment_failed_message: "",
    payment_pending_message: "",
    maintenance_message: "",
    commands_enabled: "",
    whatsapp_number: "",
    official_channel_username: "PayBotPH"
  });
  const [expandedCategories, setExpandedCategories] = reactExports.useState(
    Object.fromEntries(COMMAND_CATEGORIES.map((c) => [c, true]))
  );
  const [commandSearch, setCommandSearch] = reactExports.useState("");
  const getErr = (e) => {
    var _a, _b;
    const err = e;
    return ((_a = err == null ? void 0 : err.data) == null ? void 0 : _a.detail) || ((_b = err == null ? void 0 : err.data) == null ? void 0 : _b.message) || (err == null ? void 0 : err.message) || "Unknown error";
  };
  const is401 = (e) => {
    var _a;
    const err = e;
    return (err == null ? void 0 : err.status) === 401 || typeof ((_a = err == null ? void 0 : err.data) == null ? void 0 : _a.detail) === "string" && err.data.detail.toLowerCase().includes("unauthorized");
  };
  const fetchBotInfo = reactExports.useCallback(async () => {
    var _a, _b, _c;
    setBotLoading(true);
    setBotError("");
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/bot-info", method: "GET", data: {} });
      if ((_a = res.data) == null ? void 0 : _a.success) setBotInfo(res.data.data);
      else {
        setBotError(((_b = res.data) == null ? void 0 : _b.message) || "Failed");
        ue.error(((_c = res.data) == null ? void 0 : _c.message) || "Failed to get bot info");
      }
    } catch (e) {
      if (is401(e)) setBotError("Authentication required.");
      else {
        const m = getErr(e);
        setBotError(m);
        ue.error(`Bot connection failed: ${m}`);
      }
    } finally {
      setBotLoading(false);
    }
  }, []);
  const fetchWebhookInfo = reactExports.useCallback(async () => {
    setWebhookInfoLoading(true);
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/webhook-info", method: "GET", data: {} });
      setWebhookInfo(res.data);
    } catch (e) {
      if (!is401(e)) ue.error(`Could not fetch webhook status: ${getErr(e)}`);
    } finally {
      setWebhookInfoLoading(false);
    }
  }, []);
  const fetchCloneInfo = reactExports.useCallback(async () => {
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/clone-bot/info", method: "GET", data: {} });
      setCloneInfo(res.data);
    } catch {
    }
  }, []);
  const fetchBotConfig = reactExports.useCallback(async () => {
    var _a;
    if (!user) return;
    setConfigLoading(true);
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/bot-config", method: "GET", data: {} });
      if ((_a = res.data) == null ? void 0 : _a.success) {
        const cfg = res.data;
        setBotConfig(cfg);
        setLocalConfig(cfg);
      }
    } catch (e) {
      if (!is401(e)) ue.error(`Could not load bot config: ${getErr(e)}`);
    } finally {
      setConfigLoading(false);
    }
  }, [user]);
  reactExports.useEffect(() => {
    fetchBotInfo();
  }, [fetchBotInfo]);
  reactExports.useEffect(() => {
    if (user) {
      fetchWebhookInfo();
      fetchCloneInfo();
      fetchBotConfig();
    }
  }, [user, fetchWebhookInfo, fetchCloneInfo, fetchBotConfig]);
  const handleCloneValidate = async () => {
    var _a, _b;
    if (!cloneToken.trim()) {
      ue.error("Enter a bot token first");
      return;
    }
    setCloneValidating(true);
    setCloneValidated(null);
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/clone-bot/validate", method: "POST", data: { bot_token: cloneToken.trim() } });
      if ((_a = res.data) == null ? void 0 : _a.success) {
        setCloneValidated(res.data.bot);
        ue.success(`Token valid! Bot: @${res.data.bot.username}`);
      } else ue.error(((_b = res.data) == null ? void 0 : _b.message) || "Invalid token");
    } catch (e) {
      ue.error(getErr(e));
    } finally {
      setCloneValidating(false);
    }
  };
  const handleCloneSave = async () => {
    var _a, _b;
    if (!cloneToken.trim()) {
      ue.error("Validate your token first");
      return;
    }
    setCloneSaving(true);
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/clone-bot/save", method: "POST", data: { bot_token: cloneToken.trim() } });
      if ((_a = res.data) == null ? void 0 : _a.success) {
        ue.success("Bot saved and webhook registered!");
        await fetchCloneInfo();
        setCloneToken("");
        setCloneValidated(null);
      } else ue.error(((_b = res.data) == null ? void 0 : _b.message) || "Save failed");
    } catch (e) {
      ue.error(getErr(e));
    } finally {
      setCloneSaving(false);
    }
  };
  const handleSetWebhook = async () => {
    var _a, _b;
    if (!webhookUrl) {
      ue.error("Enter a webhook URL");
      return;
    }
    setWebhookLoading(true);
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/setup-webhook", method: "POST", data: { webhook_url: webhookUrl } });
      if ((_a = res.data) == null ? void 0 : _a.success) ue.success("Webhook configured!");
      else ue.error(((_b = res.data) == null ? void 0 : _b.message) || "Failed");
    } catch (e) {
      ue.error(is401(e) ? "Please log in first." : getErr(e));
    } finally {
      setWebhookLoading(false);
    }
  };
  const handleAutoSetup = async () => {
    setAutoSetupLoading(true);
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/auto-setup", method: "POST", data: {} });
      const data = res.data;
      if (data == null ? void 0 : data.success) {
        ue.success(data.message || "Webhook registered!");
        await fetchWebhookInfo();
      } else ue.error((data == null ? void 0 : data.message) || "Auto-setup failed");
    } catch (e) {
      ue.error(is401(e) ? "Please log in first." : `Auto-setup failed: ${getErr(e)}`);
    } finally {
      setAutoSetupLoading(false);
    }
  };
  const handleSendMessage = async () => {
    var _a, _b;
    if (!chatId || !testMessage) {
      ue.error("Enter chat ID and message");
      return;
    }
    setSendLoading(true);
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/send-message", method: "POST", data: { chat_id: chatId, message: testMessage } });
      if ((_a = res.data) == null ? void 0 : _a.success) {
        ue.success("Message sent!");
        setTestMessage("");
      } else ue.error(((_b = res.data) == null ? void 0 : _b.message) || "Failed");
    } catch (e) {
      ue.error(is401(e) ? "Please log in first." : getErr(e));
    } finally {
      setSendLoading(false);
    }
  };
  const handleTestBot = async () => {
    setTestLoading(true);
    setTestChecks([]);
    setTestRan(false);
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/test", method: "GET", data: {} });
      const data = res.data;
      if (Array.isArray(data == null ? void 0 : data.checks)) {
        setTestChecks(data.checks);
        setTestRan(true);
        if (data.success) ue.success("Bot is working!");
        else ue.error("Some checks failed.");
      } else ue.error("Unexpected response");
    } catch (e) {
      ue.error(`Test failed: ${getErr(e)}`);
    } finally {
      setTestLoading(false);
    }
  };
  const handleSaveConfig = async () => {
    var _a;
    setConfigSaving(true);
    try {
      const res = await client.apiCall.invoke({ url: "/api/v1/telegram/bot-config", method: "PUT", data: localConfig });
      if ((_a = res.data) == null ? void 0 : _a.success) {
        const cfg = res.data;
        setBotConfig(cfg);
        setLocalConfig(cfg);
        ue.success("Bot settings saved!");
      } else ue.error("Failed to save settings");
    } catch (e) {
      ue.error(is401(e) ? "Please log in first." : getErr(e));
    } finally {
      setConfigSaving(false);
    }
  };
  const handleResetConfig = () => {
    if (botConfig) setLocalConfig(botConfig);
    else setLocalConfig({ bot_status: "inactive", maintenance_mode: "off", welcome_message_en: "", welcome_message_zh: "", payment_success_message: "", payment_failed_message: "", payment_pending_message: "", maintenance_message: "", commands_enabled: "", whatsapp_number: "", official_channel_username: "PayBotPH" });
    ue.info("Changes discarded");
  };
  const setDefaultTemplate = (field) => {
    setLocalConfig((prev) => ({ ...prev, [field]: DEFAULT_TEMPLATES[field] }));
    ue.success("Default template applied");
  };
  const copyToClipboard = (text, label = "Copied!") => {
    navigator.clipboard.writeText(text).then(() => ue.success(label));
  };
  const configChanged = JSON.stringify(localConfig) !== JSON.stringify(botConfig);
  const statusColor = (s) => s === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : s === "maintenance" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-red-500/20 text-red-400 border-red-500/30";
  const UnsavedBar = () => configChanged ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4 text-blue-400 shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-300 flex-1", children: "You have unsaved changes" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: handleResetConfig, className: "border-slate-500 text-slate-200 hover:text-white gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3.5 w-3.5" }),
      " Discard"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: handleSaveConfig, disabled: configSaving, className: "bg-blue-600 hover:bg-blue-700 text-white gap-1.5", children: [
      configSaving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3.5 w-3.5" }),
      " Save"
    ] })
  ] }) : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Layout, { children: [
    showTutorial && /* @__PURE__ */ jsxRuntimeExports.jsx(TutorialOverlay, { onDone: dismissTutorial }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SiteContainer, { className: "py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 mb-6 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-6 w-6 text-blue-400" }),
            " Bot Settings"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-0.5", children: "Configure your Telegram payment bot" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
          botConfig && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: `border text-xs ${statusColor(localConfig.bot_status)}`, children: [
            localConfig.bot_status === "active" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3 w-3 mr-1" }) : localConfig.bot_status === "maintenance" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "h-3 w-3 mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3 w-3 mr-1" }),
            localConfig.bot_status === "active" ? "Active" : localConfig.bot_status === "maintenance" ? "Maintenance" : "Inactive"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowTutorial(true), className: "border-slate-500 text-slate-200 hover:text-foreground hover:bg-muted gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5" }),
            " Setup Guide"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "overview", className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "bg-muted/60 border border-border p-1 h-auto flex-wrap gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "overview", className: "data-[state=active]:bg-blue-600 data-[state=active]:!text-white text-muted-foreground gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-3.5 w-3.5" }),
            " Overview"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "controls", className: "data-[state=active]:bg-blue-600 data-[state=active]:!text-white text-muted-foreground gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleLeft, { className: "h-3.5 w-3.5" }),
            " Controls"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "messages", className: "data-[state=active]:bg-blue-600 data-[state=active]:!text-white text-muted-foreground gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5" }),
            " Messages"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "commands", className: "data-[state=active]:bg-blue-600 data-[state=active]:!text-white text-muted-foreground gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Terminal, { className: "h-3.5 w-3.5" }),
            " Commands"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "buttons", className: "data-[state=active]:bg-blue-600 data-[state=active]:!text-white text-muted-foreground gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-3.5 w-3.5" }),
            " Quick Buttons"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "testing", className: "data-[state=active]:bg-blue-600 data-[state=active]:!text-white text-muted-foreground gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "h-3.5 w-3.5" }),
            " Testing"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "overview", className: "space-y-6 mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "md:col-span-2 bg-card border-blue-500/30 ring-1 ring-blue-500/15", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-4 w-4 text-blue-400" }) }),
              "Clone Your Bot",
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-1 bg-blue-500/15 text-blue-300 border-blue-500/30 border text-[10px]", children: "NEW" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setShowTutorial(true), className: "ml-auto text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-normal", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3 w-3" }),
                " How it works"
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
                "Use your own Telegram bot with this platform. Create a bot via ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-400 font-medium", children: "@BotFather" }),
                ", enter your token, and we'll handle everything else."
              ] }),
              (cloneInfo == null ? void 0 : cloneInfo.configured) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-emerald-400" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-300 font-semibold text-sm", children: "Bot connected" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-[10px]", children: "ACTIVE" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/60 rounded-lg p-2.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground mb-0.5", children: "Bot Name" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground font-medium", children: cloneInfo.bot_name })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/60 rounded-lg p-2.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground mb-0.5", children: "Username" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-blue-400 font-mono", children: [
                      "@",
                      cloneInfo.bot_username
                    ] })
                  ] })
                ] }),
                cloneInfo.webhook_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/60 rounded-lg p-2.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "Webhook URL" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => copyToClipboard(cloneInfo.webhook_url, "Webhook URL copied"), className: "text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-mono text-muted-foreground break-all", children: cloneInfo.webhook_url })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: "To switch bots, enter a new token below and click Setup Webhook." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground mb-1.5 block", children: "BotFather Token" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        type: showToken ? "text" : "password",
                        placeholder: "1234567890:AAF...",
                        value: cloneToken,
                        onChange: (e) => {
                          setCloneToken(e.target.value);
                          setCloneValidated(null);
                        },
                        className: "bg-muted border-border text-foreground placeholder:text-muted-foreground pr-9 font-mono text-sm"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowToken(!showToken), className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: showToken ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCloneValidate, disabled: cloneValidating || !cloneToken.trim(), variant: "outline", className: "border-blue-500/40 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/60", children: cloneValidating ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Validate" })
                ] })
              ] }),
              cloneValidated && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-500/10 border border-blue-500/25 rounded-xl p-4 space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-5 w-5 text-blue-400" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold", children: cloneValidated.first_name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-blue-400 text-sm", children: [
                      "@",
                      cloneValidated.username
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "ml-auto bg-blue-500/20 text-blue-300 border-blue-500/30 border text-[10px]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3 w-3 mr-1" }),
                    " Valid"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCloneSave, disabled: cloneSaving, className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium", children: cloneSaving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
                  "Saving..."
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Webhook, { className: "h-4 w-4 mr-2" }),
                  "Setup Webhook"
                ] }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/40 rounded-xl p-3 border border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-2", children: "Quick steps" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-1", children: ["Open Telegram → @BotFather → /newbot", "Choose a name and @username", "Copy the token, paste above, click Validate", "Click Setup Webhook — done!"].map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2 text-xs text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-4 w-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5", children: i + 1 }),
                  s
                ] }, i)) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `border ${webhookInfo === null ? "bg-card border-border" : webhookInfo.is_registered ? "bg-emerald-900/20 border-emerald-500/40" : "bg-red-900/20 border-red-500/40"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Webhook, { className: "h-5 w-5 text-purple-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Webhook Status" }),
              webhookInfo && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `ml-auto text-xs font-normal px-2 py-0.5 rounded-full ${webhookInfo.is_registered ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`, children: webhookInfo.is_registered ? "● Active" : "● Inactive" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              webhookInfoLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin text-purple-400" }) }) : !user ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Log in to see webhook status." }) : webhookInfo ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                !webhookInfo.token_configured && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-red-400 mt-0.5 shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-300", children: "Bot token not configured" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/60 rounded-lg p-3 space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Current webhook URL" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-mono text-foreground break-all", children: webhookInfo.webhook_url })
                ] }),
                webhookInfo.pending_update_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3 w-3 text-amber-400" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-amber-300", children: [
                    webhookInfo.pending_update_count,
                    " pending updates"
                  ] })
                ] }),
                webhookInfo.last_error_message && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-red-500/10 border border-red-500/20 rounded-lg p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-red-300", children: [
                  "Last error: ",
                  webhookInfo.last_error_message
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: webhookInfo.message })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Could not load webhook status." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleAutoSetup, disabled: autoSetupLoading || !user, className: "flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm", children: autoSetupLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 mr-1 animate-spin" }),
                  "Setting up..."
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-3 w-3 mr-1" }),
                  "Auto-Setup"
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: fetchWebhookInfo, disabled: webhookInfoLoading || !user, variant: "outline", size: "icon", className: "border-border text-muted-foreground hover:text-foreground hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-3 w-3 ${webhookInfoLoading ? "animate-spin" : ""}` }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-5 w-5 text-blue-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Bot Information" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: botLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-blue-400" }) }) : botInfo ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-6 w-6 text-blue-400" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground", children: botInfo.first_name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
                    "@",
                    botInfo.username
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border ml-auto", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3 w-3 mr-1" }),
                  " Connected"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/50 rounded-lg p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Bot ID" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-sm text-foreground font-mono", children: botInfo.id })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: fetchBotInfo, variant: "outline", size: "sm", className: "w-full border-slate-500 text-slate-200 hover:text-foreground hover:bg-muted", children: "Refresh Info" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-12 w-12 text-red-400 mx-auto mb-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-3", children: "Bot not connected" }),
              botError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3 text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-400 font-mono break-all", children: botError }) }),
              (botError == null ? void 0 : botError.includes("Authentication required")) && !user ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => login(), size: "sm", className: "bg-blue-600 hover:bg-blue-700 text-white", children: "Log In" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: fetchBotInfo, variant: "outline", size: "sm", className: "border-slate-500 text-slate-200 hover:text-foreground hover:bg-muted", children: "Retry" })
            ] }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "controls", className: "space-y-6 mt-0", children: !user ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-12 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-4", children: "Log in to manage bot controls" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => login(), children: "Log In" })
        ] }) }) : configLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-blue-400" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UnsavedBar, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Power, { className: "h-5 w-5 text-emerald-400" }),
              "Bot Status"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Control whether your bot is accepting commands from users." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: ["active", "inactive", "maintenance"].map((status) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => setLocalConfig((prev) => ({ ...prev, bot_status: status })),
                  className: `rounded-xl border p-4 text-left transition-all ${localConfig.bot_status === status ? status === "active" ? "border-emerald-500/60 bg-emerald-500/10" : status === "inactive" ? "border-red-500/60 bg-red-500/10" : "border-amber-500/60 bg-amber-500/10" : "border-border hover:border-border/80"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                      status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-emerald-400" }),
                      status === "inactive" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-red-400" }),
                      status === "maintenance" && /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "h-4 w-4 text-amber-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-sm font-semibold capitalize ${localConfig.bot_status === status ? status === "active" ? "text-emerald-300" : status === "maintenance" ? "text-amber-300" : "text-red-300" : "text-muted-foreground"}`, children: status }),
                      localConfig.bot_status === status && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5 ml-auto text-blue-400" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: status === "active" ? "Bot responds to all commands" : status === "inactive" ? "Bot ignores all messages" : "Bot sends maintenance message" })
                  ]
                },
                status
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "h-5 w-5 text-amber-400" }),
              "Maintenance Mode"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground text-sm font-medium", children: "Enable maintenance mode" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-0.5", children: "Bot sends the maintenance message to all users" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: localConfig.maintenance_mode === "on", onCheckedChange: (checked) => setLocalConfig((prev) => ({ ...prev, maintenance_mode: checked ? "on" : "off", bot_status: checked ? "maintenance" : prev.bot_status === "maintenance" ? "active" : prev.bot_status })) })
              ] }),
              localConfig.maintenance_mode === "on" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-400 mt-0.5 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-amber-300", children: [
                  "Maintenance mode is active. Edit the message in the ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Messages" }),
                  " tab."
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-5 w-5 text-green-400" }),
              "Public Channels"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Configure the official Telegram channel shown in the bot start panel and the social contact used on the registration page." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground mb-1.5 block", children: "Official Telegram Channel" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "text",
                    placeholder: "PayBotPH",
                    value: localConfig.official_channel_username,
                    onChange: (e) => setLocalConfig((prev) => ({ ...prev, official_channel_username: e.target.value.replace(/^@/, "") })),
                    className: "bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-1", children: "Enter the channel username, with or without @. Leave blank to hide the channel from the bot start panel." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground mb-1.5 block", children: "WhatsApp Number" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "tel",
                    placeholder: "e.g. 639171234567 (country code + number)",
                    value: localConfig.whatsapp_number,
                    onChange: (e) => setLocalConfig((prev) => ({ ...prev, whatsapp_number: e.target.value })),
                    className: "bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-1", children: "Include country code without + (e.g. 63 for Philippines). Leave blank to hide the WhatsApp button." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Webhook, { className: "h-5 w-5 text-purple-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Webhook Configuration" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start space-x-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4 text-blue-400 mt-0.5 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-blue-300", children: [
                  "Set webhook to: ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-muted px-1 rounded", children: "https://api.swiftpay.site/api/v1/telegram/webhook" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground", children: "Webhook URL" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "https://api.swiftpay.site/api/v1/telegram/webhook", value: webhookUrl, onChange: (e) => setWebhookUrl(e.target.value), className: "mt-1 bg-muted border-border text-foreground placeholder:text-muted-foreground" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSetWebhook, disabled: webhookLoading, className: "w-full bg-purple-600 hover:bg-purple-700 text-white", children: webhookLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
                "Setting Webhook..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Webhook, { className: "h-4 w-4 mr-2" }),
                "Set Webhook"
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleResetConfig, className: "border-slate-500 text-slate-200 hover:text-foreground gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-4 w-4" }),
              " Discard"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSaveConfig, disabled: configSaving || !configChanged, className: "bg-blue-600 hover:bg-blue-700 text-white gap-1.5", children: [
              configSaving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
              " Save Settings"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "messages", className: "space-y-6 mt-0", children: !user ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-12 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-4", children: "Log in to edit message templates" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => login(), children: "Log In" })
        ] }) }) : configLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-blue-400" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UnsavedBar, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/40 rounded-xl p-3 border border-border flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4 text-muted-foreground mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Supported placeholders: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-muted px-1 rounded text-muted-foreground", children: "{name}" }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-muted px-1 rounded text-muted-foreground", children: "{amount}" }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-muted px-1 rounded text-muted-foreground", children: "{reference}" }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-muted px-1 rounded text-muted-foreground", children: "{timestamp}" })
            ] })
          ] }),
          [
            { field: "welcome_message_en", title: "Welcome Message (English)", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-4 w-4 text-blue-400" }), desc: "Shown when a user sends /start and selects English", rows: 5 },
            { field: "welcome_message_zh", title: "Welcome Message (Chinese)", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-4 w-4 text-red-400" }), desc: "Shown when a user sends /start and selects Chinese", rows: 5 },
            { field: "payment_success_message", title: "Payment Success Message", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-emerald-400" }), desc: "Sent when a payment is confirmed and processed", rows: 4 },
            { field: "payment_failed_message", title: "Payment Failed / Expired Message", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-red-400" }), desc: "Sent when a payment expires or is cancelled", rows: 4 },
            { field: "payment_pending_message", title: "Payment Pending Message", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 text-amber-400" }), desc: "Sent when a payment is awaiting confirmation", rows: 4 },
            { field: "maintenance_message", title: "Maintenance Message", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "h-4 w-4 text-amber-400" }), desc: "Sent to all users when bot is in maintenance mode", rows: 3 }
          ].map(({ field, title, icon, desc, rows }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center gap-2 text-base", children: [
              icon,
              title
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: desc }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  value: localConfig[field],
                  onChange: (e) => setLocalConfig((prev) => ({ ...prev, [field]: e.target.value })),
                  placeholder: "Leave empty to use default...",
                  className: "bg-muted border-border text-foreground placeholder:text-muted-foreground font-mono text-xs resize-y",
                  rows
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-muted-foreground", children: [
                  localConfig[field].length,
                  " chars"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => setDefaultTemplate(field), className: "border-slate-500 text-muted-foreground hover:text-foreground text-xs gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3 w-3" }),
                  " Use Default"
                ] })
              ] })
            ] })
          ] }, field)),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleResetConfig, className: "border-slate-500 text-slate-200 hover:text-foreground gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-4 w-4" }),
              " Discard"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSaveConfig, disabled: configSaving || !configChanged, className: "bg-blue-600 hover:bg-blue-700 text-white gap-1.5", children: [
              configSaving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
              " Save Messages"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "commands", className: "space-y-4 mt-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Terminal, { className: "h-5 w-5 text-cyan-400" }),
                  "Available Bot Commands"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => copyToClipboard(BOT_COMMANDS.map((c) => `${c.cmd.replace("/", "")} - ${c.desc}`).join("\n"), "Command list copied!"), className: "border-border text-muted-foreground hover:text-foreground gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" }),
                  " Copy all"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: commandSearch, onChange: (e) => setCommandSearch(e.target.value), placeholder: "Search commands or descriptions...", className: "bg-muted border-border text-foreground placeholder:text-muted-foreground pl-9" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mb-4", children: [
                BOT_COMMANDS.length,
                " commands built into your bot. Legacy commands have been removed."
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                COMMAND_CATEGORIES.map((cat) => {
                  const searchTerm = commandSearch.trim().toLowerCase();
                  const cmds = BOT_COMMANDS.filter((c) => c.category === cat && (!searchTerm || c.cmd.includes(searchTerm) || c.desc.toLowerCase().includes(searchTerm)));
                  const isExpanded = expandedCategories[cat];
                  if (searchTerm && cmds.length === 0) return null;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border rounded-xl overflow-hidden", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        onClick: () => setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] })),
                        className: "w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-medium text-sm", children: cat }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-muted text-muted-foreground border-0 text-[10px]", children: cmds.length })
                          ] }),
                          isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4 text-muted-foreground" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })
                        ]
                      }
                    ),
                    isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-slate-700/40", children: cmds.map(({ cmd, emoji, desc }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg w-6 text-center", children: emoji }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-blue-400 font-mono text-sm font-medium w-28 shrink-0", children: cmd }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm flex-1", children: desc }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": `Copy ${cmd}`, onClick: () => copyToClipboard(cmd, `${cmd} copied!`), className: "text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" }) })
                    ] }, cmd)) })
                  ] }, cat);
                }),
                commandSearch.trim() && !BOT_COMMANDS.some((c) => c.cmd.includes(commandSearch.trim().toLowerCase()) || c.desc.toLowerCase().includes(commandSearch.trim().toLowerCase())) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border px-4 py-8 text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-5 w-5 text-muted-foreground mx-auto mb-2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
                    'No commands match "',
                    commandSearch.trim(),
                    '".'
                  ] })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center gap-2 text-base", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-4 w-4 text-blue-400" }),
              "Register with BotFather"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                "Paste the list below to @BotFather using ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-muted px-1 rounded", children: "/setcommands" }),
                " to enable autocomplete for users."
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-background border border-border rounded-lg p-4 text-[11px] text-muted-foreground font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap", children: BOT_COMMANDS.map((c) => `${c.cmd.replace("/", "")} - ${c.desc}`).join("\n") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => copyToClipboard(BOT_COMMANDS.map((c) => `${c.cmd.replace("/", "")} - ${c.desc}`).join("\n"), "Command list copied!"),
                    className: "absolute top-2 right-2 text-muted-foreground hover:text-foreground bg-muted rounded p-1.5",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-1", children: ["Open Telegram → @BotFather", "Send /setcommands and select your bot", "Paste the list above and send"].map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-4 w-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5", children: i + 1 }),
                s
              ] }, i)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "buttons", className: "space-y-4 mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-blue-500/10 border-blue-500/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-5 w-5 text-blue-400" }),
            "Preset Quick Action Buttons"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-6", children: "These are quick action buttons that will appear in the main menu for users to streamline common operations." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: PRESET_BUTTONS.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground mb-3", children: group.category }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: group.buttons.map((btn) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/60 rounded-lg p-3 border border-border/50 hover:border-blue-500/30 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-foreground", children: btn.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => copyToClipboard(btn.callback_data ?? "", "Copied!"), className: "text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground font-mono mt-2 break-all", children: btn.callback_data })
              ] }, btn.callback_data ?? btn.label)) })
            ] }, group.category)) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "testing", className: "space-y-6 mt-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "h-5 w-5 text-green-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Test Bot Connection" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Confirm the bot token is configured and Telegram API is reachable." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleTestBot, disabled: testLoading, className: "w-full bg-green-600 hover:bg-green-700 text-white font-medium", children: testLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
                "Running Tests..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "h-4 w-4 mr-2" }),
                "Run Bot Test"
              ] }) }),
              testRan && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 pt-1", children: testChecks.map((check) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-start space-x-3 rounded-lg p-3 ${check.passed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`, children: [
                check.passed ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-emerald-400 mt-0.5 shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-red-400 mt-0.5 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm font-medium ${check.passed ? "text-emerald-300" : "text-red-300"}`, children: check.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: check.detail })
                ] })
              ] }, check.name)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-foreground flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-5 w-5 text-cyan-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Send Test Message" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground", children: "Chat ID" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Telegram chat ID", value: chatId, onChange: (e) => setChatId(e.target.value), className: "mt-1 bg-muted border-border text-foreground placeholder:text-muted-foreground" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground", children: "Message" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex mt-1 space-x-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "Type your test message...", value: testMessage, onChange: (e) => setTestMessage(e.target.value), className: "bg-muted border-border text-foreground placeholder:text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSendMessage, disabled: sendLoading, className: "bg-cyan-600 hover:bg-cyan-700 text-white shrink-0", children: sendLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }) })
                ] })
              ] })
            ] }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  BotSettings as default
};
