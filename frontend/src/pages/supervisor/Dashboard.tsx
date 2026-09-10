import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupervisorData } from '../../hooks/useDashboardData';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../api/client';
import { Building2, MapPin, PlusCircle, Users, Cloud, Sparkles, X, CheckCircle2 } from 'lucide-react';

const RISK_COLORS: Record<string, string> = {
  red:    'bg-red-100 text-red-800 border-red-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  green:  'bg-green-100 text-green-800 border-green-200',
};

const RISK_LABELS: Record<string, string> = {
  red: 'DANGER', orange: 'CAUTION', yellow: 'CAUTION', green: 'SAFE',
};

const SITE_TYPE_ICONS: Record<string, string> = {
  construction: '🏗️ Construction Site',
  farm: '🌾 Agricultural Farm',
  delivery: '🛵 Delivery Fleet Zone',
};

function formatTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const SupervisorDashboard = () => {
  const { data, isLoading, isError, error, refetch } = useSupervisorData();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigningSample, setIsAssigningSample] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New site form state
  const [siteForm, setSiteForm] = useState({
    name: '',
    district: 'Hyderabad',
    address: '',
    site_type: 'construction',
    default_exposure: 'fullSun',
    risk_level: 'green',
  });

  if (isLoading) {
    return (
      <div className="p-4 max-w-5xl mx-auto space-y-4">
        <LoadingSkeleton lines={2} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} lines={2} />)}
        </div>
        <LoadingSkeleton lines={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 max-w-5xl mx-auto h-[60vh] flex items-center">
        <ErrorState message={(error as Error)?.message || 'Error loading dashboard'} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data) return <div className="p-4 text-gray-500">No data available.</div>;

  const sites: any[]    = data.sites ?? [];
  const workers: any[]  = data.workers ?? [];
  const alerts: any[]   = data.alerts ?? [];
  const stats: any      = data.stats ?? {};

  // Safe / caution / danger counts from stats (backend computed from risk_assessments)
  const assessed = (stats.safeWorkers ?? 0) + (stats.cautionWorkers ?? 0) + (stats.dangerWorkers ?? 0);
  const unassessed = (stats.totalWorkers ?? 0) - assessed;

  // Handle auto-assigning 2 sample sites directly in Supabase
  const handleAssignSampleSites = async () => {
    setIsAssigningSample(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiClient.post('/sites/assign-samples');
      await queryClient.invalidateQueries({ queryKey: ['supervisorDashboard'] });
      setActionSuccess('Two sample sites successfully stored and linked in Supabase!');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || 'Failed to assign sample sites.');
    } finally {
      setIsAssigningSample(false);
    }
  };

  // Handle creating a new site and storing it in Supabase
  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteForm.name.trim()) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiClient.post('/sites', siteForm);
      await queryClient.invalidateQueries({ queryKey: ['supervisorDashboard'] });
      setIsModalOpen(false);
      setSiteForm({
        name: '',
        district: 'Hyderabad',
        address: '',
        site_type: 'construction',
        default_exposure: 'fullSun',
        risk_level: 'green',
      });
      setActionSuccess('New site created and stored in Supabase!');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || 'Failed to create site.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Live overview of your managed sites and workers</p>
        </div>
        <div className="flex items-center gap-2">
          {sites.length < 2 && (
            <button
              onClick={handleAssignSampleSites}
              disabled={isAssigningSample}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAssigningSample ? 'Adding to Supabase...' : 'Add 2 Sample Sites'}
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add New Site
          </button>
        </div>
      </div>

      {/* ── Status Feedback ─────────────────────────────────── */}
      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-xl text-xs font-medium shadow-sm">
          {actionError}
        </div>
      )}

      {/* ── KPI cards ───────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Managed Sites</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">{stats.totalSites ?? sites.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Workers</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">{stats.totalWorkers ?? workers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">🔴 Danger</p>
          <p className="text-3xl font-bold mt-1 text-red-600">{stats.dangerWorkers ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">🚨 Active Alerts</p>
          <p className="text-3xl font-bold mt-1 text-orange-600">{stats.activeAlerts ?? alerts.length}</p>
        </div>
      </section>

      {/* ── Risk Distribution bar ───────────────────────────── */}
      {assessed > 0 && (
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Worker Risk Distribution</h2>
          <div className="flex rounded-full overflow-hidden h-4 mb-3 bg-gray-100">
            {stats.safeWorkers > 0 && (
              <div
                className="bg-green-500 h-full"
                style={{ width: `${(stats.safeWorkers / assessed) * 100}%` }}
                title={`Safe: ${stats.safeWorkers}`}
              />
            )}
            {stats.cautionWorkers > 0 && (
              <div
                className="bg-yellow-400 h-full"
                style={{ width: `${(stats.cautionWorkers / assessed) * 100}%` }}
                title={`Caution: ${stats.cautionWorkers}`}
              />
            )}
            {stats.dangerWorkers > 0 && (
              <div
                className="bg-red-500 h-full"
                style={{ width: `${(stats.dangerWorkers / assessed) * 100}%` }}
                title={`Danger: ${stats.dangerWorkers}`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Safe: {stats.safeWorkers}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />Caution: {stats.cautionWorkers}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Danger: {stats.dangerWorkers}</span>
            {unassessed > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />Unassessed: {unassessed}</span>}
          </div>
        </section>
      )}

      {/* ── Managed Sites ───────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Managed Sites ({sites.length})
          </h2>
          <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
            <Cloud className="w-3 h-3 text-blue-600" />
            Supabase Stored
          </span>
        </div>

        {sites.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm space-y-3">
            <EmptyState message="No sites currently assigned to you." icon="🏗️" />
            <button
              onClick={handleAssignSampleSites}
              disabled={isAssigningSample}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              {isAssigningSample ? 'Assigning...' : 'Place 2 Sample Sites in Supabase'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map((site: any) => {
              // Count workers at this specific site
              const siteWorkerCount = workers.filter((w: any) => w.site_id === site.id).length;

              return (
                <div key={site.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-300 transition space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-gray-900 leading-snug">{site.name}</h3>
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {site.address || `${site.district}, Telangana`}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${RISK_COLORS[site.risk_level] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {(RISK_LABELS[site.risk_level] ?? site.risk_level?.toUpperCase()) || 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                    <span className="font-medium bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                      {SITE_TYPE_ICONS[site.site_type] || site.site_type || 'Work Site'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-gray-700">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      {siteWorkerCount} {siteWorkerCount === 1 ? 'Worker' : 'Workers'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Active Alerts ────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
          <span>🚨</span> Active Alerts ({alerts.length})
        </h2>
        {alerts.length === 0 ? (
          <EmptyState message="No active alerts across managed sites." icon="✅" />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div key={alert.id} className={`border-l-4 p-4 rounded-r-2xl shadow-sm ${
                alert.severity === 'critical' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-400'
              }`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <strong className="text-gray-900 block font-semibold text-sm">{alert.title}</strong>
                    <p className="text-gray-700 text-xs mt-1 leading-relaxed">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatTime(alert.created_at)}</p>
                  </div>
                  <span className={`shrink-0 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    alert.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Workers Table ────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Workers Overview ({workers.length})
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider font-semibold text-gray-700">
                <tr>
                  <th className="px-4 py-3">Worker Name</th>
                  <th className="px-4 py-3">Work Type</th>
                  <th className="px-4 py-3">Latest Risk</th>
                  <th className="px-4 py-3">Eff. Temp</th>
                  <th className="px-4 py-3">Assessed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 italic text-xs">
                      No workers currently assigned to your sites.
                    </td>
                  </tr>
                ) : (
                  workers.map((worker: any) => {
                    const lr = worker.latestRisk;
                    return (
                      <tr key={worker.worker_id} className="hover:bg-gray-50/80 transition">
                        <td className="px-4 py-3 font-semibold text-gray-900">{worker.users?.name || 'Worker'}</td>
                        <td className="px-4 py-3 capitalize text-xs">{worker.users?.worker_type || '—'}</td>
                        <td className="px-4 py-3">
                          {lr ? (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${RISK_COLORS[lr.risk_level] ?? 'bg-gray-100 text-gray-600'}`}>
                              {RISK_LABELS[lr.risk_level] ?? lr.risk_level?.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No data</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold">{lr ? `${lr.effective_temp?.toFixed(1)}°C` : '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{lr ? formatTime(lr.timestamp) : '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Add Site Modal ───────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Add New Site to Supabase
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Site Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Expansion — Miyapur"
                  value={siteForm.name}
                  onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <select
                    value={siteForm.district}
                    onChange={(e) => setSiteForm({ ...siteForm, district: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Warangal">Warangal</option>
                    <option value="Nizamabad">Nizamabad</option>
                    <option value="Karimnagar">Karimnagar</option>
                    <option value="Medchal">Medchal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Site Type
                  </label>
                  <select
                    value={siteForm.site_type}
                    onChange={(e) => setSiteForm({ ...siteForm, site_type: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="construction">Construction</option>
                    <option value="farm">Agricultural Farm</option>
                    <option value="delivery">Delivery Fleet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Address / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Miyapur Depot, Hyderabad"
                  value={siteForm.address}
                  onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Exposure
                  </label>
                  <select
                    value={siteForm.default_exposure}
                    onChange={(e) => setSiteForm({ ...siteForm, default_exposure: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="fullSun">Full Sun</option>
                    <option value="partialShade">Partial Shade</option>
                    <option value="shade">Shade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Initial Risk
                  </label>
                  <select
                    value={siteForm.risk_level}
                    onChange={(e) => setSiteForm({ ...siteForm, risk_level: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="green">Green (Safe)</option>
                    <option value="yellow">Yellow (Caution)</option>
                    <option value="orange">Orange (High)</option>
                    <option value="red">Red (Danger)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving to Supabase...' : 'Save Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
