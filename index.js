import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import { Server } from "socket.io";
import http from "http";
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/connectDB.js';

import userRouter from './route/user.route.js';
import categoryRouter from './route/category.route.js';
import uploadRouter from './route/upload.router.js';
import subCategoryRouter from './route/subCategory.route.js';
import productRouter from './route/product.route.js';
import cartRouter from './route/cart.route.js';
import addressRouter from './route/address.route.js';
import orderRouter from './route/order.route.js';
import { setupOrderCleanup } from './utils/orderCleanup.js'; // correct path
import notificationRouter from "./route/notification.route.js";

const app = express();

// HTTP server required for Socket.IO
const server = http.createServer(app);

// -------------------- SOCKET.IO SETUP --------------------
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Store io instance in app for controllers
app.set("io", io);

// Listen for connection
io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected: ", socket.id);
    });
});

// -------------------- MIDDLEWARE --------------------
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan());
app.use(helmet({ crossOriginResourcePolicy: false }));

// -------------------- ROUTES --------------------
app.get("/", (req, res) => {
    res.json({ message: "Server is running on " + (process.env.PORT || 8080) });
});

app.use('/api/user', userRouter);
app.use("/api/category", categoryRouter);
app.use("/api/file", uploadRouter);
app.use("/api/subcategory", subCategoryRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/notification", notificationRouter);
app.use('/api/order', orderRouter);

// -------------------- DATABASE & SERVER --------------------
const PORT = process.env.PORT || 8080;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log("Server is running on port", PORT);
        setupOrderCleanup();
    });
});
