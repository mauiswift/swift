import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { a as reactExports } from "./router-vendor-N0qZPfHZ.js";
import { v as useCollectionCurrency, u as useAuth, X as isSystemWalletAdmin, i as client, w as Layout, b as ue } from "./index-DquEFgr_.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-Bs5L13ZF.js";
import { a$ as UserPlus, aG as Copy, R as RefreshCw, a5 as Search, b0 as Eye, y as CircleCheckBig, b1 as Ban, W as WalletCards, X, v as Shield, aU as KeyRound } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
function DownlineManagement() {
  var _a;
  const { collectionCurrency } = useCollectionCurrency();
  const { user, isSuperAdmin } = useAuth();
  const canControlWallets = isSuperAdmin && isSystemWalletAdmin(user == null ? void 0 : user.id);
  const canManageTeam = Boolean((_a = user == null ? void 0 : user.permissions) == null ? void 0 : _a.can_manage_team);
  const isKrw = collectionCurrency === "KRW" && !isSuperAdmin;
  const [members, setMembers] = reactExports.useState([]);
  const [stats, setStats] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [search, setSearch] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [levelFilter, setLevelFilter] = reactExports.useState("all");
  const [selectedMember, setSelectedMember] = reactExports.useState(null);
  const [busyMemberId, setBusyMemberId] = reactExports.useState(null);
  const [referralLink, setReferralLink] = reactExports.useState("");
  const [serviceFee, setServiceFee] = reactExports.useState("0");
  const [downlinePassword, setDownlinePassword] = reactExports.useState("");
  const [downlinePasswordConfirm, setDownlinePasswordConfirm] = reactExports.useState("");
  const [activity, setActivity] = reactExports.useState(null);
  const [activityLoading, setActivityLoading] = reactExports.useState(false);
  const [walletFreezeLoading, setWalletFreezeLoading] = reactExports.useState(false);
  const [ownWalletFrozen, setOwnWalletFrozen] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    var _a2, _b, _c, _d;
    try {
      setLoading(true);
      const response = await client.get("/api/v1/team/downline");
      if (!response.ok) {
        throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || ((_b = response.data) == null ? void 0 : _b.message) || "Failed to load downline");
      }
      setMembers(((_c = response.data) == null ? void 0 : _c.items) || []);
      setStats(((_d = response.data) == null ? void 0 : _d.stats) || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : isKrw ? "다운라인을 불러오지 못했습니다." : "Failed to load downline");
    } finally {
      setLoading(false);
    }
  }, [isKrw]);
  reactExports.useEffect(() => {
    void load();
  }, [load]);
  reactExports.useEffect(() => {
    if (!selectedMember) return void 0;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busyMemberId && !activityLoading) {
        setSelectedMember(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedMember, busyMemberId, activityLoading]);
  reactExports.useEffect(() => {
    if (!canControlWallets || !(user == null ? void 0 : user.id)) return;
    client.get(`/api/v1/admin/wallets/user/${encodeURIComponent(user.id)}/analytics`).then((response) => {
      var _a2;
      const wallets = ((_a2 = response.data) == null ? void 0 : _a2.wallets) || [];
      setOwnWalletFrozen(wallets.some((wallet) => wallet.is_frozen));
    }).catch(() => setOwnWalletFrozen(false));
  }, [canControlWallets, user == null ? void 0 : user.id]);
  const filteredMembers = reactExports.useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      const matchesSearch = !query || [member.name, member.email, member.user_id].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;
      const matchesLevel = levelFilter === "all" || String(member.level) === levelFilter;
      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [members, search, statusFilter, levelFilter]);
  const fetchReferralLink = async () => {
    var _a2, _b, _c;
    try {
      const response = await client.get("/api/v1/team/referral-link");
      if (!response.ok) {
        throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || ((_b = response.data) == null ? void 0 : _b.message) || "Failed to create referral link");
      }
      const link = (_c = response.data) == null ? void 0 : _c.registration_link;
      if (!link) throw new Error("Referral link was not returned");
      setReferralLink(link);
      await navigator.clipboard.writeText(link);
      ue.success(isKrw ? "추천 링크가 복사되었습니다." : "Referral link copied");
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to create referral link");
    }
  };
  const updateMemberStatus = async (member) => {
    var _a2;
    const nextStatus = member.status === "suspended" ? "active" : "suspended";
    try {
      setBusyMemberId(member.id);
      const response = await client.patch(`/api/v1/team/downline/${member.id}/status`, { status: nextStatus });
      if (!response.ok) throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to update member status");
      ue.success(isKrw ? nextStatus === "active" ? "회원이 활성화되었습니다." : "회원이 정지되었습니다." : `Member ${nextStatus === "active" ? "reactivated" : "suspended"}`);
      await load();
      setSelectedMember((current) => current ? { ...current, status: nextStatus } : current);
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to update member status");
    } finally {
      setBusyMemberId(null);
    }
  };
  const approveCommissions = async (member) => {
    var _a2;
    if (member.pending_commissions <= 0) return;
    try {
      setBusyMemberId(member.id);
      const response = await client.post(`/api/v1/team/downline/${member.id}/approve-commissions`);
      if (!response.ok) throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to approve commissions");
      ue.success(isKrw ? "커미션이 승인되었습니다." : "Pending commissions approved");
      await load();
      setSelectedMember((current) => current ? { ...current, pending_commissions: 0, total_commissions: current.total_commissions + member.pending_commissions } : current);
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to approve commissions");
    } finally {
      setBusyMemberId(null);
    }
  };
  const loadActivity = async (member) => {
    try {
      setActivityLoading(true);
      const response = await client.get(`/api/v1/team/downline/${member.id}/activity`);
      setActivity(response.data || null);
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to load member activity");
    } finally {
      setActivityLoading(false);
    }
  };
  const updateWalletFreeze = async (userId, freeze, member) => {
    var _a2;
    if (!canControlWallets) return;
    const promptedReason = freeze ? window.prompt("Reason for freezing this wallet (optional):") : "";
    if (promptedReason === null) return;
    const reason = promptedReason || "";
    try {
      setWalletFreezeLoading(true);
      const response = freeze ? await client.post("/api/v1/admin/wallets/freeze", { user_id: userId, reason }) : await client.post(`/api/v1/admin/wallets/unfreeze?user_id=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || `Unable to ${freeze ? "freeze" : "unfreeze"} wallet`);
      }
      ue.success(freeze ? "Wallet frozen" : "Wallet unfrozen");
      if (member) {
        await loadActivity(member);
      } else {
        setOwnWalletFrozen(freeze);
      }
    } catch (err) {
      ue.error(err instanceof Error ? err.message : `Failed to ${freeze ? "freeze" : "unfreeze"} wallet`);
    } finally {
      setWalletFreezeLoading(false);
    }
  };
  const updateDownlinePassword = async () => {
    var _a2;
    if (!selectedMember) return;
    if (downlinePassword.length < 8 || downlinePassword !== downlinePasswordConfirm) {
      ue.error(downlinePassword.length < 8 ? "Password must be at least 8 characters." : "Passwords do not match.");
      return;
    }
    try {
      setBusyMemberId(selectedMember.id);
      const response = await client.post(`/api/v1/team/downline/${selectedMember.id}/password`, {
        password: downlinePassword,
        confirm_password: downlinePasswordConfirm
      });
      if (!response.ok) throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to update downline password");
      setDownlinePassword("");
      setDownlinePasswordConfirm("");
      ue.success("Downline password updated. They must change it at next login.");
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to update downline password");
    } finally {
      setBusyMemberId(null);
    }
  };
  const removePasskey = async () => {
    var _a2;
    if (!selectedMember || !window.confirm("Remove this member's passkey? They can register a new passkey after signing in with another method.")) return;
    try {
      setBusyMemberId(selectedMember.id);
      const response = await client.request(`/api/v1/team/downline/${selectedMember.id}/passkey`, "DELETE");
      if (!response.ok) throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to remove passkey");
      ue.success("Downline passkey removed");
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to remove passkey");
    } finally {
      setBusyMemberId(null);
    }
  };
  const updateServiceFee = async () => {
    var _a2;
    if (!selectedMember) return;
    const fee = Number(serviceFee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
      ue.error(isKrw ? "서비스 수수료는 0~100%여야 합니다." : "Service fee must be between 0 and 100%");
      return;
    }
    try {
      setBusyMemberId(selectedMember.id);
      const response = await client.patch(`/api/v1/team/downline/${selectedMember.id}/service-fee`, { service_fee_percent: fee });
      if (!response.ok) throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to update service fee");
      ue.success(isKrw ? "서비스 수수료가 저장되었습니다." : "Service fee saved");
      await load();
      setSelectedMember((current) => current ? { ...current, service_fee_percent: fee } : current);
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to update service fee");
    } finally {
      setBusyMemberId(null);
    }
  };
  const statusLabel = (status) => isKrw ? { active: "활성", suspended: "정지됨", inactive: "비활성" }[status] || status : status;
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Layout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold text-slate-900", children: isKrw ? "다운라인 관리" : "Downline Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: isKrw ? "추천 네트워크와 커미션 활동을 확인하세요." : "View your referral network and commission activity." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: fetchReferralLink, className: "inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-4 w-4" }),
            isKrw ? "추천 회원 초대" : "Invite member"
          ] }),
          referralLink && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => navigator.clipboard.writeText(referralLink), className: "inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" }),
            isKrw ? "링크 복사" : "Copy invite link"
          ] })
        ] })
      ] }),
      canControlWallets && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-amber-200 bg-amber-50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-amber-950", children: "My wallet access" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-800", children: ownWalletFrozen ? "Your wallets are frozen." : "Manage the freeze status of your own wallets." })
        ] }),
        ownWalletFrozen ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => (user == null ? void 0 : user.id) && updateWalletFreeze(user.id, false),
            disabled: walletFreezeLoading,
            className: "rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50",
            children: walletFreezeLoading ? "Updating..." : "Unfreeze my wallets"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => (user == null ? void 0 : user.id) && updateWalletFreeze(user.id, true),
            disabled: walletFreezeLoading,
            className: "rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50",
            children: walletFreezeLoading ? "Updating..." : "Freeze my wallets"
          }
        )
      ] }) }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700", role: "alert", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => void load(), className: "min-h-9 rounded-md border border-red-300 bg-white px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2", children: isKrw ? "다시 시도" : "Retry" })
      ] }),
      stats && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-3 lg:grid-cols-6", children: [
        [isKrw ? "직접 추천" : "Direct referrals", stats.direct_referrals],
        [isKrw ? "네트워크 규모" : "Network size", stats.total_network_size],
        [isKrw ? "활성 회원" : "Active members", stats.active_members],
        [isKrw ? "총 수익" : "Total earned", stats.total_earned.toFixed(2)],
        [isKrw ? "보류 중인 수익" : "Pending earnings", stats.pending_earnings.toFixed(2)],
        [isKrw ? "지급 완료" : "Paid out", stats.paid_out.toFixed(2)]
      ].map(([label, value]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xl font-semibold text-slate-900", children: value })
      ] }, String(label))) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-slate-200 bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mr-auto font-semibold text-slate-900", children: isKrw ? "추천 회원" : "Referral members" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void load(), disabled: loading, "aria-label": isKrw ? "다운라인 새로고침" : "Refresh downline", className: "inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-3.5 w-3.5 ${loading ? "motion-safe:animate-spin" : ""}`, "aria-hidden": "true" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: isKrw ? "새로고침" : "Refresh" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (event) => setSearch(event.target.value), placeholder: isKrw ? "회원 검색" : "Search members", "aria-label": isKrw ? "회원 검색" : "Search members", className: "h-9 w-44 rounded-md border border-slate-200 pl-8 pr-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), "aria-label": isKrw ? "상태 필터" : "Filter by status", className: "h-9 rounded-md border border-slate-200 px-2 text-sm text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: isKrw ? "모든 상태" : "All statuses" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: isKrw ? "활성" : "Active" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "suspended", children: isKrw ? "정지됨" : "Suspended" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: isKrw ? "비활성" : "Inactive" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: levelFilter, onChange: (event) => setLevelFilter(event.target.value), "aria-label": isKrw ? "등급 필터" : "Filter by level", className: "h-9 rounded-md border border-slate-200 px-2 text-sm text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: isKrw ? "모든 등급" : "All levels" }),
            [1, 2, 3, 4, 5].map((level) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: String(level), children: isKrw ? `${level}단계` : `Level ${level}` }, level))
          ] })
        ] }),
        filteredMembers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-8 text-center text-sm text-slate-500", children: members.length === 0 ? isKrw ? "아직 다운라인 회원이 없습니다." : "No downline members yet." : isKrw ? "조건에 맞는 회원이 없습니다." : "No members match the selected filters." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("caption", { className: "sr-only", children: isKrw ? "다운라인 추천 회원 목록" : "Downline referral members" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-50 text-xs uppercase text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: isKrw ? "회원" : "Member" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: isKrw ? "등급" : "Level" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: isKrw ? "상태" : "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: isKrw ? "보류 중인 커미션" : "Pending commissions" }),
            canManageTeam && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-right", children: isKrw ? "작업" : "Actions" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-100", children: filteredMembers.map((member) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: member.name || member.user_id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: member.email || member.user_id })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4 text-slate-600", children: [
              member.level,
              member.is_direct ? isKrw ? " (직접)" : " (direct)" : ""
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-flex rounded-full px-2 py-1 text-xs font-semibold ${member.status === "active" ? "bg-emerald-50 text-emerald-700" : member.status === "suspended" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`, children: statusLabel(member.status) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-slate-700", children: member.pending_commissions.toFixed(2) }),
            canManageTeam && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: isKrw ? "상세 보기" : "View details", "aria-label": `${isKrw ? "상세 보기" : "View details"}: ${member.name || member.user_id}`, onClick: () => {
                setSelectedMember(member);
                setActivity(null);
                setServiceFee(String(member.service_fee_percent || 0));
                setDownlinePassword("");
                setDownlinePasswordConfirm("");
                void loadActivity(member);
              }, className: "rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: member.status === "suspended" ? isKrw ? "활성화" : "Reactivate" : isKrw ? "정지" : "Suspend", "aria-label": `${member.status === "suspended" ? isKrw ? "활성화" : "Reactivate" : isKrw ? "정지" : "Suspend"}: ${member.name || member.user_id}`, disabled: busyMemberId === member.id, onClick: () => updateMemberStatus(member), className: "rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50", children: member.status === "suspended" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-emerald-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-4 w-4 text-amber-600" }) }),
              member.pending_commissions > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: isKrw ? "커미션 승인" : "Approve commissions", "aria-label": `${isKrw ? "커미션 승인" : "Approve commissions"}: ${member.name || member.user_id}`, disabled: busyMemberId === member.id, onClick: () => approveCommissions(member), className: "rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WalletCards, { className: "h-4 w-4 text-blue-600" }) })
            ] }) })
          ] }, member.id)) })
        ] }) })
      ] })
    ] }),
    selectedMember && canManageTeam && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center", role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-auto w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-white p-6 shadow-xl", "aria-labelledby": "downline-member-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "downline-member-title", className: "text-lg font-semibold text-slate-900", children: selectedMember.name || selectedMember.user_id }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: selectedMember.email || selectedMember.user_id })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": isKrw ? "상세 닫기" : "Close details", onClick: () => {
          setSelectedMember(null);
          setDownlinePassword("");
          setDownlinePasswordConfirm("");
        }, className: "rounded-md p-1 text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: isKrw ? "상태" : "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-semibold text-slate-900", children: statusLabel(selectedMember.status) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: isKrw ? "등급" : "Level" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-semibold text-slate-900", children: selectedMember.level })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: isKrw ? "총 커미션" : "Total commissions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-semibold text-slate-900", children: selectedMember.total_commissions.toFixed(2) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: isKrw ? "보류 중인 커미션" : "Pending commissions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-semibold text-slate-900", children: selectedMember.pending_commissions.toFixed(2) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-lg border border-slate-200 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "Change dashboard password" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "The member will be required to change this password at next login." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", autoComplete: "new-password", value: downlinePassword, onChange: (event) => setDownlinePassword(event.target.value), placeholder: "New password", className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", autoComplete: "new-password", value: downlinePasswordConfirm, onChange: (event) => setDownlinePasswordConfirm(event.target.value), placeholder: "Confirm password", className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: updateDownlinePassword, disabled: busyMemberId === selectedMember.id || !downlinePassword || !downlinePasswordConfirm, className: "rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50", children: "Update password" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-lg border border-slate-200 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "Wallet balance" }),
        activityLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Loading activity..." }) : (activity == null ? void 0 : activity.wallets.length) ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-2 sm:grid-cols-2", children: activity.wallets.map((wallet) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: wallet.currency }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-semibold text-slate-900", children: Number(wallet.balance || 0).toLocaleString(void 0, { minimumFractionDigits: 2 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[11px] text-slate-500", children: [
            "Available: ",
            Number(wallet.available_balance || 0).toLocaleString(void 0, { minimumFractionDigits: 2 })
          ] })
        ] }, wallet.currency)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-500", children: "No wallet balances found." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-lg border border-slate-200 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "Recent transactions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 max-h-48 space-y-2 overflow-y-auto", children: (activity == null ? void 0 : activity.transactions.length) ? activity.transactions.map((transaction) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-slate-700", children: [
              transaction.transaction_type === "admin_credit" ? "Automated wallet funding" : transaction.transaction_type === "admin_debit" ? "Secure wallet adjustment" : transaction.transaction_type.replace(/_/g, " "),
              " · ",
              transaction.currency
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-slate-500", children: transaction.transaction_type === "admin_credit" ? "Automatic wallet system" : transaction.transaction_type === "admin_debit" ? "Automatic wallet system" : transaction.note || transaction.reference_id || "No reference" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 font-semibold text-slate-900", children: Number(transaction.amount || 0).toLocaleString(void 0, { minimumFractionDigits: 2 }) })
        ] }, transaction.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "No transactions found." }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-lg border border-slate-200 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "downline-service-fee", className: "text-xs font-semibold text-slate-600", children: isKrw ? "이 회원의 서비스 수수료" : "Service fee for this invite" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "downline-service-fee", type: "number", min: "0", max: "100", step: "0.01", value: serviceFee, onChange: (event) => setServiceFee(event.target.value), className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-slate-500", children: "%" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-500", children: isKrw ? "이 초대 회원의 결제에만 적용됩니다." : "Applied only to payments from this invited member." })
      ] }),
      canControlWallets && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-amber-950", children: "Wallet access" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-800", children: (activity == null ? void 0 : activity.wallets.some((wallet) => wallet.is_frozen)) ? "This member's wallets are frozen." : "Freeze this member's wallets to block transfers, withdrawals, and conversions." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-5 w-5 shrink-0 text-amber-700" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: (activity == null ? void 0 : activity.wallets.some((wallet) => wallet.is_frozen)) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => updateWalletFreeze(selectedMember.user_id, false, selectedMember),
            disabled: walletFreezeLoading || activityLoading,
            className: "rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50",
            children: walletFreezeLoading ? "Updating..." : "Unfreeze wallets"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => updateWalletFreeze(selectedMember.user_id, true, selectedMember),
            disabled: walletFreezeLoading || activityLoading,
            className: "rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50",
            children: walletFreezeLoading ? "Updating..." : "Freeze wallets"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4", children: [
        selectedMember.pending_commissions > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => approveCommissions(selectedMember), disabled: busyMemberId === selectedMember.id, className: "rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50", children: isKrw ? "커미션 승인" : "Approve commissions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: updateServiceFee,
            disabled: busyMemberId === selectedMember.id,
            className: "inline-flex min-w-[4rem] shrink-0 items-center justify-center rounded-lg border border-blue-700 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            children: "Set"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => updateMemberStatus(selectedMember), disabled: busyMemberId === selectedMember.id, className: "rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50", children: selectedMember.status === "suspended" ? isKrw ? "활성화" : "Reactivate" : isKrw ? "정지" : "Suspend" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: removePasskey, disabled: busyMemberId === selectedMember.id, className: "inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-4 w-4" }),
          "Remove passkey"
        ] })
      ] })
    ] }) })
  ] });
}
export {
  DownlineManagement as default
};
