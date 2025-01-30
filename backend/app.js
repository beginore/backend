import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import bcrypt from "bcrypt";
import session from "express-session";
import { fileURLToPath } from "url";
import { User } from "./models/user.js";
import { dbConnection } from "./database/dbConnection.js";
import { generateOtp } from "./middlewares/generateOtp.js";
import sendEmail from "./middlewares/email.js"; 

dotenv.config({ path: "./config/config.env" });

const app = express();

// Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

// Set up EJS templates
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, "../frontend/prof/views");
app.set("views", templatePath);
app.set("view engine", "ejs");

// Database connection
dbConnection();

// Routes
app.get("/", (req, res) => {
  res.render("sign");
});

app.get("/profile", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.render("profile", { user: req.session.user });
});

// Sign Up
app.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    };

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).send("User already exists. Please use a different email.");
    }

    const otp = generateOtp();
    console.log("Generated OTP:", otp);

    
    await User.create({ ...data, otp });
    req.session.otp = otp;
    req.session.email = data.email;

    
    await sendEmail({
      email: data.email,
      subject: "Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h1>Email Verification</h1>
          <p>Your OTP code is:</p>
          <h2>${otp}</h2>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    res.redirect("/verify");
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).send("Internal server error: " + error.message);
  }
});

// Route to render OTP verification page
app.get("/verify", (req, res) => {
  if (!req.session.email) {
    return res.redirect("/"); 
  }
  res.render("verify", { email: req.session.email });
});


// Verify OTP
app.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;

  try {
    const user = await User.findOne({ email: req.session.email });

    if (!user) {
      return res.status(400).send("User not found. Please register again.");
    }

    if (otp === req.session.otp) {
      user.otp = null;
      await user.save();

      req.session.user = { name: user.name, email: user.email };
      req.session.otp = null;
      req.session.email = null;

      return res.redirect("/profile");
    } else {
      return res.status(400).send("Invalid OTP. Please try again.");
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).send("Internal server error: " + error.message);
  }
});


// Resend OTP
app.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("User not found.");
    }

    const otp = generateOtp();
    user.otp = otp;
    await user.save();

    req.session.otp = otp;

    console.log(`New OTP for ${email}: ${otp}`);

    await sendEmail({
      email: user.email,
      subject: "Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h1>Email Verification</h1>
          <p>Your new OTP code is:</p>
          <h2>${otp}</h2>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    res.redirect("/verify");

  } catch (error) {
    console.error("Error during resend OTP:", error);
    res.status(500).send("Internal server error: " + error.message);
  }
});



// Sign In
app.post("/signin", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).send("Wrong email.");
    }

    const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
    if (isPasswordMatch) {
      req.session.user = { name: user.name, email: user.email };
      return res.redirect("/profile");
    } else {
      return res.send("Wrong Password.");
    }
  } catch (error) {
    console.error("Error during signin:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// Update Profile
app.post("/update", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!req.session.user) {
      return res.redirect("/");
    }

    await User.updateOne({ email: req.session.user.email }, { $set: { name, email } });

    req.session.user.name = name;
    req.session.user.email = email;

    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating details:", error);
    res.send("Failed to update details.");
  }
});

// Delete Account
app.post("/delete", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/");
    }

    await User.deleteOne({ email: req.session.user.email });
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting account:", error);
    res.send("Failed to delete account.");
  }
});

// Log Out
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          return res.status(500).send("Error");
      }
      res.redirect("/");
  });
});


export default app;