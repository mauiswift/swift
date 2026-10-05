import { ArrowDownToLine, Crown, Loader2, Send, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { Card, CardContent } from '@/components/ui/card';

type BuyUsdtButtonProps = {
  loading: boolean;
  funding: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  compact?: boolean;
};

function BuyUsdtIcon({ busy, className = 'h-5 w-5' }: { busy: boolean; className?: string }) {
  return busy
    ? <Loader2 className={`${className} animate-spin`} stroke="#16a34a" strokeWidth={2.5} aria-hidden="true" />
    : <PaymentBrandLogo brand="USDT" size="sm" className={`h-auto w-auto border-0 bg-transparent p-0 shadow-none ${className}`} />;
}

export function BuyUsdtButton({ loading, funding, disabled, onClick, label, compact = false }: BuyUsdtButtonProps) {
  const busy = loading || funding;
  const buttonLabel = busy ? 'Processing...' : label || 'Buy USDT';

  if (compact) {
    return (
      <button
        type="button"
        title="Buy USDT"
        aria-label="Buy USDT"
        onClick={onClick}
        disabled={disabled || busy}
        className="flex h-10 w-full min-w-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-1 text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <BuyUsdtIcon busy={busy} className="h-5 w-5 shrink-0" />
        <span className="text-[10px] font-bold leading-none text-slate-900">BUY</span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      title="Buy USDT"
      aria-label="Buy USDT"
      onClick={onClick}
      disabled={disabled || busy}
      className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-50"
    >
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
        <BuyUsdtIcon busy={busy} />
      </span>
      <span>{buttonLabel}</span>
    </Button>
  );
}

type UsdtWalletOverviewProps = {
  mobile: boolean;
  isKorean: boolean;
  hasOrganizationWallet: boolean;
  organizationName?: string | null;
  loading: boolean;
  unavailable: boolean;
  vipGold?: boolean;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  canTrade: boolean;
  canBuy: boolean;
  buyLoading: boolean;
  fundingLoading: boolean;
  onBuy: () => void;
  onSell: () => void;
  onSend: () => void;
  onReceive: () => void;
};

const formatUsd = (amount: number) => Number.isFinite(amount)
  ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : '0.00';

export default function UsdtWalletOverview({
  mobile,
  isKorean,
  hasOrganizationWallet,
  organizationName,
  loading,
  unavailable,
  vipGold = false,
  balance,
  availableBalance,
  pendingBalance,
  canTrade,
  canBuy,
  buyLoading,
  fundingLoading,
  onBuy,
  onSell,
  onSend,
  onReceive,
}: UsdtWalletOverviewProps) {
  const title = hasOrganizationWallet
    ? isKorean ? '공유 조직 USDT 지갑' : 'Shared organization USDT wallet'
    : 'USDT Wallet';
  const shownBalance = loading ? '…' : unavailable ? 'Unavailable' : `$${formatUsd(balance)}`;
  const shownAvailable = unavailable ? 'Unavailable' : `$${formatUsd(availableBalance)}`;
  const shownPending = unavailable ? 'Unavailable' : `$${formatUsd(pendingBalance)}`;

  if (mobile) {
    return (
      <Card className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/50 shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">{title}</p>
              {hasOrganizationWallet && organizationName && (
                <p className="mt-1 truncate text-xs text-slate-500">{organizationName}</p>
              )}
            </div>
            <PaymentBrandLogo brand="USDT" size="sm" className="h-8 w-8 shrink-0 border-0 bg-transparent p-0 shadow-none" />
          </div>
          <p className="wallet-balance-amount text-3xl font-bold tracking-tight text-slate-950 font-numeric">{shownBalance}</p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isKorean ? '사용 가능' : 'Available'}</span>
            <span className="font-semibold text-emerald-800 font-numeric">{shownAvailable}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={onBuy} disabled={!canBuy || unavailable} className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              <TrendingUp className="mr-2 h-4 w-4" />{isKorean ? '구매' : 'Buy'}
            </Button>
            <Button type="button" variant="outline" onClick={onSell} disabled={!canTrade || unavailable} className="h-11 rounded-xl border-orange-300 text-orange-900 hover:bg-orange-50">
              <TrendingUp className="mr-2 h-4 w-4 rotate-180" />{isKorean ? '판매' : 'Sell'}
            </Button>
            <Button type="button" onClick={onSend} disabled={unavailable} className="h-11 rounded-xl bg-sky-600 text-white hover:bg-sky-700">
              <Send className="mr-2 h-4 w-4" />{isKorean ? '보내기' : 'Send'}
            </Button>
            <Button type="button" variant="outline" onClick={onReceive} className="h-11 rounded-xl border-blue-300 text-blue-800 hover:bg-blue-50">
              <ArrowDownToLine className="mr-2 h-4 w-4" />{isKorean ? '받기' : 'Receive'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-3d relative isolate overflow-hidden border border-slate-700 bg-[#0f172a] text-white shadow-xl shadow-slate-950/15 ring-1 ring-emerald-400/10">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />
      <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      <CardContent className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">{title}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                TRC-20
              </span>
            </div>
            {hasOrganizationWallet && organizationName && (
              <p className="mt-1.5 truncate text-xs text-slate-400">{organizationName}</p>
            )}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
            <PaymentBrandLogo brand="USDT" size="sm" className="h-7 w-7 border-0 bg-transparent p-0 shadow-none" />
          </div>
        </div>

        <div className="mt-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            {isKorean ? '총 잔액' : 'Total balance'}
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-white sm:text-5xl font-numeric">
            {loading ? <span className="inline-block h-12 w-40 animate-pulse rounded-lg bg-slate-700" /> : shownBalance}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
              {isKorean ? '사용 가능' : 'Available'}
            </p>
            <p className="mt-1 truncate text-base font-semibold text-emerald-50 font-numeric">{shownAvailable}</p>
          </div>
          <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">
              {isKorean ? '보류 중' : 'Pending'}
            </p>
            <p className="mt-1 truncate text-base font-semibold text-amber-50 font-numeric">{shownPending}</p>
          </div>
        </div>

        <div className="mt-4 flex min-h-6 items-center justify-between gap-3">
          {vipGold ? (
            <span className="vip-gold-card inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
              <Crown className="h-3 w-3 fill-amber-400 text-amber-600" />VIP
            </span>
          ) : <span />}
          <p className="text-xs text-slate-400">{isKorean ? 'TRC-20 네트워크' : 'USDT · TRC-20 network'}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <BuyUsdtButton loading={buyLoading} funding={fundingLoading} onClick={onBuy} disabled={!canBuy || unavailable} />
          <Button type="button" variant="outline" onClick={onSell} disabled={!canTrade || unavailable} className="h-11 rounded-xl border-slate-600 bg-slate-800 text-white hover:border-amber-300/60 hover:bg-slate-700 hover:text-white disabled:opacity-50">
            <PaymentBrandLogo brand="USDT" size="sm" className="mr-2 h-5 w-5 border-0 bg-transparent p-0 shadow-none" />
            {isKorean ? '판매' : 'Sell'}
          </Button>
          <Button type="button" onClick={onSend} disabled={unavailable} className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
            <Send className="mr-2 h-4 w-4" />{isKorean ? '보내기' : 'Send'}
          </Button>
          <Button type="button" onClick={onReceive} disabled={unavailable} data-guide-target="wallet-usdt-receive" className="h-11 rounded-xl bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">
            <ArrowDownToLine className="mr-2 h-4 w-4" />{isKorean ? '받기' : 'Receive'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
