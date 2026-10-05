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
          <p className="text-3xl font-bold tracking-tight text-slate-950">{shownBalance}</p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isKorean ? '사용 가능' : 'Available'}</span>
            <span className="font-semibold text-emerald-800">{shownAvailable}</span>
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
    <Card className="card-3d overflow-hidden border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/30 ring-1 ring-blue-100/50 transition-all hover:shadow-lg">
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-200" />
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">{title}</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f2a5f]/10 p-2">
            <PaymentBrandLogo brand="USDT" size="sm" className="h-7 w-7 border-0 bg-transparent p-0 shadow-none" />
          </div>
        </div>
        {hasOrganizationWallet && organizationName && (
          <p className="mb-2 truncate text-xs text-slate-500">{organizationName}</p>
        )}
        <p className="text-3xl font-semibold text-foreground">
          {loading ? <span className="inline-block h-10 w-32 animate-pulse rounded-lg bg-slate-100" /> : shownBalance}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Available</p>
            <p className="mt-0.5 truncate text-xs font-bold text-emerald-900">{shownAvailable}</p>
          </div>
          <div className="rounded-lg bg-amber-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Pending</p>
            <p className="mt-0.5 truncate text-xs font-bold text-amber-900">{shownPending}</p>
          </div>
        </div>
        {vipGold && <div className="vip-gold-card mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
          <Crown className="h-3 w-3 fill-amber-400 text-amber-600" />VIP
        </div>}
        <div className="mt-3">
          <p className="text-xs text-slate-500">{isKorean ? 'TRC-20 네트워크' : 'TRC-20 Network'}</p>
        </div>
        <div className="mt-4 grid min-h-[44px] grid-cols-4 gap-2">
          <BuyUsdtButton compact loading={buyLoading} funding={fundingLoading} onClick={onBuy} disabled={!canBuy} />
          <button type="button" title="Sell USDT" aria-label="Sell USDT" onClick={onSell} disabled={!canTrade} className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50">
            <PaymentBrandLogo brand="USDT" size="sm" className="h-5 w-5 border-0 bg-transparent p-0 shadow-none" />
            <span className="text-[10px] font-bold">SELL</span>
          </button>
          <button type="button" title="Send USDT" aria-label="Send USDT" onClick={onSend} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-600/20 transition-all hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">
            <Send className="h-4 w-4" />
          </button>
          <button type="button" title="Receive USDT" aria-label="Receive USDT" data-guide-target="wallet-usdt-receive" onClick={onReceive} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            <ArrowDownToLine className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
