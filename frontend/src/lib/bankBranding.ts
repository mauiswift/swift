const BANK_LOGOS: Array<[RegExp, string]> = [
  [/toss/i, '/logos/toss-bank.png'],
  [/국민|kookmin|kb\b/i, '/logos/kb-kookmin.svg'],
  [/신한|shinhan/i, '/logos/shinhan-bank.svg'],
  [/하나|hana/i, '/logos/hana-bank.svg'],
  [/우리|woori/i, '/logos/woori-bank.svg'],
  [/기업|ibk/i, '/logos/ibk-bank.svg'],
  [/농협|nonghyup|nh\b/i, '/logos/nonghyup-bank.svg'],
  [/카카오|kakao/i, '/logos/kakao-bank.svg'],
  [/산업|kdb/i, '/logos/kdb-bank.png'],
  [/sc제일|sc first|sc-first/i, '/logos/sc-first-bank.svg'],
  [/부산|bsp/i, '/logos/bsp.svg'],
  [/netbank/i, '/logos/netbank.png'],
];

export function getBankLogo(label: string): string | undefined {
  return BANK_LOGOS.find(([pattern]) => pattern.test(label))?.[1];
}

export function getBankDisplayName(label: string): string {
  return label.trim() || 'Receiving bank';
}
