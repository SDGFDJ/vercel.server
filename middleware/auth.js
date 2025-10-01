import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';

const auth = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookie or Authorization header
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Provide token", success: false });

    // 2️⃣ Verify token
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) return res.status(401).json({ message: "Unauthorized access", success: false });

    // 3️⃣ Fetch user from DB
    const userId = decode._id || decode.userId; // support both formats
    const user = await UserModel.findById(userId);
    if (!user) return res.status(401).json({ message: "User not found", success: false });

    // 4️⃣ Attach to request
    req.userId = user._id;
    req.userRole = (user.role || "USER").toUpperCase();

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "You are not logged in", success: false });
  }
};

export default auth;
