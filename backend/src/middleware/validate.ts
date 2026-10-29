import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";

export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((e: any) => `${e.path}: ${e.msg}`)
        .join(", ");
      return res.status(400).json({ success: false, error: message });
    }

    next();
  };
}
