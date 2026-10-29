import { Router } from "express";
import { body } from "express-validator";
import { authController } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

const router = Router();

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const passwordValidationMessage =
  "Must be 8+ characters with an uppercase, lowercase, number, and special character.";

router.post(
  "/register",
  validate([
    body("name").notEmpty().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
    body("email")
      .notEmpty()
      .isEmail()
      .withMessage("Invalid email address.")
      .custom((value: string) => {
        const localPart = (value || "").split("@")[0] || "";
        if (localPart.includes("+")) {
          throw new Error("Email aliases using '+' are not allowed.");
        }
        return true;
      }),
    body("password").notEmpty().matches(passwordRegex).withMessage(passwordValidationMessage),
  ]),
  authController.register
);

router.post(
  "/login",
  validate([
    body("email").notEmpty().isEmail(),
    body("password").notEmpty(),
  ]),
  authController.login
);

router.post("/logout", authController.logout);

router.get("/me", requireAuth, authController.getMe);

router.get("/verify", authController.verifyEmail);

router.post("/refresh", authController.refresh);

router.get("/sessions", requireAuth, authController.getSessions);

router.delete("/sessions/:id", requireAuth, authController.terminateSession);

router.post("/logout-all", requireAuth, authController.logoutAll);

router.post(
  "/forgot-password",
  validate([body("email").notEmpty().isEmail()]),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  validate([
    body("token").notEmpty(),
    body("newPassword").notEmpty().matches(passwordRegex).withMessage(passwordValidationMessage),
  ]),
  authController.resetPassword
);

router.post(
  "/change-password",
  requireAuth,
  validate([
    body("oldPassword").notEmpty(),
    body("newPassword").notEmpty().matches(passwordRegex).withMessage(passwordValidationMessage),
  ]),
  authController.changePassword
);

export default router;
