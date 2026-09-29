import WalletPage from '../Wallet';

export default function WalletDesktop({ cryptoOnly = false }: { cryptoOnly?: boolean }) {
  return <WalletPage cryptoOnly={cryptoOnly} layout="desktop" />;
}
