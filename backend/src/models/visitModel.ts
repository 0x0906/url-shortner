import { query } from "../config/db";

export interface IVisit {
  id: string;
  url_id: string;
  ip_address: string | null;
  user_agent: string | null;
  visited_at: Date;
}

export const visitModel = {
  async recordVisit(urlId: string, ipAddress: string | null, userAgent: string | null): Promise<IVisit> {
    const res = await query(
      `INSERT INTO visits (url_id, ip_address, user_agent, visited_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [urlId, ipAddress, userAgent]
    );
    return res.rows[0];
  },

  async getLastVisitForUrl(urlId: string): Promise<IVisit | null> {
    const res = await query(
      "SELECT * FROM visits WHERE url_id = $1 ORDER BY visited_at DESC LIMIT 1",
      [urlId]
    );
    return res.rows[0] || null;
  },

  async getVisitsForUrlAfter(urlId: string, afterDate: Date): Promise<IVisit[]> {
    const res = await query(
      "SELECT * FROM visits WHERE url_id = $1 AND visited_at >= $2 ORDER BY visited_at ASC",
      [urlId, afterDate]
    );
    return res.rows;
  },

  async getVisitsForUrl(urlId: string, limit: number = 500): Promise<IVisit[]> {
    const res = await query(
      "SELECT * FROM visits WHERE url_id = $1 ORDER BY visited_at DESC LIMIT $2",
      [urlId, limit]
    );
    return res.rows;
  },

  async getRecentVisitsByUser(userId: string, afterDate: Date): Promise<IVisit[]> {
    const res = await query(
      `SELECT v.* 
       FROM visits v
       INNER JOIN urls u ON v.url_id = u.id
       WHERE u.user_id = $1 AND v.visited_at >= $2
       ORDER BY v.visited_at ASC`,
      [userId, afterDate]
    );
    return res.rows;
  },

  async getVisitsForUserBreakdown(userId: string, limit: number = 1000): Promise<IVisit[]> {
    const res = await query(
      `SELECT v.* 
       FROM visits v
       INNER JOIN urls u ON v.url_id = u.id
       WHERE u.user_id = $1
       ORDER BY v.visited_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  },

  async getRecentActivityByUser(userId: string, limit: number = 5): Promise<any[]> {
    const res = await query(
      `SELECT v.id, v.ip_address, v.user_agent, v.visited_at,
              u.id as url_id, u.short_code, u.custom_alias, u.original_url
       FROM visits v
       INNER JOIN urls u ON v.url_id = u.id
       WHERE u.user_id = $1
       ORDER BY v.visited_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  },
};
