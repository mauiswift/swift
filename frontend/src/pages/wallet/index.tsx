import ResponsiveRoute from '@/components/ResponsiveRoute';
import Desktop from './Desktop';
import Mobile from './Mobile';

export default function ResponsiveWalletPage({ cryptoOnly = false }: { cryptoOnly?: boolean }) {
  return (
    <ResponsiveRoute
      desktopComponent={Desktop}
      mobileComponent={Mobile}
      componentProps={{ cryptoOnly }}
    />
  );
}
