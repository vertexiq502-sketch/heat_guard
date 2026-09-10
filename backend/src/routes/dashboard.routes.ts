import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { weatherService } from '../services/weather.service';
import { riskService } from '../services/risk.service';
import { parseWkbPoint, SITE_FALLBACK_COORDS } from '../utils/helpers';

export const dashboardRoutes = Router();

// ─── Shared helper: resolve lat/lon from PostGIS hex or district fallback ─────
function resolveSiteCoords(locationHex: string | null | undefined, district: string | null | undefined) {
  const decoded = parseWkbPoint(locationHex);
  if (decoded) return decoded;
  // Fallback to district-level coordinates
  if (district && SITE_FALLBACK_COORDS[district]) return SITE_FALLBACK_COORDS[district];
  return { lat: 17.448, lon: 78.347 }; // last-resort Hyderabad default
}

// ─── Worker Dashboard ──────────────────────────────────────────────────────────
dashboardRoutes.get('/worker', authenticate, authorizeRole('worker'), async (req: any, res) => {
  try {
    const user = req.user;

    // 1. Get active (non-resolved) alerts for this worker
    const { data: alerts } = await supabase
      .from('alerts')
      .select('id, title, message, title_te, message_te, title_hi, message_hi, type, severity, status, created_at, site_id')
      .eq('worker_id', user.id)
      .not('status', 'in', '("acknowledged","actioned")')
      .order('created_at', { ascending: false })
      .limit(10);

    // Check if worker provided real-time GPS coordinates
    const qLat = parseFloat(req.query.latitude as string);
    const qLon = parseFloat(req.query.longitude as string);
    const hasValidCoords =
      !isNaN(qLat) && !isNaN(qLon) && qLat >= -90 && qLat <= 90 && qLon >= -180 && qLon <= 180;

    // 2. Get assigned site — include location and district so we can get real coords
    const { data: assignment } = await supabase
      .from('worker_assignments')
      .select('site_id, sites(id, name, location, district, address, site_type, risk_level)')
      .eq('worker_id', user.id)
      .eq('is_active', true)
      .single();

    // 3. Fetch worker's recent risk assessments from Supabase
    const { data: recentRisks } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('worker_id', req.user.id)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (!assignment) {
      if (hasValidCoords) {
        // Worker has no assigned site, but provided GPS coordinates: calculate live weather & risk!
        const weather = await weatherService.getCurrentWeather(qLat, qLon);
        const risk = await riskService.calculateRisk(user, null as any, weather);

        return res.json({
          profile: user,
          site: {
            id: 'current-location',
            name: 'Current Location',
            district: 'Current GPS Location',
            isCurrentLocation: true,
            lat: qLat,
            lon: qLon,
          },
          weather,
          risk,
          recentRisks: recentRisks || [],
          alerts: alerts || [],
        });
      }

      return res.json({
        profile: user,
        site: null,
        weather: null,
        risk: null,
        alerts: alerts || [],
      });
    }

    const site: any = assignment.sites;

    // 4. Extract real coordinates from GPS query or PostGIS geography
    let lat: number;
    let lon: number;
    let isCurrentLocation = false;

    if (hasValidCoords) {
      lat = qLat;
      lon = qLon;
      isCurrentLocation = true;
    } else {
      const coords = resolveSiteCoords(site?.location, site?.district);
      lat = coords.lat;
      lon = coords.lon;
    }

    // 5. Get weather for coordinates (cached & Open-Meteo)
    const weather = await weatherService.getCurrentWeather(lat, lon, assignment.site_id);

    // 6. Calculate personalized risk using worker's profile
    const risk = await riskService.calculateRisk(user, assignment.site_id, weather);

    res.json({
      profile: user,
      site: { id: assignment.site_id, ...site, lat, lon, isCurrentLocation },
      weather,
      risk,
      recentRisks: recentRisks || [],
      alerts: alerts || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/dashboard/worker/record-risk
 * Insert a simulated or real risk assessment (Caution / Danger / Safe) into Supabase
 */
dashboardRoutes.post('/worker/record-risk', authenticate, authorizeRole('worker'), async (req: any, res) => {
  try {
    const { level } = req.body; // 'yellow' | 'orange' | 'red' | 'green'
    const user = req.user;

    const { data: assignment } = await supabase
      .from('worker_assignments')
      .select('site_id')
      .eq('worker_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    const siteId = assignment?.site_id || 'f3025350-df8a-4b6e-98fe-7e543a972f7b';

    let effective_temp = 27.4;
    let status = 'NORMAL';
    let rest = 'Standard breaks.';
    let hydration = 'Drink water when thirsty.';
    let alertTitle = 'HEAT ADVISORY: Conditions Normal';
    let alertMsg = 'Standard safety precautions in place.';
    let severity = 'info';

    const cleanLevel = level?.toLowerCase();

    if (cleanLevel === 'yellow' || cleanLevel === 'orange' || cleanLevel === 'caution') {
      effective_temp = 36.8;
      status = 'CAUTION';
      rest = 'Mandatory 15-minute rest in shade every hour.';
      hydration = 'Drink 750ml cool water per hour.';
      alertTitle = 'CAUTION: High Heat Stress Advisory';
      alertMsg = 'Temperature and heat index have reached caution levels. Increase hydration and take regular shaded breaks.';
      severity = 'warning';
    } else if (cleanLevel === 'red' || cleanLevel === 'danger') {
      effective_temp = 46.5;
      status = 'STOP WORK';
      rest = 'Mandatory work stoppage. Rest immediately in active cooling stations.';
      hydration = 'Drink ORS electrolytes immediately. Cool down with wet towels.';
      alertTitle = 'DANGER: Extreme Heat Index Spike';
      alertMsg = 'Effective temperature exceeds 45°C. Immediate work stoppage mandated. Move to shaded cooling shelters.';
      severity = 'critical';
    }

    const finalRiskLevel = (cleanLevel === 'red' || cleanLevel === 'danger')
      ? 'red'
      : (cleanLevel === 'yellow' || cleanLevel === 'orange' || cleanLevel === 'caution')
      ? 'yellow'
      : 'green';

    const riskData = {
      worker_id: user.id,
      site_id: siteId,
      risk_level: finalRiskLevel,
      risk_score: effective_temp,
      effective_temp,
      confidence: 'high',
      explanation: `Assessed risk level: ${status}. Adjustments applied for current shift profile.`,
      recommendation: {
        workStatus: status,
        restInstruction: rest,
        hydrationInstruction: hydration,
        additionalGuidance: 'Follow standard heat emergency protocol.'
      },
      timestamp: new Date().toISOString()
    };

    const { data: insertedRisk, error: riskErr } = await supabase
      .from('risk_assessments')
      .insert([riskData])
      .select()
      .single();

    if (riskErr) return res.status(500).json({ error: riskErr.message });

    if (finalRiskLevel !== 'green') {
      const alertData = {
        worker_id: user.id,
        site_id: siteId,
        risk_assessment_id: insertedRisk.id,
        type: finalRiskLevel === 'red' ? 'danger' : 'caution',
        severity,
        title: alertTitle,
        message: alertMsg,
        title_te: finalRiskLevel === 'red' ? 'ప్రమాదం: అత్యంత వేడి సూచిక' : 'జాగ్రత్త: పెరుగుతున్న వేడి సలహా',
        message_te: finalRiskLevel === 'red'
          ? 'ఉష్ణోగ్రత 45 డిగ్రీలు దాటింది. వెంటనే బయట పని ఆపి నీడ ప్రదేశానికి వెళ్ళండి. పుష్కలంగా నీరు మరియు ఓఆర్ఎస్ త్రాగండి.'
          : 'ఉష్ణోగ్రత మరియు వేడి సూచిక హెచ్చరిక స్థాయికి చేరుకున్నాయి. ప్రతి గంటకు నీరు త్రాగండి మరియు క్రమం తప్పకుండా నీడలో విశ్రాంతి తీసుకోండి.',
        title_hi: finalRiskLevel === 'red' ? 'खतरा: अत्यधिक गर्मी का जोखिम' : 'सावधानी: बढ़ती गर्मी की सलाह',
        message_hi: finalRiskLevel === 'red'
          ? 'प्रभावी तापमान 45°C से अधिक हो गया है। तुरंत काम रोकें और छायादार आश्रय में जाएं। ओआरएस और पानी पिएं।'
          : 'तापमान और हीट इंडेक्स चेतावनी स्तर पर पहुंच गया है। अधिक पानी पिएं और छाया में नियमित विश्राम लें।',
        status: 'pending',
        delivery_channel: 'in_app',
        escalation_level: finalRiskLevel === 'red' ? 2 : 0,
        created_at: new Date().toISOString()
      };

      await supabase.from('alerts').insert([alertData]);
    }

    res.status(201).json({ success: true, risk: insertedRisk });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Supervisor Dashboard ──────────────────────────────────────────────────────
dashboardRoutes.get('/supervisor', authenticate, authorizeRole('supervisor'), async (req: any, res) => {
  try {
    // 1. Get sites assigned to this supervisor
    let { data: supervisorAssignments } = await supabase
      .from('worker_assignments')
      .select('site_id, sites(id, name, risk_level, district, site_type, location)')
      .eq('worker_id', req.user.id)
      .eq('is_active', true);

    // If supervisor has no sites assigned yet, auto-assign 2 sample sites into Supabase
    if (!supervisorAssignments || supervisorAssignments.length === 0) {
      const { data: sampleSites } = await supabase
        .from('sites')
        .select('id')
        .eq('is_active', true)
        .limit(2);

      if (sampleSites && sampleSites.length > 0) {
        const rows = sampleSites.map((s: any) => ({
          worker_id: req.user.id,
          site_id: s.id,
          is_active: true,
          start_date: new Date().toISOString().split('T')[0]
        }));
        await supabase.from('worker_assignments').insert(rows);

        // Re-fetch supervisor assignments directly from Supabase
        const refreshed = await supabase
          .from('worker_assignments')
          .select('site_id, sites(id, name, risk_level, district, site_type, location)')
          .eq('worker_id', req.user.id)
          .eq('is_active', true);

        supervisorAssignments = refreshed.data || [];
      }
    }

    if (!supervisorAssignments || supervisorAssignments.length === 0) {
      return res.json({
        sites: [],
        workers: [],
        alerts: [],
        stats: { totalSites: 0, totalWorkers: 0, safeWorkers: 0, cautionWorkers: 0, dangerWorkers: 0, activeAlerts: 0, unacknowledgedAlerts: 0 }
      });
    }

    const siteIds = [...new Set(supervisorAssignments.map(a => a.site_id))];
    const sites = supervisorAssignments.map(a => a.sites).filter(Boolean);

    // 2. Get all workers assigned to these sites (excluding supervisors themselves)
    const { data: workerAssignments } = await supabase
      .from('worker_assignments')
      .select('worker_id, site_id, users(id, name, role, worker_type, intensity, exposure, clothing, duration, language)')
      .in('site_id', siteIds)
      .eq('is_active', true);

    // Filter to only actual workers (not other supervisors/authorities)
    const workers = (workerAssignments || []).filter((wa: any) => wa.users?.role === 'worker');

    // 3. Get latest risk assessment for each worker at these sites
    const workerIds = workers.map((w: any) => w.worker_id);
    let workerRisks: any[] = [];
    if (workerIds.length > 0) {
      const { data: latestRisks } = await supabase
        .from('risk_assessments')
        .select('worker_id, risk_level, risk_score, effective_temp, timestamp')
        .in('worker_id', workerIds)
        .order('timestamp', { ascending: false });

      // Keep only the latest risk per worker
      const seenWorkers = new Set<string>();
      workerRisks = (latestRisks || []).filter((r: any) => {
        if (seenWorkers.has(r.worker_id)) return false;
        seenWorkers.add(r.worker_id);
        return true;
      });
    }

    // 4. Merge worker risk data
    const riskByWorker = Object.fromEntries(workerRisks.map(r => [r.worker_id, r]));
    const enrichedWorkers = workers.map((wa: any) => ({
      ...wa,
      latestRisk: riskByWorker[wa.worker_id] || null
    }));

    // 5. Get active alerts for these sites
    const { data: alerts } = await supabase
      .from('alerts')
      .select('id, worker_id, site_id, title, message, type, severity, status, created_at, escalation_level')
      .in('site_id', siteIds)
      .not('status', 'in', '("actioned")')
      .order('created_at', { ascending: false })
      .limit(20);

    // 6. Compute stats
    const safeWorkers = workerRisks.filter(r => r.risk_level === 'green' || r.risk_level === 'yellow').length;
    const cautionWorkers = workerRisks.filter(r => r.risk_level === 'orange').length;
    const dangerWorkers = workerRisks.filter(r => r.risk_level === 'red').length;
    const activeAlerts = (alerts || []).length;
    const unacknowledgedAlerts = (alerts || []).filter((a: any) => a.status === 'pending' || a.status === 'sent').length;

    res.json({
      sites,
      workers: enrichedWorkers,
      alerts: alerts || [],
      stats: {
        totalSites: siteIds.length,
        totalWorkers: workers.length,
        safeWorkers,
        cautionWorkers,
        dangerWorkers,
        activeAlerts,
        unacknowledgedAlerts
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Authority Dashboard ───────────────────────────────────────────────────────
dashboardRoutes.get('/authority', authenticate, authorizeRole('authority'), async (req: any, res) => {
  try {
    // 1. All sites
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name, risk_level, district, site_type, is_active')
      .eq('is_active', true);

    const activeSiteIds = (sites || []).map((s: any) => s.id);

    // 2. All active worker assignments → worker count
    const { data: allWorkerAssignments } = await supabase
      .from('worker_assignments')
      .select('worker_id, site_id, users(role)')
      .eq('is_active', true);

    const activeWorkers = (allWorkerAssignments || []).filter((wa: any) => wa.users?.role === 'worker');
    const totalWorkers = new Set(activeWorkers.map((w: any) => w.worker_id)).size;

    // 3. Latest risk per worker → risk distribution
    const workerIds = [...new Set(activeWorkers.map((w: any) => w.worker_id))];
    let riskDistribution = { safe: 0, caution: 0, danger: 0 };
    if (workerIds.length > 0) {
      const { data: latestRisks } = await supabase
        .from('risk_assessments')
        .select('worker_id, risk_level, timestamp')
        .in('worker_id', workerIds)
        .order('timestamp', { ascending: false });

      const seen = new Set<string>();
      const latestByWorker: any[] = [];
      (latestRisks || []).forEach((r: any) => {
        if (!seen.has(r.worker_id)) {
          seen.add(r.worker_id);
          latestByWorker.push(r);
        }
      });

      riskDistribution.safe = latestByWorker.filter(r => r.risk_level === 'green' || r.risk_level === 'yellow').length;
      riskDistribution.caution = latestByWorker.filter(r => r.risk_level === 'orange').length;
      riskDistribution.danger = latestByWorker.filter(r => r.risk_level === 'red').length;
    }

    // 4. Active alerts across all sites
    const { data: alerts } = supabase ? await supabase
      .from('alerts')
      .select('id, worker_id, site_id, title, message, type, severity, status, created_at, escalation_level')
      .in('site_id', activeSiteIds)
      .not('status', 'in', '("actioned")')
      .order('created_at', { ascending: false })
      .limit(20) : { data: [] };

    // 5. Unresolved escalations
    const { data: escalations } = await supabase
      .from('escalation_events')
      .select('id, level, reason, triggered_by, created_at, acknowledged, alerts(id, title, message, site_id), sites(name, district)')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // 6. Risk breakdown by site
    const riskBySite = (sites || []).reduce((acc: any, site: any) => {
      acc[site.risk_level || 'green'] = (acc[site.risk_level || 'green'] || 0) + 1;
      return acc;
    }, {});

    res.json({
      sites: sites || [],
      escalations: escalations || [],
      alerts: alerts || [],
      stats: {
        totalSites: (sites || []).length,
        totalWorkers,
        safeWorkers: riskDistribution.safe,
        cautionWorkers: riskDistribution.caution,
        dangerWorkers: riskDistribution.danger,
        activeAlerts: (alerts || []).length,
        pendingEscalations: (escalations || []).length,
        criticalSites: (sites || []).filter((s: any) => s.risk_level === 'red' || s.risk_level === 'orange').length,
        siteRiskBreakdown: riskBySite
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});