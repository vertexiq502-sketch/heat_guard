import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { supabase } from '../config/supabase';

export const siteRoutes = Router();

/**
 * GET /api/v1/sites
 * List all active sites from Supabase
 */
siteRoutes.get('/', authenticate, async (req: any, res) => {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/sites
 * Create a new site in Supabase and assign to supervisor
 */
siteRoutes.post('/', authenticate, async (req: any, res) => {
  try {
    const { name, address, district, site_type, default_exposure, risk_level, lat, lon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Site name is required' });
    }

    const dist = (district && district.trim()) || 'Hyderabad';
    const pointLocation = (lat && lon)
      ? `POINT(${lon} ${lat})`
      : dist === 'Warangal'
      ? 'POINT(79.648 18.047)'
      : 'POINT(78.347 17.448)';

    const sitePayload = {
      name: name.trim(),
      address: address ? address.trim() : `${dist}, Telangana`,
      district: dist,
      site_type: site_type || 'construction',
      default_exposure: default_exposure || 'fullSun',
      risk_level: risk_level || 'green',
      location: pointLocation,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newSite, error: insertError } = await supabase
      .from('sites')
      .insert([sitePayload])
      .select()
      .single();

    if (insertError) {
      console.error('[POST /sites] Insert error:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    // Automatically assign newly created site to the supervisor in Supabase
    if (req.user.role === 'supervisor') {
      await supabase.from('worker_assignments').insert({
        worker_id: req.user.id,
        site_id: newSite.id,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0]
      });
    }

    res.status(201).json({ success: true, site: newSite });
  } catch (err: any) {
    console.error('[POST /sites] Unexpected error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/sites/assign-samples
 * Assign 2 sample sites to the authenticated supervisor in Supabase
 */
siteRoutes.post('/assign-samples', authenticate, async (req: any, res) => {
  try {
    const supervisorId = req.user.id;

    // Pick top 2 sample sites from Supabase
    const { data: availableSites, error: fetchErr } = await supabase
      .from('sites')
      .select('id, name')
      .eq('is_active', true)
      .limit(2);

    if (fetchErr || !availableSites || availableSites.length === 0) {
      return res.status(404).json({ error: 'No sample sites found in database' });
    }

    const assigned = [];
    for (const site of availableSites) {
      const { data: existing } = await supabase
        .from('worker_assignments')
        .select('id')
        .eq('worker_id', supervisorId)
        .eq('site_id', site.id)
        .maybeSingle();

      if (!existing) {
        const { data: newAssignment } = await supabase
          .from('worker_assignments')
          .insert({
            worker_id: supervisorId,
            site_id: site.id,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();
        assigned.push(newAssignment);
      }
    }

    res.json({
      success: true,
      message: 'Two sample sites linked to supervisor in Supabase',
      assignedCount: assigned.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});