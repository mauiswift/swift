import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as useLanguage, d as cn } from "./index-BPsF-pQS.js";
import { p as CircleAlert, z as LoaderCircle, aS as CircleX, aO as Clock, o as CircleCheckBig } from "./utils-vendor-HFbfdctU.js";
const STATUS_CONFIG = {
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: CircleCheckBig,
    label: "Success"
  },
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: CircleCheckBig,
    label: "Success"
  },
  executed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: CircleCheckBig,
    label: "Success"
  },
  pending: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    icon: Clock,
    label: "Processing"
  },
  approved: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    icon: Clock,
    label: "Processing"
  },
  transferring: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    icon: LoaderCircle,
    label: "Processing"
  },
  failed: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    icon: CircleX,
    label: "Failed"
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    icon: CircleX,
    label: "Failed"
  },
  expired: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    icon: CircleX,
    label: "Failed"
  },
  cancelled: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
    icon: CircleX,
    label: "Failed"
  },
  processing: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    icon: LoaderCircle,
    label: "Processing"
  },
  inactive: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
    icon: CircleAlert,
    label: "Inactive"
  }
};
function StatusBadge({
  status,
  label,
  size = "md",
  showDot = true,
  className
}) {
  const { language } = useLanguage();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1.5",
    md: "px-3 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base gap-2.5"
  };
  const dotClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3"
  };
  const iconClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  const isAnimated = status === "processing" || status === "transferring";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "status-badge inline-flex items-center font-semibold rounded-full border border-current/10 shadow-sm transition-all duration-300",
        config.bg,
        config.text,
        sizeClasses[size],
        isAnimated && "animate-pulse",
        className
      ),
      children: [
        showDot && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: cn(
              "rounded-full",
              config.dot,
              dotClasses[size],
              isAnimated && "animate-pulse"
            )
          }
        ),
        isAnimated ? /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: cn(iconClasses[size], "animate-spin") }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label || (language === "ko" ? { Success: "성공", Processing: "처리 중", Failed: "실패", Inactive: "비활성" }[config.label] || config.label : config.label) })
      ]
    }
  );
}
function getStatusType(status) {
  const normalized = status.toLowerCase();
  if (["paid", "completed", "executed"].includes(normalized)) return normalized;
  if (["pending", "approved", "processing", "transferring"].includes(normalized)) return normalized;
  if (["failed", "rejected", "expired", "cancelled"].includes(normalized)) return normalized;
  return "inactive";
}
export {
  StatusBadge as S,
  getStatusType as g
};
