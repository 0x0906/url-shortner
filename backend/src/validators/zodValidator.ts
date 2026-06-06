import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import ErrorResponse from '../utils/errorResponse';
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
      'Must be 8+ characters with an uppercase, lowercase, number, and special character.'
    )
});
export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.')
});
export const urlSchema = z.object({
  original_url: z.string().trim().url('Please enter a valid HTTP or HTTPS URL.'),
  custom_alias: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Custom alias can only contain alphanumeric characters, dashes, and underscores.')
    .min(3, 'Custom alias must be at least 3 characters.')
    .max(30, 'Custom alias cannot exceed 30 characters.')
    .optional()
    .nullable(),
  expires_at: z
    .string()
    .datetime({ message: 'Invalid expiration date format.' })
    .optional()
    .nullable()
    .or(z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid expiration date format.').optional().nullable())
});
export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((issue) => issue.message).join(' ');
      return next(new ErrorResponse(messages, 400));
    }
    next(error);
  }
};
