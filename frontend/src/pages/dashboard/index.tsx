import ResponsiveRoute from '@/components/ResponsiveRoute';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useDashboardData } from './shared';
import DashboardDesktop from './Desktop';
import DashboardMobile from './Mobile';
import SystemAdminDashboard from './SystemAdminDashboard';

function DashboardLoadingState({ connected }: { connected: boolean }) {
  const placeholder = 'rounded-xl bg-slate-200/80';

  return (
    <Layout connected={connected}>
      <div role="status" aria-busy="true" aria-label="Loading dashboard" className="page-enter mx-auto min-h-[70vh] max-w-[1065px] space-y-6 py-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className={`${placeholder} h-7 w-48`} />
          <div className="flex gap-2">
            <div className={`${placeholder} h-10 w-full sm:w-72`} />
            <div className={`${placeholder} h-10 w-10`} />
          </div>
        </div>

        <div className={`${placeholder} h-10 w-44`} />

        <div className="grid gap-3 md:hidden">
          <div className="h-64 rounded-2xl bg-slate-900 p-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10" />
              <div className="space-y-2">
                <div className="h-3 w-28 rounded bg-white/10" />
                <div className="h-3 w-20 rounded bg-white/10" />
              </div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="h-3 w-28 rounded bg-white/10" />
                  <div className="h-4 w-20 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
          <div className="h-16 rounded-2xl bg-slate-100" />
        </div>

        <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-36 rounded-2xl bg-slate-100 p-5">
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="mt-7 h-6 w-36 rounded bg-slate-200" />
              <div className="mt-4 h-3 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className={`h-32 rounded-2xl bg-slate-100 p-5 ${index === 2 ? 'col-span-2 lg:col-span-1' : ''}`}>
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-6 h-7 w-32 rounded bg-slate-200" />
              <div className="mt-4 h-3 w-20 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="h-56 rounded-2xl bg-slate-100 p-5">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="mt-8 h-32 rounded-xl bg-slate-200/70" />
        </div>
        <div className="h-44 rounded-2xl bg-slate-100 p-5">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-7 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-14 rounded-xl bg-slate-200/70" />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function Dashboard() {
  const data = useDashboardData();

  if (data.isSuperAdmin) {
    return <SystemAdminDashboard />;
  }

  if (data.initialLoading) {
    return <DashboardLoadingState connected={data.connected} />;
  }

  if (data.dataError && !data.hasLoadedData) {
    return (
      <Layout connected={data.connected}>
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 text-center">
          <p role="alert" className="text-sm text-amber-900">{data.ui.dataLoadError}</p>
          <Button type="button" onClick={data.retryFetchData} disabled={data.loading}>
            {data.ui.retry}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <div className="page-enter">
      <ResponsiveRoute
        desktopComponent={DashboardDesktop}
        mobileComponent={DashboardMobile}
        componentProps={data}
      />
    </div>
  );
}
