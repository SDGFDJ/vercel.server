import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.accessToken; // Bearer token or cookie
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Check for both possible fields: userId (normal login) or _id (Google login)
    const userId = decoded.userId || decoded._id;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    req.userId = user._id;
    req.userRole = user.role?.toUpperCase() || "USER"; // ensure uppercase
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized", error: error.message });
  }
};
