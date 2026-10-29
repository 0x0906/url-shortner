import { query } from "../config/db";

export interface ISession {
  id: string;
  user_id: string;
  refresh_token: string;
  device_name: string | null;
  ip_address: string | null;
  expires_at: Date;
  created_at: Date;
}

export const sessionModel = {
  async findByRefreshToken(refreshToken: string): Promise<ISession | null> {
    const res = await query("SELECT * FROM sessions WHERE refresh_token = $1", [refreshToken]);
    return res.rows[0] || null;
  },

  async findById(id: string): Promise<ISession | null> {
    const res = await query("SELECT * FROM sessions WHERE id = $1", [id]);
    return res.rows[0] || null;
  },

  async findByUserId(userId: string): Promise<ISession[]> {
    const res = await query(
      "SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.rows;
  },

  async cleanExpiredSessions(userId: string): Promise<void> {
    await query("DELETE FROM sessions WHERE user_id = $1 AND expires_at < NOW()", [userId]);
  },

  async upsertSession(
    userId: string,
    refreshToken: string,
    deviceName: string | null,
    ipAddress: string | null,
    expiresAt: Date
  ): Promise<ISession> {
    await this.cleanExpiredSessions(userId);

    const existingRes = await query(
      `SELECT * FROM sessions 
       WHERE user_id = $1 
         AND coalesce(device_name, '') = coalesce($2, '') 
         AND coalesce(ip_address, '') = coalesce($3, '')
       LIMIT 1`,
      [userId, deviceName, ipAddress]
    );

    if (existingRes.rows.length > 0) {
      const sessionId = existingRes.rows[0].id;
      const updateRes = await query(
        `UPDATE sessions 
         SET refresh_token = $1, expires_at = $2, created_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [refreshToken, expiresAt, sessionId]
      );
      return updateRes.rows[0];
    } else {
      const insertRes = await query(
        `INSERT INTO sessions (user_id, refresh_token, device_name, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, refreshToken, deviceName, ipAddress, expiresAt]
      );
      return insertRes.rows[0];
    }
  },

  async deleteById(id: string, userId?: string): Promise<boolean> {
    if (userId) {
      const res = await query("DELETE FROM sessions WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
      return (res.rowCount ?? 0) > 0;
    }
    const res = await query("DELETE FROM sessions WHERE id = $1 RETURNING id", [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async deleteByRefreshToken(refreshToken: string): Promise<void> {
    await query("DELETE FROM sessions WHERE refresh_token = $1", [refreshToken]);
  },

  async deleteAllForUser(userId: string): Promise<void> {
    await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  },
};
