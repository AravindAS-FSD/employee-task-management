import * as dashboardService from '../services/dashboardService.js';

export async function get(req, res) {
  res.json({ data: await dashboardService.getDashboard() });
}
