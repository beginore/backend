import bcrypt from "bcryptjs";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/user.js";
import jwt from 'jsonwebtoken'; 

// Регистрация пользователя
export const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please Fill All Fields!", 400));
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler("Email Already Exists!", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      success: true,
      message: "User Registered Successfully!",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    return next(error);
  }
};


// Логин пользователя
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email and Password!", 400));
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid Email or Password!", 401));
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid Email or Password!", 401));
    }

    // Создание токена JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email }, // payload
      process.env.JWT_SECRET, // секретный ключ из .env
      { expiresIn: "1h" } // время жизни токена (например, 1 час)
    );

    res.status(200).json({
      success: true,
      message: "Logged In Successfully!",
      user: { id: user._id, name: user.name, email: user.email },
      token, // Возвращаем токен
    });
  } catch (error) {
    return next(error);
  }
};


// Обновление данных пользователя
export const updateUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  const userId = req.userId; // Извлекаем userId из токена, добавленного в middleware

  if (!userId) {
    return next(new ErrorHandler("User ID is required!", 400));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found!", 404));
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully!",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    return next(error);
  }
};

// Удаление пользователя
export const deleteUser = async (req, res, next) => {
  const userId = req.userId; // Извлекаем userId из токена

  if (!userId) {
    return next(new ErrorHandler("User ID is required!", 400));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found!", 404));
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully!",
    });
  } catch (error) {
    return next(error);
  }
};
