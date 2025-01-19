import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path"; 
import { errorMiddleware } from "./middlewares/error.js";
import reservationRouter from "./routes/reservationRoute.js";
import { dbConnection } from "./database/dbConnection.js";
import authRouter from "./routes/authRoute.js";
import bcrypt from "bcrypt"
import { User } from "./models/user.js";
import { fileURLToPath } from "url";



dotenv.config({ path: "./config/config.env" });
const app = express();



app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/reservation", reservationRouter);
app.use("/api/v1/auth", authRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, "../frontend/prof/views");
app.set("views", templatePath);
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("sign");
});
app.get("/profile", (req, res) => {
  res.render("profile");
});

// Register
app.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    };

    const existingUser = await User.findOne({ name: data.name });
    if (existingUser) {
      return res.status(400).send("User already exists. Please choose a different username.");
    }

    await User.create(data);
    res.render("profile")
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).send(`Internal server error: ${error.message}`);
  }
});


// Signin
app.post("/signin", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).send("Wrong email.");
    }

    const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
    if (isPasswordMatch) {
      return res.render("profile", { user: user }); // Pass user object to the view
    } else {
      return res.send("Wrong Password.");
    }
  } catch {
    return res.send("Wrong Details.");
  }
});


// Update Profile
app.post("/update", async (req, res) => {
  try {
    const { name, email } = req.body;
    // Update the user's details in the database
    await User.updateOne({ name: req.body.name }, { $set: { name, email } });
    res.redirect("/profile"); // Redirect to profile page after updating
  } catch (error) {
    res.send("Failed to update details.");
  }
});


// Delete Account
app.post("/delete", async (req, res) => {
  try {
    await User.deleteOne({ name: req.body.name });
    res.send("Account deleted successfully.");
  } catch (error) {
    res.send("Failed to delete account.");
  }
});




console.log("MONGO_URL:", process.env.MONGO_URL);

dbConnection();

app.use(errorMiddleware);

export default app;