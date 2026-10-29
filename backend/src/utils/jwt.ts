import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "mySuperSecretKeyForJwtTokenGenerationThatIsLongEnough123456";
const ACCESS_EXPIRATION = parseInt(process.env.JWT_ACCESS_EXPIRATION || "900000");

export function generateAccessToken(userId: string, sessionId: string): string {
  return jwt.sign(
    { id: userId, sessionId },
    SECRET,
    { expiresIn: Math.floor(ACCESS_EXPIRATION / 1000) }
  );
}

export function verifyToken(token: string): { id: string; sessionId?: string } {
  return jwt.verify(token, SECRET) as { id: string; sessionId?: string };
}
