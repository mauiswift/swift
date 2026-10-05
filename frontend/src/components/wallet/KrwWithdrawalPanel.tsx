import { ArrowUpFromLine, Building2, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BankLogo from '@/components/BankLogo';
import { KRW_BANKS } from '@/config/krw-banks';
import { fmtCurrency } from '@/lib/format';

type BankOption = { code: string; name: string };

type KrwWithdrawalPanelProps = {
  isKorean: boolean;
  amount: string;
  selectedBank: string;
  accountNumber: string;
  accountName: string;
  note: string;
  availableBalance: number;
  banks: BankOption[];
  loading: boolean;
  submitLabel: string;
  onAmountChange: (value: string) => void;
  onBankChange: (code: string) => void;
  onAccountNumberChange: (value: string) => void;
  onAccountNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
};

export default function KrwWithdrawalPanel({
  isKorean,
  amount,
  selectedBank,
  accountNumber,
  accountName,
  note,
  availableBalance,
  banks,
  loading,
  submitLabel,
  onAmountChange,
  onBankChange,
  onAccountNumberChange,
  onAccountNameChange,
  onNoteChange,
  onSubmit,
}: KrwWithdrawalPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="bg-white border border-slate-200 shadow-sm lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Building2 className="h-5 w-5 text-blue-600" />
            {isKorean ? 'KRW 계좌 출금' : 'KRW bank withdrawal'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block text-xs font-semibold text-slate-700">{isKorean ? '금액 (KRW)' : 'Amount (KRW)'}</Label>
              <Input type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={event => onAmountChange(event.target.value)} className="bg-slate-50 border-slate-200 text-foreground font-numeric" />
              <p className="mt-2 text-xs font-medium text-slate-600">{isKorean ? '사용 가능 잔액' : 'Available balance'}: <span className="font-semibold font-numeric text-blue-700">{fmtCurrency(availableBalance, 'KRW')}</span></p>
            </div>
            <div>
              <Label className="mb-2 block text-xs font-semibold text-slate-700">{isKorean ? '은행' : 'Bank'}</Label>
              <Select value={selectedBank} onValueChange={onBankChange}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-foreground">
                  <SelectValue placeholder={isKorean ? '은행을 선택하세요' : 'Select bank'} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-white border-slate-200">
                  {banks.map(bank => <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block text-xs font-semibold text-slate-700">{isKorean ? '계좌번호' : 'Account number'}</Label>
              <Input placeholder={isKorean ? '계좌번호 입력' : 'Enter account number'} value={accountNumber} onChange={event => onAccountNumberChange(event.target.value)} className="bg-slate-50 border-slate-200 text-foreground banking-account-num" />
            </div>
            <div>
              <Label className="mb-2 block text-xs font-semibold text-slate-700">{isKorean ? '예금주' : 'Account holder name'}</Label>
              <Input placeholder={isKorean ? '예금주 입력' : 'Enter account holder name'} value={accountName} onChange={event => onAccountNameChange(event.target.value)} className="bg-slate-50 border-slate-200 text-foreground" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2 block text-xs font-semibold text-slate-700">{isKorean ? '메모 (선택)' : 'Note (optional)'}</Label>
              <Input placeholder={isKorean ? '추가 안내 사항' : 'Additional instructions'} value={note} onChange={event => onNoteChange(event.target.value)} className="bg-slate-50 border-slate-200 text-foreground" />
            </div>
          </div>
          <Button type="button" onClick={onSubmit} disabled={loading || !amount || !selectedBank || !accountNumber || !accountName} className="h-10 w-full bg-gradient-to-r from-blue-600 to-blue-700 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50" data-wallet-dark-action="true">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />{isKorean ? '요청 제출 중...' : 'Submitting request...'}</> : <><ArrowUpFromLine className="mr-2 h-4 w-4 text-white" />{submitLabel}</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <CreditCard className="h-5 w-5 text-slate-600" />
            {isKorean ? '지원 은행' : 'Supported banks'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {KRW_BANKS.map(bank => (
              <div key={bank.code} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2 transition-colors hover:bg-slate-50">
                <BankLogo name={bank.name} code={bank.code} size="sm" />
                <span className="min-w-0 truncate text-xs font-medium text-slate-700">{bank.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600">
            <p><span className="font-semibold text-slate-700">{isKorean ? '처리 기간:' : 'Processing time:'}</span> {isKorean ? '영업일 기준 1~3일' : '1–3 business days'}</p>
            <p><span className="font-semibold text-slate-700">{isKorean ? '통화:' : 'Currency:'}</span> KRW</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
