import { x as resolveBrandLogoPath } from "./index-BZw-Kh4U.js";
const DEFAULT_KRW_BANK_NAME = "Toss Bank";
const KRW_BANK_DEFINITIONS = [
  ["002", "KDB Bank", "/logos/kdb-bank.png"],
  ["003", "IBK Industrial Bank of Korea", "/logos/ibk-bank.svg"],
  ["004", "KB Kookmin Bank", "/logos/kb-kookmin.svg"],
  ["011", "NH NongHyup Bank", "/logos/nonghyup-bank.svg"],
  ["020", "Woori Bank", "/logos/woori-bank.svg"],
  ["023", "SC First Bank", "/logos/sc-first-bank.svg"],
  ["027", "Citi Bank Korea", ""],
  ["031", "Daegu Bank", ""],
  ["032", "Busan Bank", ""],
  ["034", "Gwangju Bank", ""],
  ["035", "Jeju Bank", ""],
  ["037", "Jeonbuk Bank", ""],
  ["039", "Kyongnam Bank", ""],
  ["045", "Korea Federation of Community Credit Cooperatives", ""],
  ["048", "Korea Credit Union", ""],
  ["071", "Post Office Bank", ""],
  ["081", "Hana Bank", "/logos/hana-bank.svg"],
  ["088", "Shinhan Bank", "/logos/shinhan-bank.svg"],
  ["089", "K Bank", ""],
  ["090", "Kakao Bank", "/logos/kakao-bank.svg"],
  ["092", "Toss Bank", "/logos/toss-bank.png"]
];
const KRW_BANK_CODE_ALIASES = {
  KAKAO: "090",
  TOSS: "092",
  KBANK: "089"
};
const KRW_BANKS = KRW_BANK_DEFINITIONS.map(([code, name, logo]) => ({
  code,
  name,
  logo: logo || resolveBrandLogoPath(name)
}));
new Map(
  KRW_BANKS.map((bank) => [bank.code.toUpperCase(), bank])
);
const normalizeKrwBankName = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_KRW_BANK_NAME;
  const normalizedRaw = raw.toLowerCase();
  if (["toss bank", "tossbank", "토스뱅크"].includes(normalizedRaw)) return DEFAULT_KRW_BANK_NAME;
  if (["toss pay", "tosspay", "토스페이"].includes(normalizedRaw)) return "Toss Pay";
  const aliasedCode = KRW_BANK_CODE_ALIASES[raw.toUpperCase()];
  const directMatch = KRW_BANKS.find(
    (bank) => bank.name.toLowerCase() === raw.toLowerCase() || bank.code.toLowerCase() === (aliasedCode || raw).toLowerCase()
  );
  if (directMatch) return directMatch.name;
  const normalized = raw.toUpperCase();
  if (normalized.includes("KAKAO")) return "Kakao Bank";
  if (normalized.includes("TOSSPAY") || normalized.includes("TOSS PAY") || raw.includes("토스페이")) return "Toss Pay";
  if (normalized.includes("TOSSBANK") || normalized.includes("TOSS BANK") || raw.includes("토스뱅크")) return "Toss Bank";
  if (normalized.includes("TOSS")) return "Toss Bank";
  if (normalized.includes("K BANK") || normalized.includes("KBANK")) return "K Bank";
  if (normalized.includes("NAVER")) return "Naver Bank";
  return raw || DEFAULT_KRW_BANK_NAME;
};
const isSupportedKrwBank = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  const normalized = raw.toUpperCase();
  const aliasedCode = KRW_BANK_CODE_ALIASES[normalized];
  return KRW_BANKS.some(
    (bank) => bank.code.toUpperCase() === (aliasedCode || normalized) || bank.name.toUpperCase() === normalized || normalized.includes(bank.code.toUpperCase()) || normalized.includes(bank.name.toUpperCase().replace(/\s+/g, ""))
  );
};
export {
  DEFAULT_KRW_BANK_NAME as D,
  KRW_BANKS as K,
  isSupportedKrwBank as i,
  normalizeKrwBankName as n
};
