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

  if (mobile) {
    return (
      <Card className="overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-white to-blue-50/60 shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">{title}</p>
              {hasOrganizationWallet && organizationName && (
                <p className="mt-1 truncate text-xs text-slate-500">{organizationName}</p>
              )}
            </div>
            <span className="rounded-lg bg-blue-100 p-2 text-blue-700"><Landmark className="h-4 w-4" /></span>
          </div>
          <p className="wallet-balance-amount text-3xl font-bold tracking-tight text-slate-950 font-numeric">{shownBalance}</p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isKorean ? '사용 가능' : 'Available'}</span>
            <span className="font-semibold text-emerald-800 font-numeric">{shownAvailable}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isKorean ? '보류 중' : 'Pending'}</span>
            <span className="font-semibold text-amber-800 font-numeric">{shownPending}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={onDeposit} disabled={!showActions || unavailable} className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              <ArrowDownToLine className="mr-2 h-4 w-4" />{isKorean ? '입금' : 'Deposit'}
            </Button>
            <Button type="button" variant="outline" onClick={onWithdraw} disabled={!showActions || unavailable} className="h-11 rounded-xl border-amber-300 text-amber-900 hover:bg-amber-50">
              <ArrowUpFromLine className="mr-2 h-4 w-4" />{isKorean ? '출금' : 'Withdraw'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-3d overflow-hidden border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/30 ring-1 ring-blue-100/50 transition-all hover:shadow-lg">
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-200" />
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">{title}</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700">
            <Landmark className="h-5 w-5" />
          </div>
        </div>
        {hasOrganizationWallet && organizationName && (
          <p className="mb-2 truncate text-xs text-slate-500">{organizationName}</p>
        )}
        <p className="wallet-balance-amount text-3xl font-semibold text-foreground font-numeric">
          {loading ? <span className="inline-block h-10 w-32 animate-pulse rounded-lg bg-slate-100" /> : shownBalance}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Available</p>
            <p className="mt-0.5 truncate text-xs font-bold text-emerald-900 font-numeric">{shownAvailable}</p>
          </div>
          <div className="rounded-lg bg-amber-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Pending</p>
            <p className="mt-0.5 truncate text-xs font-bold text-amber-900 font-numeric">{shownPending}</p>
          </div>
        </div>
        {vipGold && <div className="vip-gold-card mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
          <Crown className="h-3 w-3 fill-amber-400 text-amber-600" />VIP
        </div>}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">{currencyName}</p>
          {pendingBalance > 0 && !unavailable && (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600 font-numeric">
              {isKorean ? '처리 중' : 'Pending'}: {money(pendingBalance, currency)}
            </span>
          )}
        </div>
        <div className="mt-4 flex min-h-[44px] items-center gap-2">
          {showActions && (
            <>
              <Button type="button" size="icon" title={`Deposit ${currency}`} aria-label={`Deposit ${currency}`} onClick={onDeposit} disabled={unavailable} className="inline-flex h-10 w-10 flex-1 items-center justify-center rounded-xl border border-[#2563eb] bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/20 transition-all hover:bg-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2">
                <ArrowDownToLine className="h-4 w-4 text-white" />
              </Button>
              <Button type="button" size="icon" title={`Withdraw ${currency}`} aria-label={`Withdraw ${currency}`} onClick={onWithdraw} disabled={unavailable} className="inline-flex h-10 w-10 flex-1 items-center justify-center rounded-xl border border-amber-600 bg-amber-500 text-white shadow-sm shadow-amber-500/20 transition-all hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">
                <ArrowUpFromLine className="h-4 w-4 text-white" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
