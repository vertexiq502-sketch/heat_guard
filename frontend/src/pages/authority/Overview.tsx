import { useAuthorityData } from '../../hooks/useDashboardData';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';



function formatTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export const AuthorityOverview = () => {
  const { data, isLoading, isError, error, refetch } = useAuthorityData();

  if (isLoading) return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <LoadingSkeleton lines={2} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <LoadingSkeleton key={i} lines={2} />)}
      </div>
      <LoadingSkeleton lines={5} />
    </div>
  );

  if (isError) return (
    <div className="p-4 max-w-5xl mx-auto h-[60vh] flex items-center">
      <ErrorState message={(error as Error)?.message || 'Error loading dashboard'} onRetry={() => refetch()} />
    </div>
  );

  if (!data) return <div className="p-4 text-gray-500">No data available.</div>;

  const { sites, escalations, alerts, stats } = data as any;
  const safeWorkers    = stats?.safeWorkers    ?? 0;
  const cautionWorkers = stats?.cautionWorkers ?? 0;
  const dangerWorkers  = stats?.dangerWorkers  ?? 0;
  const assessed = safeWorkers + cautionWorkers + dangerWorkers;

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto pb-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">District Authority Overview</h1>
        <p className="text-gray-600 text-sm mt-1">District Compliance & Safety Monitor</p>
      </header>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Sites</p>
          <p className="text-3xl font-bold mt-2">{stats?.totalSites ?? (sites?.length ?? 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Workers</p>
          <p className="text-3xl font-bold mt-2">{stats?.totalWorkers ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Elevated Risk Sites</p>
          <p className="text-3xl font-bold mt-2 text-orange-600">{stats?.criticalSites ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pending Escalations</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{stats?.pendingEscalations ?? (escalations?.length ?? 0)}</p>
        </div>
      </section>

      {/* ── Worker Risk Distribution ────────────────────────── */}
      {assessed > 0 ? (
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">System-Wide Worker Risk Distribution</h2>
          <div className="flex rounded-full overflow-hidden h-5 mb-3">
            {safeWorkers > 0 && (
              <div className="bg-green-400 h-full" style={{ width: `${(safeWorkers / assessed) * 100}%` }} title={`Safe: ${safeWorkers}`} />
            )}
            {cautionWorkers > 0 && (
              <div className="bg-orange-400 h-full" style={{ width: `${(cautionWorkers / assessed) * 100}%` }} title={`Caution: ${cautionWorkers}`} />
            )}
            {dangerWorkers > 0 && (
              <div className="bg-red-500 h-full" style={{ width: `${(dangerWorkers / assessed) * 100}%` }} title={`Danger: ${dangerWorkers}`} />
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>Safe: {safeWorkers}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"/>Caution: {cautionWorkers}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>Danger: {dangerWorkers}</span>
          </div>
        </section>
      ) : (
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Worker Risk Distribution</h2>
          <p className="text-sm text-gray-400 italic">No risk assessments recorded yet.</p>
        </section>
      )}

      {/* ── Active Alerts ───────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
          {alerts?.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">{alerts.length}</span>
          )}
        </div>
        {(!alerts || alerts.length === 0) ? (
          <div className="p-6">
            <EmptyState message="No active alerts across the district." icon="✅" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.slice(0, 10).map((alert: any) => (
              <div key={alert.id} className={`p-4 flex justify-between items-start gap-3 ${
                alert.severity === 'critical' ? 'bg-red-50' : ''
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(alert.created_at)}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded font-bold uppercase ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Unresolved Escalations ──────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Unresolved Escalations</h2>
        </div>
        {(!escalations || escalations.length === 0) ? (
          <div className="p-8 text-center text-gray-500">
            <span className="text-4xl block mb-2">✅</span>
            All sites are currently compliant. No active escalations.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {escalations.map((esc: any) => (
              <div key={esc.id} className="p-4 hover:bg-red-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded mb-2">
                      LEVEL {esc.level} ESCALATION
                    </span>
                    <h3 className="font-bold text-gray-900">{esc.sites?.name || 'Unknown Site'}</h3>
                    {esc.sites?.district && <p className="text-xs text-gray-500">{esc.sites.district}</p>}
                    <p className="text-gray-700 text-sm mt-1">{esc.alerts?.title || 'Unknown Alert'}: {esc.alerts?.message}</p>
                    <p className="text-red-600 text-sm mt-1">Reason: {esc.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(esc.created_at)}</p>
                  </div>
                  <button className="shrink-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-sm text-sm font-semibold transition-colors">
                    Review Case
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── All Monitored Sites ─────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-3">All Monitored Sites</h2>
        {(!sites || sites.length === 0) ? (
          <EmptyState message="No active sites found." icon="🏗️" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sites.map((site: any) => (
              <div key={site.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900">{site.name}</h3>
                  <p className="text-sm text-gray-500">{site.district}</p>
                  {site.site_type && <p className="text-xs text-gray-400 capitalize mt-0.5">{site.site_type}</p>}
                </div>
                <span
                  className={`w-3 h-3 rounded-full ${
                    site.risk_level === 'red'    ? 'bg-red-500' :
                    site.risk_level === 'orange' ? 'bg-orange-500' :
                    site.risk_level === 'yellow' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  title={`Risk Level: ${site.risk_level || 'Unknown'}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
