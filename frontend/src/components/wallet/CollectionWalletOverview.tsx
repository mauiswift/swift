import { ArrowDownToLine, ArrowUpFromLine, Crown, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fmtCurrency } from '@/lib/format';

type CollectionWalletOverviewProps = {
  mobile: boolean;
  isKorean: boolean;
  currency: string;
  currencyName: string;
  title: string;
  hasOrganizationWallet: boolean;
  organizationName?: string | null;
  loading: boolean;
  unavailable: boolean;
  vipGold?: boolean;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  showActions: boolean;
  onDeposit: () => void;
  onWithdraw: () => void;
};

const money = (amount: number, currency: string) => fmtCurrency(Number.isFinite(amount) ? amount : 0, currency);

export default function CollectionWalletOverview({
  mobile,
  isKorean,
  currency,
  currencyName,
  title,
  hasOrganizationWallet,
  organizationName,
  loading,
  unavailable,
  vipGold = false,
  balance,
  availableBalance,
  pendingBalance,
  showActions,
  onDeposit,
  onWithdraw,
}: CollectionWalletOverviewProps) {
  const shownBalance = loading
    ? '…'
    : unavailable
      ? 'Unavailable'
      : money(balance, currency);
  const shownAvailable = unavailable ? 'Unavailable' : money(availableBalance, currency);
  const shownPending = unavailable ? 'Unavailable' : money(pendingBalance, currency);

  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md">
      <div className="h-1 bg-blue-600" />
      <CardContent className={`space-y-5 ${mobile ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{title}</p>
            {hasOrganizationWallet && organizationName && (
              <p className="mt-1 truncate text-xs text-slate-500">{organizationName}</p>
            )}
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Landmark className="h-4 w-4" />
          </span>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">{isKorean ? '총 잔액' : 'Total balance'}</p>
          <p className={`mt-1 break-words font-semibold tracking-tight text-slate-950 ${mobile ? 'text-3xl' : 'text-3xl sm:text-4xl'}`}>
            {loading ? <span className="inline-block h-9 w-36 animate-pulse rounded bg-slate-100" /> : shownBalance}
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50">
          <div className="min-w-0 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{isKorean ? '사용 가능' : 'Available'}</p>
            <p className="mt-1 truncate text-sm font-semibold text-emerald-800">{shownAvailable}</p>
          </div>
          <div className="min-w-0 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{isKorean ? '보류 중' : 'Pending'}</p>
            <p className="mt-1 truncate text-sm font-semibold text-amber-800">{shownPending}</p>
          </div>
        </div>
        {vipGold && <div className="vip-gold-card mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
          <Crown className="h-3 w-3 fill-amber-400 text-amber-600" />VIP
        </div>}
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>{currencyName}</span>
          {pendingBalance > 0 && !unavailable && <span>{money(pendingBalance, currency)} {isKorean ? '보류 중' : 'pending'}</span>}
        </div>
        {showActions && <div className="grid grid-cols-2 gap-2">
          <Button type="button" onClick={onDeposit} disabled={unavailable} className="h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            <ArrowDownToLine className="mr-2 h-4 w-4" />{isKorean ? '입금' : 'Deposit'}
          </Button>
          <Button type="button" variant="outline" onClick={onWithdraw} disabled={unavailable} className="h-10 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50">
            <ArrowUpFromLine className="mr-2 h-4 w-4" />{isKorean ? '출금' : 'Withdraw'}
          </Button>
        </div>}
      </CardContent>
    </Card>
  );
}
