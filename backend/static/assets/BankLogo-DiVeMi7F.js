import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { r as resolveBrandLogoPath, n as normalizeBrandKey, d as cn } from "./index-DxezdLhY.js";
import { K as KRW_BANKS } from "./krw-banks-CdXesdGu.js";
import { Y as Building2 } from "./utils-vendor-HFbfdctU.js";
const PH_BANKS = [
  { code: "APHIPHM2XXX", name: "Alipay / Lazada Wallet" },
  { code: "OPDPVPHM1XXX", name: "AllBank Inc" },
  { code: "AUBKPHMMXXX", name: "ASIA UNITED BANK" },
  { code: "BFSRPHM2XXX", name: "Banana Fintech / BananaPay" },
  { code: "BNORPHMXXX", name: "Banco de Oro Unibank Inc (BDO)" },
  { code: "MRTCPHM1XXX", name: "Bangko Mabuhay" },
  { code: "BKCHPHMMXXX", name: "Bank of China" },
  { code: "PABIPHMMXXX", name: "Bank of Commerce" },
  { code: "BOPIPHMXXX", name: "Bank of the Philippine Islands (BPI)" },
  { code: "ORNNPHM1XXX", name: "BDO Network Bank" },
  { code: "BIUUPHM1XXX", name: "Binangonan Rural Bank / BRBDigital" },
  { code: "BPDIPHM1XXX", name: "BPI Direct BanKo A Savings Bank" },
  { code: "RUCAPHM1XXX", name: "CAMALIG BANK INC" },
  { code: "CNRLPHM1XXX", name: "Cantilan Bank" },
  { code: "CBMFPHM1XXX", name: "CARD Bank Inc" },
  { code: "CRMPHM1XXX", name: "CARD SME BANK INC" },
  { code: "CELRPHM1XXX", name: "Cebuana Lhuillier Rural Bank" },
  { code: "CHSVPHM1XXX", name: "China Bank Savings Inc" },
  { code: "CHBKPHMMXXX", name: "China Banking Corporation" },
  { code: "CIPHPHMXXX", name: "CIMB BANK PHILIPPINES INC" },
  { code: "CICYPHM2XXX", name: "CIS Bayad Center / Bayad" },
  { code: "CTCBPHMXXX", name: "CTBC Bank Phils Corp" },
  { code: "DCPHPHM1XXX", name: "DCPay / COINS.PH" },
  { code: "DBPHPHMMXXX", name: "Development Bank of the Philippines" },
  { code: "DCDEPHM1XXX", name: "Dumaguete City Development Bank Inc" },
  { code: "DUMTPHM1XXX", name: "DUNGGANON BANK INCORPORATED" },
  { code: "EWBCPHMMXXX", name: "East West Banking Corporation" },
  { code: "EAWRPHM2XXX", name: "East West Rural Bank / Komo" },
  { code: "EQSNPHM1XXX", name: "Equicom Savings Bank" },
  { code: "GXCHPHM2XXX", name: "G-Xchange / GCash" },
  { code: "GOTYPHM2XXX", name: "GoTyme Bank" },
  { code: "GHPESGSGXXX", name: "GrabPay Philippines" },
  { code: "IFIPPHM2XXX", name: "Infoserve / Nationlink" },
  { code: "ISTHPHM1XXX", name: "ISLA Bank" },
  { code: "TLBPPHMMXXX", name: "LAND BANK OF THE PHILIPPINES" },
  { code: "LESIPHM1XXX", name: "LEGAZPI SAVINGS BANK INC" },
  { code: "LFSHPHM2XXX", name: "LULU FINANCIAL SERVICES PHILS INC" },
  { code: "MAARPHM1XXX", name: "Malayan Bank Savings" },
  { code: "MYDBPHM2XXX", name: "Maya Bank, Inc." },
  { code: "MBBEPHMMXXX", name: "Maybank Philippines Inc" },
  { code: "MBTCPHMMXXX", name: "Metrobank" },
  { code: "MIOCPHM1XXX", name: "MINDANAO CONSOLIDATED COOPERATIVE BANK" },
  { code: "CUOBPHM1XXX", name: "Netbank (A Rural Bank), Inc." },
  { code: "OWNOPHM2XXX", name: "Own Bank" },
  { code: "PASBPHM1XXX", name: "Pacific Ace Savings Bank" },
  { code: "PPSFPHM2XXX", name: "PalawanPay" },
  { code: "PRTOPHM1XXX", name: "Partner Rural Bank (Cotabato), Inc." },
  { code: "PAPHPHM1XXX", name: "PayMaya Philippines Inc" },
  { code: "PDAXPHM2XXX", name: "PDAX" },
  { code: "CPHIPHMMXXX", name: "Philippine Bank of Communications" },
  { code: "PPBUPHMMXXX", name: "PHILIPPINE BUSINESS BANK" },
  { code: "PNBMPHMMTOD", name: "Philippine National Bank" },
  { code: "PHBMPHMMXXX", name: "Philippine Savings Bank" },
  { code: "PHVBPHMXXX", name: "Philippine Veterans Bank" },
  { code: "PHTBPHMMXXX", name: "PHILTRUST BANK" },
  { code: "PSCOPHM1XXX", name: "Producers Savings Bank Corporation" },
  { code: "QCDFPHM1XXX", name: "QUEEN CITY DEVELOPMENT BANK INC" },
  { code: "QCRIPHM1XXX", name: "Quezon Capital Rural Bank Inc" },
  { code: "RARLPHM1XXX", name: "Rang-Ay Bank" },
  { code: "RCBCPHMMXXX", name: "RCBC" },
  { code: "ROBPPHMXXX", name: "ROBINSONS BANK CORPORATION" },
  { code: "RUGUPHM1XXX", name: "Rural Bank of Guinobatan / Asenso" },
  { code: "LAUIPHM2XXX", name: "Seabank Philippines, Inc." },
  { code: "SETCPHMMXXX", name: "Security Bank Corporation" },
  { code: "SHPHPHM2XXX", name: "ShopeePay Philippines Inc" },
  { code: "SCBLPHMMXXX", name: "STANDARD CHARTERED BANK" },
  { code: "SRCPPHM2XXX", name: "Starpay Corporation" },
  { code: "STLAPH22XXX", name: "Sterling Bank of Asia Inc" },
  { code: "SUSVPHM1XXX", name: "Sun Savings Bank" },
  { code: "TAGCPHM2XXX", name: "Tagcash" },
  { code: "TAYOPHM2XXX", name: "TAYOCASH INC" },
  { code: "TDBIPHM2XXX", name: "Tonik Bank" },
  { code: "TOPJPHM2XXX", name: "Topjuan Tech Corporation" },
  { code: "UCSVPHM1XXX", name: "UCPB SAVINGS BANK" },
  { code: "UBPHPHMMXXX", name: "Unionbank of the Philippines" },
  { code: "UNODPHM2XXX", name: "UnionDigital Bank" },
  { code: "UNOPPHM2XXX", name: "UNOBank" },
  { code: "USMEPHM2XXX", name: "USSC Money Services Inc" },
  { code: "WEDVPHM1XXX", name: "WEALTH DEVELOPMENT BANK CORPORATION" },
  { code: "ZBTEPHM2XXX", name: "Zybi Tech Inc. / JuanCash" }
];
const BANK_NAME_STOP_WORDS = /* @__PURE__ */ new Set([
  "bank",
  "banking",
  "corporation",
  "company",
  "inc",
  "incorporated",
  "of",
  "philippines",
  "the"
]);
function getBankLogo(label, code) {
  return resolveBrandLogoPath(code || "") || resolveBrandLogoPath(label) || void 0;
}
function getBankDisplayName(label) {
  return label.trim() || "Receiving bank";
}
function getBankInitials(label, code) {
  const normalizedLabel = normalizeBrandKey(label);
  const normalizedCode = normalizeBrandKey(code || "");
  const knownBank = [...PH_BANKS, ...KRW_BANKS].find(
    (bank) => normalizeBrandKey(bank.name) === normalizedLabel || normalizeBrandKey(bank.code) === normalizedCode || normalizedCode.length >= 6 && normalizeBrandKey(bank.code).startsWith(normalizedCode)
  );
  const name = (knownBank == null ? void 0 : knownBank.name) || getBankDisplayName(label);
  const words = name.replace(/[()]/g, " ").split(/[\s/&-]+/).filter(Boolean).filter((word) => !BANK_NAME_STOP_WORDS.has(normalizeBrandKey(word)));
  const initials = words.slice(0, 3).map((word) => word[0]).join("").toUpperCase();
  return (initials.length > 1 ? initials : normalizedCode.slice(0, 3) || normalizedLabel.slice(0, 3) || "BK").toUpperCase();
}
function getBankBrandColor(label, code) {
  const key = normalizeBrandKey(code || label) || normalizeBrandKey(label);
  const hash = Array.from(key).reduce((total, character) => total * 31 + character.charCodeAt(0), 0);
  return `hsl(${Math.abs(hash) % 360} 48% 94%)`;
}
const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14"
};
function BankLogo({ name, code, className, size = "md" }) {
  const displayName = getBankDisplayName(name);
  const logo = getBankLogo(name, code);
  const [logoFailed, setLogoFailed] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setLogoFailed(false);
  }, [logo]);
  if (logo && !logoFailed) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5", sizeClasses[size], className),
        role: "img",
        "aria-label": `${displayName} logo`,
        title: displayName,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: logo,
            alt: "",
            className: "h-full w-full object-contain",
            onError: () => setLogoFailed(true)
          }
        )
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: cn("inline-flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 text-slate-800", sizeClasses[size], className),
      style: { backgroundColor: getBankBrandColor(displayName, code) },
      role: "img",
      "aria-label": `${displayName} icon`,
      title: displayName,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4 opacity-70", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-full truncate px-0.5 text-[9px] font-bold leading-none tracking-tight", children: getBankInitials(displayName, code) })
      ]
    }
  );
}
export {
  BankLogo as B,
  PH_BANKS as P,
  getBankDisplayName as g
};
