import sendEmail from '../config/sendEmail.js'
import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js'
import generatedAccessToken from '../utils/generatedAccessToken.js'
import genertedRefreshToken from '../utils/generatedRefreshToken.js'
import { uploadImageCloudinaryFromBuffer } from '../utils/uploadImageClodinary.js'
import generatedOtp from '../utils/generatedOtp.js'
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// --------------------- Normal Register ---------------------
export async function registerUserController(req,res){
    try {
        const { name,email,password } = req.body
        if(!name || !email || !password) 
            return res.status(400).json({ message: "Provide all fields", error:true, success:false})

        const user = await UserModel.findOne({ email })
        if(user) return res.status(400).json({ message:"Email already registered", error:true, success:false })

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(password,salt)

        const newUser = new UserModel({ name,email,password:hashPassword })
        const saveUser = await newUser.save()

        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?code=${saveUser._id}`
        await sendEmail({
            sendTo: email,
            subject: "Verify email from Binkeyit",
            html: verifyEmailTemplate({ name, url: verifyUrl })
        })

        return res.json({ message:"User registered successfully", error:false, success:true, data:saveUser })
    } catch (error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Verify Email ---------------------
export async function verifyEmailController(req,res){
    try{
        const { code } = req.body
        const user = await UserModel.findById(code)
        if(!user) return res.status(400).json({ message:"Invalid code", error:true, success:false })

        await UserModel.updateOne({ _id: code }, { verify_email:true })
        return res.json({ message:"Email verified", error:false, success:true })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Normal Login ---------------------
export async function loginController(req,res){
    try{
        const { email,password } = req.body
        if(!email || !password) return res.status(400).json({ message:"Provide email & password", error:true, success:false })

        const user = await UserModel.findOne({ email })
        if(!user) return res.status(400).json({ message:"User not registered", error:true, success:false })
        if(user.status !== "Active") return res.status(400).json({ message:"Contact admin", error:true, success:false })

        const checkPassword = await bcryptjs.compare(password,user.password)
        if(!checkPassword) return res.status(400).json({ message:"Invalid password", error:true, success:false })

        const accesstoken = await generatedAccessToken(user._id)
        const refreshToken = await genertedRefreshToken(user._id)

        await UserModel.findByIdAndUpdate(user._id,{ last_login_date: new Date() })

        const cookiesOption = { httpOnly:true, secure:true, sameSite:"None" }
        res.cookie('accessToken',accesstoken,cookiesOption)
        res.cookie('refreshToken',refreshToken,cookiesOption)

        return res.json({ message:"Login successful", error:false, success:true, data:{ accesstoken, refreshToken }})
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Logout ---------------------
export async function logoutController(req,res){
    try{
        const userId = req.userId
        const cookiesOption = { httpOnly:true, secure:true, sameSite:"None" }
        res.clearCookie("accessToken",cookiesOption)
        res.clearCookie("refreshToken",cookiesOption)
        await UserModel.findByIdAndUpdate(userId,{ refresh_token:"" })
        return res.json({ message:"Logout successful", error:false, success:true })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Upload Avatar ---------------------
export async function uploadAvatar(req,res){
    try{
        const userId = req.userId
        const file = req.file
        if(!file) return res.status(400).json({ message:"No file uploaded", error:true, success:false })

        const upload = await uploadImageCloudinaryFromBuffer(file.buffer,"avatars")
        await UserModel.findByIdAndUpdate(userId,{ avatar: upload.secure_url })
        return res.json({ message:"Avatar uploaded", error:false, success:true, data:{ _id:userId, avatar:upload.secure_url } })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Update User Details ---------------------
export async function updateUserDetails(req,res){
    try{
        const userId = req.userId
        const { name,email,mobile,password } = req.body
        let hashPassword = ""
        if(password){ hashPassword = await bcryptjs.hash(password, await bcryptjs.genSalt(10)) }

        const updateUser = await UserModel.updateOne({ _id:userId },{
            ...(name && { name }),
            ...(email && { email }),
            ...(mobile && { mobile }),
            ...(password && { password: hashPassword })
        })
        return res.json({ message:"User updated", error:false, success:true, data:updateUser })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Forgot Password ---------------------
export async function forgotPasswordController(req,res){
    try{
        const { email } = req.body
        const user = await UserModel.findOne({ email })
        if(!user) return res.status(400).json({ message:"Email not found", error:true, success:false })

        const otp = generatedOtp()
        const expireTime = Date.now() + 60*60*1000
        await UserModel.findByIdAndUpdate(user._id,{ forgot_password_otp: otp, forgot_password_expiry: new Date(expireTime) })

        await sendEmail({ sendTo: email, subject:"Forgot Password OTP", html: forgotPasswordTemplate({ name:user.name, otp }) })
        return res.json({ message:"OTP sent", error:false, success:true })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Verify Forgot OTP ---------------------
export async function verifyForgotPasswordOtp(req,res){
    try{
        const { email, otp } = req.body
        if(!email || !otp) return res.status(400).json({ message:"Provide email & otp", error:true, success:false })

        const user = await UserModel.findOne({ email })
        if(!user) return res.status(400).json({ message:"Email not found", error:true, success:false })

        const currentTime = new Date()
        if(user.forgot_password_expiry < currentTime) return res.status(400).json({ message:"OTP expired", error:true, success:false })
        if(otp !== user.forgot_password_otp) return res.status(400).json({ message:"Invalid OTP", error:true, success:false })

        await UserModel.findByIdAndUpdate(user._id,{ forgot_password_otp:"", forgot_password_expiry:null })
        return res.json({ message:"OTP verified", error:false, success:true })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Reset Password ---------------------
export async function resetpassword(req,res){
    try{
        const { email,newPassword,confirmPassword } = req.body
        if(!email || !newPassword || !confirmPassword) return res.status(400).json({ message:"Provide all fields", error:true, success:false })
        if(newPassword !== confirmPassword) return res.status(400).json({ message:"Passwords do not match", error:true, success:false })

        const user = await UserModel.findOne({ email })
        if(!user) return res.status(400).json({ message:"Email not found", error:true, success:false })

        const hashPassword = await bcryptjs.hash(newPassword, await bcryptjs.genSalt(10))
        await UserModel.findByIdAndUpdate(user._id,{ password: hashPassword })

        return res.json({ message:"Password updated", error:false, success:true })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Refresh Token ---------------------
export async function refreshToken(req,res){
    try{
        const refreshToken = req.cookies.refreshToken || req?.headers?.authorization?.split(" ")[1]
        if(!refreshToken) return res.status(401).json({ message:"Invalid token", error:true, success:false })

        const verifyToken = await jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN)
        if(!verifyToken) return res.status(401).json({ message:"Token expired", error:true, success:false })

        const newAccessToken = await generatedAccessToken(verifyToken._id)
        const cookiesOption = { httpOnly:true, secure:true, sameSite:"None" }
        res.cookie('accessToken',newAccessToken,cookiesOption)

        return res.json({ message:"New access token generated", error:false, success:true, data:{ accessToken:newAccessToken } })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Get User Details ---------------------
export async function userDetails(req,res){
    try{
        const userId = req.userId
        const user = await UserModel.findById(userId).select('-password -refresh_token')
        return res.json({ message:"User details", data:user, error:false, success:true })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}

// --------------------- Google Register ---------------------
export async function googleAuthController(req, res) {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ message: "Credential missing", error: true, success: false });

        // 1️⃣ Verify Google Token
        const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
        if (!ticket) return res.status(400).json({ message: "Invalid Google credential", error: true, success: false });

        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name || "No Name";
        const picture = payload.picture || "";
        const googleId = payload.sub;

        if (!email) return res.status(400).json({ message: "Google account does not provide email", error: true, success: false });

        // 2️⃣ Check if user exists
        let user = await UserModel.findOne({ email });

        // 3️⃣ If user does not exist, auto-register
        if (!user) {
            user = new UserModel({
                name,
                email,
                googleId,
                avatar: picture,
                verify_email: true,
                status: "Active"
            });
            await user.save();
        }

        // 4️⃣ Generate JWT tokens
        const accessToken = await generatedAccessToken(user._id);
        const refreshToken = await genertedRefreshToken(user._id);

        // 5️⃣ Set cookies
        const cookiesOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // localhost friendly
            sameSite: "None"
        };
        res.cookie('accessToken', accessToken, cookiesOption);
        res.cookie('refreshToken', refreshToken, cookiesOption);

        return res.json({
            message: user ? "Google login successful" : "Google registration successful",
            error: false,
            success: true,
            data: { accessToken, refreshToken }
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        return res.status(500).json({ message: error.message, error: true, success: false });
    }
}

// --------------------- Google Login ---------------------
export async function googleLoginController(req,res){
    try{
        const { credential } = req.body
        if(!credential) return res.status(400).json({ message:"Credential missing", error:true, success:false })

        const ticket = await client.verifyIdToken({ idToken:credential, audience: process.env.GOOGLE_CLIENT_ID })
        const payload = ticket.getPayload()
        const { email, sub, picture } = payload

        let user = await UserModel.findOne({ email })
        if(!user){
            user = new UserModel({
                name: payload.name,
                email,
                googleId: sub,
                avatar: picture,
                verify_email: true,
                status: "Active"
            })
            await user.save()
        }

        const accesstoken = await generatedAccessToken(user._id)
        const refreshToken = await genertedRefreshToken(user._id)

        const cookiesOption = { httpOnly:true, secure:true, sameSite:"None" }
        res.cookie('accessToken',accesstoken,cookiesOption)
        res.cookie('refreshToken',refreshToken,cookiesOption)

        return res.json({ message:"Google login successful", error:false, success:true, data:{ accesstoken, refreshToken } })
    }catch(error){
        return res.status(500).json({ message:error.message, error:true, success:false })
    }
}
