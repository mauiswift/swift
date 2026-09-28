import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as useNavigate, a as reactExports } from "./router-vendor-C2eKMart.js";
import { u as useAuth, f as useCollectionCurrency, g as client, L as Layout, e as Button, b as ue, c as authApi } from "./index-D7WzENaT.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-hv5GsK8T.js";
import { P as PH_BANKS, B as BankLogo } from "./BankLogo-BgBPBc49.js";
import { K as KRW_BANKS } from "./krw-banks-B5PBJApF.js";
import { i as isPaymentChannelEnabled, f as fetchPaymentChannels } from "./paymentChannels-su6LRWP7.js";
import { v as ChevronLeft, z as LoaderCircle, S as Send, Y as Building2, $ as Check, p as CircleAlert } from "./utils-vendor-B--1aD6k.js";
import "./ui-vendor-DsSOT9J9.js";
const CURRENCY_SYMBOLS = { PHP: "₱", KRW: "₩", USDT: "₮", CNY: "¥" };
const REQUIRED_RETAINED_BALANCE = { PHP: 5e3, USDT: 100, USD: 100, KRW: 0 };
function SendSingleDisbursement() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const { collectionCurrency } = useCollectionCurrency();
  const isKrwFlow = collectionCurrency === "KRW";
  const isPhpFlow = collectionCurrency === "PHP";
  const uiText = {
    breadcrumb: isKrwFlow ? "출금" : "Disbursements",
    currentPage: isKrwFlow ? "단일 출금 보내기" : "Send single disbursement",
    sectionTitle: isKrwFlow ? "수취인 정보" : "Recipient details",
    lastName: isKrwFlow ? "성" : "Last name",
    firstName: isKrwFlow ? "이름" : "First name",
    middleName: isKrwFlow ? "중간 이름" : "Middle name",
    optional: isKrwFlow ? "(선택)" : "(optional)",
    phone: isKrwFlow ? "휴대폰번호" : "Phone number",
    email: isKrwFlow ? "이메일" : "Email",
    address: isKrwFlow ? "주소" : "Address",
    city: isKrwFlow ? "시/구" : "City",
    province: isKrwFlow ? "도/광역시" : "Province",
    postalCode: isKrwFlow ? "우편번호" : "Postal code",
    paymentInfo: isKrwFlow ? "지급 정보" : "Payment details",
    amount: isKrwFlow ? "금액" : "Amount",
    refNo: isKrwFlow ? "참조번호" : "Reference no.",
    remark: isKrwFlow ? "메모" : "Note",
    bankSelectLabel: isKrwFlow ? "은행 선택" : "Bank selection",
    bankSelectPlaceholder: isKrwFlow ? "은행을 선택하세요" : "Select a bank",
    accountNumber: isKrwFlow ? "계좌번호" : "Account number",
    accountNumberPlaceholder: isKrwFlow ? "계좌번호를 입력하세요" : "Enter account number",
    now: isKrwFlow ? "지금 이체하기" : "Send now",
    recipientBankInfo: isKrwFlow ? "수취은행 정보" : "Recipient bank information",
    yourAccount: isKrwFlow ? "내 계좌" : "Your account",
    balanceLabel: isKrwFlow ? "사용 가능한 잔액" : "Available Balance",
    verifiedNode: isKrwFlow ? "검증된 노드" : "Verified Node",
    importantNote: isKrwFlow ? "중요 안내" : "Important Note",
    noteText: isKrwFlow ? "단일 출금은 등록된 한국 은행 계좌로 처리되며, 입금까지 영업일 기준 시간이 걸릴 수 있습니다." : "Single disbursements are processed via the configured bank transfer channel. Funds may take time to arrive.",
    helper: isKrwFlow ? "단일 지급은 즉시 처리되며 내역 탭에 바로 표시됩니다." : "Single disbursements are processed immediately and will appear directly in the History tab."
  };
  const [loading, setLoading] = reactExports.useState(false);
  const [banks, setBanks] = reactExports.useState([]);
  const [balance, setBalance] = reactExports.useState(0);
  const [paymentChannels, setPaymentChannels] = reactExports.useState(null);
  const disbursementEnabled = isPaymentChannelEnabled(paymentChannels, collectionCurrency, "disbursement", "bank_transfer");
  const [firstName, setFirstName] = reactExports.useState("");
  const [middleName, setMiddleName] = reactExports.useState("");
  const [lastName, setLastName] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [line1, setLine1] = reactExports.useState("");
  const [city, setCity] = reactExports.useState("");
  const [province, setProvince] = reactExports.useState("");
  const [postalCode, setPostalCode] = reactExports.useState("");
  const [amount, setAmount] = reactExports.useState("");
  const [refNo, setRefNo] = reactExports.useState("");
  const [remarks, setRemarks] = reactExports.useState("");
  const [bankCode, setBankCode] = reactExports.useState("");
  const [accountNo, setAccountNo] = reactExports.useState("");
  const fetchData = reactExports.useCallback(async () => {
    var _a, _b;
    try {
      const balRes = await client.apiCall.invoke({
        url: `/api/v1/wallet/balance?currency=${collectionCurrency}`,
        method: "GET",
        data: {}
      });
      if (isKrwFlow) {
        setBanks(KRW_BANKS);
      } else {
        const institutionRes = await client.apiCall.invoke({
          url: "/api/v1/swiftpay/institutions?currency=PHP",
          method: "GET",
          data: {}
        });
        const liveBanks = Array.isArray((_a = institutionRes.data) == null ? void 0 : _a.data) ? institutionRes.data.data.map((bank) => ({
          code: String(bank.code || "").trim(),
          name: String(bank.name || bank.code || "").trim()
        })).filter((bank) => bank.code && bank.name) : [];
        const mergedBanks = [...liveBanks, ...PH_BANKS].filter(
          (bank, index, arr) => arr.findIndex((item) => item.code.toUpperCase() === bank.code.toUpperCase()) === index
        );
        setBanks(mergedBanks.length ? mergedBanks : PH_BANKS);
      }
      if (((_b = balRes.data) == null ? void 0 : _b.balance) != null) setBalance(balRes.data.balance);
    } catch (err) {
      console.error("Failed to fetch disbursement data:", err);
      setBanks(isKrwFlow ? KRW_BANKS : PH_BANKS);
    }
  }, [collectionCurrency, isKrwFlow]);
  reactExports.useEffect(() => {
    setBanks([]);
    setBankCode("");
    fetchData();
  }, [fetchData]);
  reactExports.useEffect(() => {
    fetchPaymentChannels().then(setPaymentChannels).catch(() => void 0);
  }, []);
  const handleSubmit = async () => {
    var _a, _b, _c, _d, _e;
    if (!isSuperAdmin) {
      ue.error("Disbursements are available to super admins only");
      return;
    }
    if (!disbursementEnabled) {
      ue.error(isKrwFlow ? "이 통화의 출금 채널이 비활성화되었습니다." : "Disbursement is disabled for this currency");
      return;
    }
    const amt = parseFloat(amount);
    if (!firstName.trim() || !lastName.trim()) return ue.error(isKrwFlow ? "이름과 성을 입력해주세요." : "First and last names are required");
    if (isNaN(amt) || amt <= 0) return ue.error(isKrwFlow ? "유효한 금액을 입력해주세요." : "Enter a valid amount");
    if (isKrwFlow && amt < 1e3) return ue.error("KRW 출금 금액은 ₩1,000 이상이어야 합니다.");
    if (!bankCode) return ue.error(isKrwFlow ? "수취인 은행을 선택해주세요." : "Select a recipient bank");
    if (!accountNo.trim()) return ue.error(isKrwFlow ? "계좌번호를 입력해주세요." : "Account number is required");
    const retainedBalance = REQUIRED_RETAINED_BALANCE[collectionCurrency] || 0;
    if (amt > Math.max(0, balance - retainedBalance)) {
      return ue.error(
        isKrwFlow ? `잔액에 ${retainedBalance.toLocaleString()} ${collectionCurrency} 이상이 유지되어야 합니다.` : `Keep at least ${CURRENCY_SYMBOLS[collectionCurrency] || ""}${retainedBalance.toLocaleString()} in your wallet`
      );
    }
    setLoading(true);
    try {
      const passkeyCredential = isKrwFlow ? void 0 : await authApi.verifyPasskey("disbursement");
      const res = await client.apiCall.invoke({
        url: isKrwFlow ? "/api/v1/krw/disbursements" : "/api/v1/swiftpay/disbursements/send",
        method: "POST",
        data: isKrwFlow ? {
          reference_no: refNo.trim() || `krw-disb-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
          amount: amt,
          description: remarks.trim() || "KRW bank disbursement",
          bank_info: {
            bank_code: bankCode,
            bank_name: ((_a = banks.find((bank) => bank.code === bankCode)) == null ? void 0 : _a.name) || bankCode,
            account_number: accountNo.trim(),
            account_name: [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(" ")
          },
          priority: "normal"
        } : {
          reference_no: refNo.trim() || `disb-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
          currency: collectionCurrency,
          amount: amt,
          bank_code: bankCode,
          account_number: accountNo.trim(),
          first_name: firstName.trim(),
          middle_name: middleName.trim() || void 0,
          last_name: lastName.trim(),
          phone: phone.trim() || void 0,
          email: email.trim() || void 0,
          line1: line1.trim() || "N/A",
          city: city.trim() || "Manila",
          province: province.trim() || "Metro Manila",
          postal_code: postalCode.trim() || "1000",
          note: remarks.trim(),
          passkey_credential: passkeyCredential
        }
      });
      if (res.ok && ((_b = res.data) == null ? void 0 : _b.success)) {
        ue.success(isKrwFlow ? "KRW 출금 요청이 처리되었습니다." : "Disbursement request submitted for review");
        navigate("/disbursements");
      } else {
        ue.error(((_c = res.data) == null ? void 0 : _c.detail) || ((_d = res.data) == null ? void 0 : _d.message) || ((_e = res.data) == null ? void 0 : _e.error) || (isKrwFlow ? "출금 전송에 실패했습니다." : "Failed to send disbursement"));
      }
    } catch (err) {
      console.error("Disbursement submission failed:", err);
      ue.error(err instanceof Error ? err.message : isKrwFlow ? "네트워크 오류가 발생했습니다. 다시 시도해주세요." : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600 transition-colors", onClick: () => navigate("/disbursements"), children: uiText.breadcrumb }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "/" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: uiText.currentPage })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5 mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/disbursements"),
          className: "w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: uiText.currentPage })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl p-10 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] text-slate-500 mb-12 font-medium", children: uiText.helper }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-16 max-w-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[16px] font-semibold text-slate-900 mb-8", children: uiText.sectionTitle }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.lastName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      value: lastName,
                      onChange: (e) => setLastName(e.target.value),
                      placeholder: "홍",
                      className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.firstName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      value: firstName,
                      onChange: (e) => setFirstName(e.target.value),
                      placeholder: "길동",
                      className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: [
                    uiText.middleName,
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-medium", children: uiText.optional })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      value: middleName,
                      onChange: (e) => setMiddleName(e.target.value),
                      placeholder: "민",
                      className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: [
                    uiText.phone,
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-medium", children: uiText.optional })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      value: phone,
                      onChange: (e) => setPhone(e.target.value),
                      placeholder: "01012345678",
                      className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: [
                    uiText.email,
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-medium", children: uiText.optional })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      value: email,
                      onChange: (e) => setEmail(e.target.value),
                      placeholder: "recipient@example.com",
                      className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.address }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      value: line1,
                      onChange: (e) => setLine1(e.target.value),
                      placeholder: "서울특별시 강남구 테헤란로 123",
                      className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.city }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        value: city,
                        onChange: (e) => setCity(e.target.value),
                        placeholder: "서울",
                        className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.province }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        value: province,
                        onChange: (e) => setProvince(e.target.value),
                        placeholder: "서울특별시",
                        className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.postalCode }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        value: postalCode,
                        onChange: (e) => setPostalCode(e.target.value),
                        placeholder: "1550",
                        className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                      }
                    )
                  ] })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[16px] font-semibold text-slate-900 mb-8", children: uiText.paymentInfo }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.amount }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-slate-400 font-semibold", children: CURRENCY_SYMBOLS[collectionCurrency] || "₩" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "number",
                        value: amount,
                        onChange: (e) => setAmount(e.target.value),
                        className: "w-full bg-white border border-slate-200 rounded-xl pl-9 pr-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.refNo }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      value: refNo,
                      onChange: (e) => setRefNo(e.target.value),
                      placeholder: "내부 참조",
                      className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.remark }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: remarks,
                    onChange: (e) => setRemarks(e.target.value),
                    placeholder: "예: 청구서 #123 결제",
                    className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[16px] font-semibold text-slate-900 mb-8", children: uiText.recipientBankInfo }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.bankSelectLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: bankCode, onValueChange: setBankCode, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 h-auto text-[14px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: uiText.bankSelectPlaceholder }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "bg-white border-slate-200 max-h-[300px]", children: banks.map((bank) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: bank.code, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BankLogo, { name: bank.name, code: bank.code, size: "sm" }),
                    bank.name
                  ] }) }, bank.code)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: uiText.accountNumber }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: accountNo,
                    onChange: (e) => setAccountNo(e.target.value),
                    placeholder: uiText.accountNumberPlaceholder,
                    className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-8 border-t border-slate-100 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleSubmit,
              disabled: loading || !disbursementEnabled,
              className: "bg-[#111111] text-white px-10 py-4 rounded-xl font-semibold text-[15px] shadow-lg hover:bg-black transition-all",
              children: [
                loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "animate-spin mr-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "mr-2", size: 18 }),
                uiText.now
              ]
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[18px] font-semibold text-slate-900", children: uiText.yourAccount }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl p-10 shadow-sm relative overflow-hidden group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 80 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-500 mb-3 font-medium uppercase tracking-wider", children: uiText.balanceLabel }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-4xl font-semibold text-slate-900 tracking-tighter", children: [
            CURRENCY_SYMBOLS[collectionCurrency] || "₩",
            balance.toLocaleString(void 0, { minimumFractionDigits: 2 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 pt-8 border-t border-slate-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[11px] font-semibold text-emerald-600 uppercase tracking-wider", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 }),
            uiText.verifiedNode
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 border border-blue-100 rounded-2xl p-8 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-blue-900 font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 18 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[14px]", children: uiText.importantNote })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-blue-800 leading-relaxed", children: uiText.noteText })
        ] }),
        isPhpFlow && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-2xl p-8 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-amber-900 font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 18 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[14px]", children: isKrwFlow ? "PHP 잔액 알림" : "PHP balance reminder" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-amber-800 leading-relaxed", children: isKrwFlow ? "PHP 지갑에 최소 ₱5,000 이상을 유지해야 하며, 그렇지 않으면 일부 기능에 대한 접근이 제한될 수 있습니다." : "Please keep at least ₱5,000 in your PHP wallet, or access to all features may be turned off." })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  SendSingleDisbursement as default
};
