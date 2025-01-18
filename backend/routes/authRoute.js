import express from "express";
import { registerUser, loginUser, updateUser, deleteUser } from "../controller/auth.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.put("/update", authMiddleware, updateUser); 
router.delete("/delete", authMiddleware, deleteUser);

export default router;
