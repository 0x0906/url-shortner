import { query } from "../config/db";

export interface IUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_verified: boolean;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
  created_at: Date;
}

export const userModel = {
  async findByEmail(email: string): Promise<IUser | null> {
    const res = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    return res.rows[0] || null;
  },

  async findById(id: string): Promise<IUser | null> {
    const res = await query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0] || null;
  },

  async findByVerificationToken(token: string): Promise<IUser | null> {
    const res = await query("SELECT * FROM users WHERE verification_token = $1", [token]);
    return res.rows[0] || null;
  },

  async findByResetToken(hashedToken: string): Promise<IUser | null> {
    const res = await query("SELECT * FROM users WHERE reset_token = $1", [hashedToken]);
    return res.rows[0] || null;
  },

  async createUser(
    name: string,
    email: string,
    passwordHash: string,
    verificationToken: string | null,
    isVerified: boolean = false
  ): Promise<IUser> {
    const res = await query(
      `INSERT INTO users (name, email, password_hash, verification_token, is_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, passwordHash, verificationToken, isVerified]
    );
    return res.rows[0];
  },

  async verifyUser(id: string): Promise<void> {
    await query(
      "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1",
      [id]
    );
  },

  async setResetToken(id: string, resetToken: string, expiresAt: Date): Promise<void> {
    await query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
      [resetToken, expiresAt, id]
    );
  },

  async resetPassword(id: string, passwordHash: string): Promise<void> {
    await query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
       WHERE id = $2`,
      [passwordHash, id]
    );
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
  },
};
