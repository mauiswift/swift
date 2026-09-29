import WalletPage from '../Wallet';

export default function WalletMobile({ cryptoOnly = false }: { cryptoOnly?: boolean }) {
  return <WalletPage cryptoOnly={cryptoOnly} layout="mobile" />;
}
