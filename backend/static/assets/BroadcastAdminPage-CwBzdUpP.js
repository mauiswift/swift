import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { f as useCollectionCurrency, b as ue, L as Layout, T as Textarea, e as Button } from "./index-C9--HWz5.js";
import { I as Input } from "./input-BNwcvOTx.js";
import { L as Label } from "./label-CTVR0ZgA.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Jb9qAn3I.js";
import { X, z as LoaderCircle, al as Plus, p as CircleAlert, bi as Pen, at as Trash2, o as CircleCheckBig, T as TriangleAlert, I as Info } from "./utils-vendor-DoKCqRlq.js";
import "./ui-vendor-DsSOT9J9.js";
const PRESET_TEMPLATES = {
  maintenance: [
    {
      id: "maintenance-window",
      name: "Scheduled Maintenance",
      title: "Scheduled Maintenance",
      type: "warning",
      priority: 3,
      message: "We will be performing scheduled maintenance to improve system reliability and security.\n\nDuring this window, some services may be temporarily unavailable or slower than usual.\n\nPlanned window: [DATE/TIME]\n\nThank you for your patience while we complete this work."
    },
    {
      id: "maintenance-complete",
      name: "Maintenance Complete",
      title: "Maintenance Complete",
      type: "success",
      priority: 2,
      message: "The scheduled maintenance has been completed successfully.\n\nAll services are now operating normally.\n\nThank you for your patience and cooperation while we improved the platform."
    }
  ],
  incident: [
    {
      id: "service-disruption",
      name: "Service Disruption",
      title: "Service Interruption",
      type: "error",
      priority: 3,
      message: "We are currently experiencing a service disruption affecting some features.\n\nOur team is actively investigating and working to restore full service as quickly as possible.\n\nIf you are unable to complete a transaction, please try again shortly or contact support for assistance."
    },
    {
      id: "incident-update",
      name: "Incident Update",
      title: "Update on Ongoing Service Issue",
      type: "warning",
      priority: 3,
      message: "We are continuing to investigate the service issue affecting some users.\n\nOur team is working to resolve the problem and restore normal operations as quickly as possible.\n\nWe will share another update as soon as there is progress or an estimated recovery time."
    }
  ],
  updates: [
    {
      id: "general-update",
      name: "General Update",
      title: "Service Update",
      type: "info",
      priority: 2,
      message: "We are making an update to improve the service experience for all users.\n\nPlease expect brief interruptions or delayed processing during this period.\n\nThank you for your patience and understanding."
    },
    {
      id: "feature-launch",
      name: "Feature Launch",
      title: "New Feature Available",
      type: "success",
      priority: 2,
      message: "A new feature has been released to improve your experience.\n\nYou can now access the updated functionality and take advantage of the improved workflow.\n\nWe appreciate your feedback and continued support."
    }
  ],
  security: [
    {
      id: "security-notice",
      name: "Security Notice",
      title: "Important Security Notice",
      type: "warning",
      priority: 3,
      message: "This is an important security notice regarding account or service activity.\n\nPlease ensure that your login details remain secure and be cautious of unexpected requests for personal or payment information.\n\nIf you see anything suspicious, contact support immediately."
    },
    {
      id: "security-clearance",
      name: "Security Update",
      title: "Security Update",
      type: "success",
      priority: 2,
      message: "We have completed a security update to improve safety and protection across the platform.\n\nNo action is required from users, but we recommend reviewing your account security settings and keeping your credentials secure."
    }
  ]
};
const PRESET_CATEGORIES = [
  { id: "maintenance", label: "Maintenance" },
  { id: "incident", label: "Incident" },
  { id: "updates", label: "Updates" },
  { id: "security", label: "Security" }
];
const KOREAN_PRESET_COPY = {
  "maintenance-window": {
    name: "예정된 점검",
    title: "예정된 시스템 점검",
    message: "시스템 안정성과 보안을 개선하기 위해 예정된 점검을 진행합니다.\n\n점검 중 일부 서비스를 일시적으로 이용할 수 없거나 평소보다 느릴 수 있습니다.\n\n예정 시간: [날짜/시간]\n\n이용에 불편을 드려 죄송하며 양해해 주셔서 감사합니다."
  },
  "maintenance-complete": {
    name: "점검 완료",
    title: "시스템 점검 완료",
    message: "예정된 시스템 점검이 성공적으로 완료되었습니다.\n\n모든 서비스가 정상적으로 운영되고 있습니다.\n\n기다려 주시고 협조해 주셔서 감사합니다."
  },
  "service-disruption": {
    name: "서비스 장애",
    title: "서비스 일시 중단 안내",
    message: "현재 일부 기능에 영향을 주는 서비스 장애가 발생했습니다.\n\n담당 팀이 원인을 확인하고 최대한 빠르게 정상화하고 있습니다.\n\n거래가 완료되지 않으면 잠시 후 다시 시도하거나 고객센터에 문의해 주세요."
  },
  "incident-update": {
    name: "장애 진행 안내",
    title: "서비스 장애 진행 안내",
    message: "일부 사용자에게 영향을 주는 서비스 문제를 계속 확인하고 있습니다.\n\n정상 운영을 위해 복구 작업을 진행 중이며, 진행 상황이 확인되는 즉시 다시 안내드리겠습니다."
  },
  "general-update": {
    name: "일반 안내",
    title: "서비스 업데이트 안내",
    message: "모든 사용자의 서비스 이용 경험을 개선하기 위한 업데이트를 진행합니다.\n\n이 기간 동안 짧은 중단이나 처리 지연이 발생할 수 있습니다.\n\n기다려 주셔서 감사합니다."
  },
  "feature-launch": {
    name: "새 기능 안내",
    title: "새 기능을 이용할 수 있습니다",
    message: "이용 경험을 개선하기 위한 새 기능이 출시되었습니다.\n\n업데이트된 기능을 이용해 더 편리한 업무 흐름을 경험해 보세요.\n\n관심과 의견을 보내주셔서 감사합니다."
  },
  "security-notice": {
    name: "보안 안내",
    title: "중요 보안 안내",
    message: "계정 또는 서비스 활동과 관련된 중요한 보안 안내입니다.\n\n로그인 정보를 안전하게 관리하고 개인정보나 결제 정보를 요구하는 의심스러운 요청에 주의해 주세요.\n\n의심스러운 활동이 발견되면 즉시 고객센터에 문의해 주세요."
  },
  "security-clearance": {
    name: "보안 업데이트",
    title: "보안 업데이트 완료",
    message: "플랫폼 전반의 안전성과 보호 기능을 개선하는 보안 업데이트가 완료되었습니다.\n\n추가 조치는 필요하지 않지만 계정 보안 설정을 확인하고 인증 정보를 안전하게 관리해 주세요."
  }
};
function BroadcastAdminPage() {
  const { collectionCurrency } = useCollectionCurrency();
  const isKorean = collectionCurrency === "KRW";
  const ui = isKorean ? {
    title: "공지 메시지",
    description: "모든 사용자 페이지에 표시되는 긴급 안내를 작성합니다",
    quickPresets: "빠른 템플릿",
    edit: "공지 수정",
    create: "새 공지 작성",
    cancel: "취소",
    titleLabel: "제목",
    messageLabel: "메시지",
    titlePlaceholder: "예: 시스템 점검 예정",
    messagePlaceholder: "공지 메시지를 입력하세요 (여러 줄 지원)...",
    type: "유형",
    priority: "우선순위",
    currency: "통화 채널",
    expires: "만료 시간 (선택)",
    allCurrencies: "모든 통화",
    low: "낮음",
    medium: "보통",
    high: "긴급 (로그인마다 표시)",
    save: "저장 중...",
    update: "업데이트",
    createButton: "작성",
    broadcasts: "공지",
    active: "활성",
    inactive: "비활성",
    expired: "만료",
    noBroadcasts: "공지가 없습니다",
    editAction: "수정",
    deactivate: "비활성화",
    delete: "삭제"
  } : {
    title: "Broadcast Messages",
    description: "Create urgent notices that appear on all user pages",
    quickPresets: "Quick Presets",
    edit: "Edit Broadcast",
    create: "Create New Broadcast",
    cancel: "Cancel",
    titleLabel: "Title",
    messageLabel: "Message",
    titlePlaceholder: "e.g., System Maintenance Scheduled",
    messagePlaceholder: "Enter the broadcast message (supports multiple lines)...",
    type: "Type",
    priority: "Priority",
    currency: "Currency channel",
    expires: "Expires At (optional)",
    allCurrencies: "All currencies",
    low: "Low",
    medium: "Medium",
    high: "Critical (reappears at login)",
    save: "Saving...",
    update: "Update",
    createButton: "Create",
    broadcasts: "Broadcasts",
    active: "Active",
    inactive: "Inactive",
    expired: "Expired",
    noBroadcasts: "No broadcasts found",
    editAction: "Edit",
    deactivate: "Deactivate",
    delete: "Delete"
  };
  const [broadcasts, setBroadcasts] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [creating, setCreating] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [filter, setFilter] = reactExports.useState("active");
  const [selectedPresetCategory, setSelectedPresetCategory] = reactExports.useState(() => {
    const saved = localStorage.getItem("broadcast-preset-category");
    return PRESET_CATEGORIES.some((category) => category.id === saved) ? saved : "maintenance";
  });
  reactExports.useEffect(() => {
    const savedCategory = localStorage.getItem("broadcast-preset-category");
    const category = PRESET_CATEGORIES.some((item) => item.id === savedCategory) ? savedCategory : "maintenance";
    setSelectedPresetCategory(category);
    const defaultPreset = PRESET_TEMPLATES[category][0];
    const localized = isKorean ? KOREAN_PRESET_COPY[defaultPreset.id] : defaultPreset;
    setTitle(localized.title);
    setMessage(localized.message);
    setType(defaultPreset.type);
    setPriority(String(defaultPreset.priority));
    setIsActive(true);
    setExpiresAt("");
  }, [isKorean]);
  const [title, setTitle] = reactExports.useState("");
  const [message, setMessage] = reactExports.useState("");
  const [type, setType] = reactExports.useState("info");
  const [priority, setPriority] = reactExports.useState("1");
  const [expiresAt, setExpiresAt] = reactExports.useState("");
  const [isActive, setIsActive] = reactExports.useState(true);
  const [currency, setCurrency] = reactExports.useState("ALL");
  const fetchBroadcasts = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/v1/broadcast/admin/all" : `/api/v1/broadcast/admin/all?status=${filter}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(Array.isArray(data.items) ? data.items : []);
      } else {
        ue.error("Failed to load broadcasts");
      }
    } catch (err) {
      console.error(err);
      ue.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [filter]);
  reactExports.useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);
  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("info");
    setPriority("1");
    setCurrency("ALL");
    setExpiresAt("");
    setIsActive(true);
    setEditing(null);
  };
  const handleSave = async () => {
    if (!title || !message) {
      ue.error("Title and message are required");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title,
        message,
        type,
        priority: parseInt(priority),
        currency,
        expires_at: expiresAt || null,
        ...editing && { is_active: isActive }
      };
      const url = editing ? `/api/v1/broadcast/${editing}` : "/api/v1/broadcast";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });
      if (res.ok) {
        ue.success(editing ? "Broadcast updated" : "Broadcast created");
        resetForm();
        fetchBroadcasts();
      } else {
        const error = await res.json();
        ue.error(error.detail || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      ue.error("Network error");
    } finally {
      setCreating(false);
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Delete this broadcast message?")) return;
    try {
      const res = await fetch(`/api/v1/broadcast/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        ue.success("Broadcast deleted");
        fetchBroadcasts();
      } else {
        ue.error("Failed to delete");
      }
    } catch (err) {
      console.error(err);
      ue.error("Network error");
    }
  };
  const handleDeactivate = async (id) => {
    try {
      const res = await fetch(`/api/v1/broadcast/${id}/deactivate`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        ue.success("Broadcast deactivated");
        fetchBroadcasts();
      } else {
        ue.error("Failed to deactivate");
      }
    } catch (err) {
      console.error(err);
      ue.error("Network error");
    }
  };
  const handleEdit = (broadcast) => {
    setEditing(broadcast.id);
    setTitle(broadcast.title);
    setMessage(broadcast.message);
    setType(broadcast.type);
    setPriority(String(broadcast.priority));
    setCurrency(broadcast.currency || "ALL");
    setIsActive(broadcast.is_active);
    setExpiresAt(broadcast.expires_at ? new Date(broadcast.expires_at).toISOString().slice(0, 16) : "");
  };
  const applyPreset = (preset) => {
    const localized = isKorean ? KOREAN_PRESET_COPY[preset.id] : preset;
    setTitle(localized.title);
    setMessage(localized.message);
    setType(preset.type);
    setPriority(String(preset.priority));
    setIsActive(true);
    setExpiresAt("");
  };
  const handlePresetCategoryChange = (categoryId) => {
    setSelectedPresetCategory(categoryId);
    localStorage.setItem("broadcast-preset-category", categoryId);
    const defaultPreset = PRESET_TEMPLATES[categoryId][0];
    if (defaultPreset) {
      applyPreset(defaultPreset);
    }
  };
  const typeIcons = {
    info: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4" }),
    warning: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4" }),
    error: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
    success: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" })
  };
  const typeColors = {
    info: "text-blue-600 bg-blue-50",
    warning: "text-amber-600 bg-amber-50",
    error: "text-red-600 bg-red-50",
    success: "text-emerald-600 bg-emerald-50"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold text-foreground", children: ui.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-2", children: ui.description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground", children: editing ? ui.edit : ui.create }),
        editing && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: resetForm,
            className: "text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
              " ",
              ui.cancel
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-slate-700", children: ui.quickPresets }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: PRESET_CATEGORIES.map((category) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => handlePresetCategoryChange(category.id),
              className: `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selectedPresetCategory === category.id ? "bg-blue-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"}`,
              children: isKorean ? { maintenance: "점검", incident: "장애", updates: "업데이트", security: "보안" }[category.id] : category.label
            },
            category.id
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: PRESET_TEMPLATES[selectedPresetCategory].map((preset) => {
            var _a;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => applyPreset(preset),
                className: "rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
                children: isKorean ? (_a = KOREAN_PRESET_COPY[preset.id]) == null ? void 0 : _a.name : preset.name
              },
              preset.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-slate-700", children: ui.titleLabel }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: ui.titlePlaceholder,
              value: title,
              onChange: (e) => setTitle(e.target.value),
              className: "mt-1 bg-slate-50 border-slate-200"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-slate-700", children: ui.messageLabel }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              placeholder: ui.messagePlaceholder,
              value: message,
              onChange: (e) => setMessage(e.target.value),
              rows: 5,
              className: "mt-1 bg-slate-50 border-slate-200"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-slate-700", children: ui.type }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: type, onValueChange: (v) => setType(v), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-1 bg-slate-50 border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "info", children: "Info" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "warning", children: "Warning" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "error", children: "Error" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "success", children: "Success" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-slate-700", children: ui.priority }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: priority, onValueChange: setPriority, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-1 bg-slate-50 border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "1", children: ui.low }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "2", children: ui.medium }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "3", children: ui.high })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-slate-700", children: ui.currency }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: currency, onValueChange: setCurrency, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-1 bg-slate-50 border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ALL", children: ui.allCurrencies }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "PHP", children: "PHP" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "CNY", children: "CNY" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "KRW", children: "KRW" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-slate-700", children: ui.expires }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "datetime-local",
                value: expiresAt,
                onChange: (e) => setExpiresAt(e.target.value),
                className: "mt-1 bg-slate-50 border-slate-200"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handleSave,
              disabled: creating,
              className: "bg-blue-600 hover:bg-blue-700 text-white",
              children: creating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
                ui.save
              ] }) : editing ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: ui.update }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
                ui.createButton
              ] })
            }
          ),
          editing && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: resetForm, children: ui.cancel })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-semibold text-foreground", children: [
          ui.broadcasts,
          " (",
          broadcasts.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: ["all", "active", "inactive", "expired"].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setFilter(f),
            className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`,
            children: { all: ui.broadcasts, active: ui.active, inactive: ui.inactive, expired: ui.expired }[f]
          },
          f
        )) })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-slate-400" }) }) : broadcasts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: ui.noBroadcasts })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: broadcasts.map((broadcast) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-1.5 rounded ${typeColors[broadcast.type]}`, children: typeIcons[broadcast.type] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-foreground", children: broadcast.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `text-xs px-2 py-0.5 rounded-full font-medium ${broadcast.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`,
                children: broadcast.is_active ? ui.active : ui.inactive
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs px-2 py-0.5 rounded-full font-medium ${broadcast.priority === 3 ? "bg-red-100 text-red-700" : broadcast.priority === 2 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`, children: [
              [ui.low, ui.medium, ui.high][broadcast.priority - 1],
              " ",
              ui.priority
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700", children: broadcast.currency || "ALL" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-wrap", children: broadcast.message }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-2", children: [
            "Created ",
            broadcast.created_at ? new Date(broadcast.created_at).toLocaleString() : "—",
            broadcast.expires_at && ` • Expires ${new Date(broadcast.expires_at).toLocaleString()}`
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handleEdit(broadcast),
              className: "p-2 hover:bg-slate-100 rounded-lg transition-colors text-blue-600",
              title: ui.editAction,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "h-4 w-4" })
            }
          ),
          broadcast.is_active && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handleDeactivate(broadcast.id),
              className: "p-2 hover:bg-slate-100 rounded-lg transition-colors text-amber-600",
              title: ui.deactivate,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handleDelete(broadcast.id),
              className: "p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600",
              title: ui.delete,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
            }
          )
        ] })
      ] }) }, broadcast.id)) })
    ] })
  ] }) });
}
export {
  BroadcastAdminPage as default
};
