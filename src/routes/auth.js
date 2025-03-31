import express from "express";
import passport from "passport";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_BASE_URL}`,
  }),
  (req, res) => {
    const { user, token } = req.user;
    res.redirect(
      `${process.env.CLIENT_BASE_URL}/callback?token=${token}&googleId=${
        user.googleId
      }&name=${encodeURIComponent(user.displayName)}&email=${user.email}`
    );
  }
);

export default router;
