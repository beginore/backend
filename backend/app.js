import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path"; 
import { errorMiddleware } from "./middlewares/error.js";
import reservationRouter from "./routes/reservationRoute.js";
import { dbConnection } from "./database/dbConnection.js";
import authRouter from "./routes/authRoute.js";
import bcrypt from "bcrypt"


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

app.set("views", path.join(path.resolve(), "frontend", "profile", "views"));
app.set('view engine', 'ejs');

app.use(express.static(path.join(path.resolve(), "frontend", "profile", "public")));
;

app.get("/", (req, res)=>{
  res.render("profile")
})
app.get("/signin" , (req, res) => {
  res.render("signin");
});
app.get("/signup", (req, res) => {
  res.render("signup");
});

//register
app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  }

  //cheking if username exists
  const existingUser = await collection.findOne({name: data.name});
  if(existingUser) {
    res.send("User already exists. Please choose a different username.");
  }else {
    const userdata = await collection.insertMany(data);
    console.log(userdata);
  }
  
})

//signin
app.post("/signin", async (req, res) => {
  try{
    const check = await collection.findOne({name: req.body.name});
    if(!check) {
      res.send("Username can not found.")
    }

    //checking password
    const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
    if(isPasswordMatch) {
      res.render("profile");
    } else{
      req.send("Wrong Password.")
    }
  }catch {
    res.send("Wrong Details.")
  }
})





console.log("MONGO_URL:", process.env.MONGO_URL);

dbConnection();

app.use(errorMiddleware);

export default app;