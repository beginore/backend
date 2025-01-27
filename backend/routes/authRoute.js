import express from "express";
import { registerUser, loginUser, updateUser, deleteUser, verifyOtp, resendOtp } from "../controller/auth.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.put("/update", authMiddleware, updateUser); 
router.delete("/delete", authMiddleware, deleteUser);

router.get("/verify-otp", (req, res) => {
    res.render("otpVerification", { error: null, message: null });
  });
  
  router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      const result = await verifyOtp({ body: { email, otp } }, res); // Call controller function
      res.render("otpVerification", { error: null, message: result.message });
    } catch (err) {
      res.render("otpVerification", { error: err.message, message: null });
    }
  });
  
  router.post("/resend-otp", async (req, res) => {
    const { email } = req.body;
  
    try {
      const result = await resendOtp({ body: { email } }, res); // Call controller function
      res.render("otpVerification", { error: null, message: result.message });
    } catch (err) {
      res.render("otpVerification", { error: err.message, message: null });
    }
  });

  
export default router;
