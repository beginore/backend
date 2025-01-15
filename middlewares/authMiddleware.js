import jwt from "jsonwebtoken";
import ErrorHandler from "../middlewares/error.js";

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1]; // Извлекаем токен из заголовка

  if (!token) {
    return next(new ErrorHandler("Authorization token is required", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Добавляем userId в запрос
    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid token", 401));
  }
};
