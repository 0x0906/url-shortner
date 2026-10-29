import { query } from "../config/db";

export interface IUrl {
  id: string;
  original_url: string;
  short_code: string;
  custom_alias: string | null;
  click_count: number;
  expires_at: Date | null;
  password_hash: string | null;
  is_one_time: boolean;
  is_active: boolean;
  user_id: string | null;
  created_at: Date;
}

export function formatUrl(url: IUrl) {
  return {
    id: url.id,
    original_url: url.original_url,
    short_code: url.short_code,
    custom_alias: url.custom_alias,
    click_count: Number(url.click_count || 0),
    expires_at: url.expires_at,
    is_one_time: Boolean(url.is_one_time),
    is_active: Boolean(url.is_active),
    user_id: url.user_id,
    created_at: url.created_at,
    has_password: url.password_hash !== null && url.password_hash !== undefined,
  };
}

export const urlModel = {
  async findById(id: string): Promise<IUrl | null> {
    const res = await query("SELECT * FROM urls WHERE id = $1", [id]);
    return res.rows[0] || null;
  },

  async findByShortCodeOrAlias(code: string): Promise<IUrl | null> {
    const res = await query(
      "SELECT * FROM urls WHERE short_code = $1 OR custom_alias = $1 LIMIT 1",
      [code]
    );
    return res.rows[0] || null;
  },

  async findByCodeOrAliasConflict(code: string): Promise<IUrl | null> {
    const res = await query(
      "SELECT * FROM urls WHERE short_code = $1 OR custom_alias = $1 LIMIT 1",
      [code]
    );
    return res.rows[0] || null;
  },

  async checkAliasConflict(alias: string, excludeId?: string): Promise<boolean> {
    if (excludeId) {
      const res = await query(
        "SELECT id FROM urls WHERE (short_code = $1 OR custom_alias = $1) AND id != $2 LIMIT 1",
        [alias, excludeId]
      );
      return res.rows.length > 0;
    }
    const res = await query(
      "SELECT id FROM urls WHERE short_code = $1 OR custom_alias = $1 LIMIT 1",
      [alias]
    );
    return res.rows.length > 0;
  },

  async create(data: {
    original_url: string;
    short_code: string;
    custom_alias: string | null;
    expires_at: Date | null;
    password_hash: string | null;
    is_one_time: boolean;
    user_id: string | null;
  }): Promise<IUrl> {
    const res = await query(
      `INSERT INTO urls (
        original_url, short_code, custom_alias, expires_at, password_hash, is_one_time, is_active, user_id, click_count
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, 0)
      RETURNING *`,
      [
        data.original_url,
        data.short_code,
        data.custom_alias,
        data.expires_at,
        data.password_hash,
        data.is_one_time,
        data.user_id,
      ]
    );
    return res.rows[0];
  },

  async getUrlsByUser(
    userId: string,
    search?: string,
    isActive?: boolean,
    page: number = 1,
    limit: number = 10
  ): Promise<{ urls: IUrl[]; total: number }> {
    const params: any[] = [userId];
    let whereClauses = ["user_id = $1"];

    if (search && search.trim()) {
      params.push(`%${search.toLowerCase().trim()}%`);
      const idx = params.length;
      whereClauses.push(
        `(LOWER(original_url) LIKE $${idx} OR LOWER(short_code) LIKE $${idx} OR LOWER(coalesce(custom_alias, '')) LIKE $${idx})`
      );
    }

    if (isActive !== undefined) {
      params.push(isActive);
      whereClauses.push(`is_active = $${params.length}`);
    }

    const whereSql = whereClauses.join(" AND ");

    const countRes = await query(`SELECT COUNT(*) as total FROM urls WHERE ${whereSql}`, params);
    const total = parseInt(countRes.rows[0].total || "0", 10);

    const offset = (page - 1) * limit;
    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const listRes = await query(
      `SELECT * FROM urls 
       WHERE ${whereSql} 
       ORDER BY created_at DESC 
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return { urls: listRes.rows, total };
  },

  async update(id: string, updates: Partial<IUrl>): Promise<IUrl | null> {
    const setClauses: string[] = [];
    const values: any[] = [];

    let i = 1;
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `UPDATE urls SET ${setClauses.join(", ")} WHERE id = $${i} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await query("DELETE FROM urls WHERE id = $1 AND user_id = $2 RETURNING id", [
      id,
      userId,
    ]);
    return (res.rowCount ?? 0) > 0;
  },

  async recordVisitAndIncrement(id: string, isOneTime: boolean): Promise<void> {
    if (isOneTime) {
      await query(
        "UPDATE urls SET click_count = click_count + 1, is_active = FALSE WHERE id = $1",
        [id]
      );
    } else {
      await query("UPDATE urls SET click_count = click_count + 1 WHERE id = $1", [id]);
    }
  },

  async findAllByUser(userId: string): Promise<IUrl[]> {
    const res = await query("SELECT * FROM urls WHERE user_id = $1 ORDER BY created_at DESC", [
      userId,
    ]);
    return res.rows;
  },
};
