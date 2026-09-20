export interface PhilippineBankOption {
  code: string;
  name: string;
}

export const PH_BANKS: PhilippineBankOption[] = [
  { code: 'BDO', name: 'BDO Unibank' },
  { code: 'BPI', name: 'BPI (Bank of the Philippine Islands)' },
  { code: 'METROBANK', name: 'Metrobank' },
  { code: 'UNIONBANK', name: 'UnionBank of the Philippines' },
  { code: 'RCBC', name: 'RCBC (Rizal Commercial Banking Corporation)' },
  { code: 'LANDBANK', name: 'Landbank of the Philippines' },
  { code: 'DBP', name: 'Development Bank of the Philippines' },
  { code: 'EASTWEST', name: 'EastWest Bank' },
  { code: 'SECBANK', name: 'Security Bank' },
  { code: 'AUB', name: 'Asia United Bank' },
  { code: 'CHINABANK', name: 'Chinabank' },
  { code: 'PNB', name: 'Philippine National Bank' },
  { code: 'PSBANK', name: 'Philippine Savings Bank' },
  { code: 'CEBUANA', name: 'Cebuana Lhuillier Bank' },
  { code: 'MBTC', name: 'Maybank (BDO Maybank) / MBTC' },
  { code: 'CIMB', name: 'CIMB Bank Philippines' },
];
