import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Student from "../models/Student.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const student = await Student.findOne({ email: profile.emails[0].value });
      if (!student) {
        return done(null, false, { message: "Student not found" });
      }
      const user = {
        name: student.name,
        email: student.email,
        isAdmin: student.isAdmin,
        avatar:profile.photos[0]?.value,
        id:student._id
      };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "24h" });
      return done(null, { user, token });
    }
  )
);
