import { ArrowDownToLine, Crown, Loader2, Send } from 'lucide-react';
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
      className="h-10 w-full rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-50"
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

  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md">
      <div className="h-1 bg-emerald-600" />
      <CardContent className={`space-y-5 ${mobile ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">{title}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                TRC-20
              </span>
            </div>
            {hasOrganizationWallet && organizationName && (
              <p className="mt-1 truncate text-xs text-slate-500">{organizationName}</p>
            )}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <PaymentBrandLogo brand="USDT" size="sm" className="h-6 w-6 border-0 bg-transparent p-0 shadow-none" />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-slate-500">
            {isKorean ? '총 잔액' : 'Total balance'}
          </p>
          <p className={`mt-1 break-words font-semibold tracking-tight text-slate-950 ${mobile ? 'text-3xl' : 'text-3xl sm:text-4xl'}`}>
            {loading ? <span className="inline-block h-9 w-36 animate-pulse rounded bg-slate-100" /> : shownBalance}
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50">
          <div className="min-w-0 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {isKorean ? '사용 가능' : 'Available'}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-emerald-800">{shownAvailable}</p>
          </div>
          <div className="min-w-0 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {isKorean ? '보류 중' : 'Pending'}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-amber-800">{shownPending}</p>
          </div>
        </div>

        <div className="flex min-h-6 items-center justify-between gap-3">
          {vipGold ? (
            <span className="vip-gold-card inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
              <Crown className="h-3 w-3 fill-amber-400 text-amber-600" />VIP
            </span>
          ) : <span />}
          <p className="text-xs text-slate-500">{isKorean ? 'TRC-20 네트워크' : 'USDT · TRC-20 network'}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <BuyUsdtButton loading={buyLoading} funding={fundingLoading} onClick={onBuy} disabled={!canBuy || unavailable} />
          <Button type="button" variant="outline" onClick={onSell} disabled={!canTrade || unavailable} className="h-10 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <PaymentBrandLogo brand="USDT" size="sm" className="mr-2 h-5 w-5 border-0 bg-transparent p-0 shadow-none" />
            {isKorean ? '판매' : 'Sell'}
          </Button>
          <Button type="button" onClick={onSend} disabled={unavailable} className="h-10 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50">
            <Send className="mr-2 h-4 w-4" />{isKorean ? '보내기' : 'Send'}
          </Button>
          <Button type="button" variant="outline" onClick={onReceive} disabled={unavailable} data-guide-target="wallet-usdt-receive" className="h-10 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <ArrowDownToLine className="mr-2 h-4 w-4" />{isKorean ? '받기' : 'Receive'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
