const forgotPasswordTemplate = ({ name, otp }) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border-radius:10px; background: linear-gradient(135deg, #fceabb, #f8b500); border:1px solid #e0e0e0;">
    
    <!-- Logo -->
    <div style="text-align:center; margin-bottom:20px;">
      <img src="client/public/LOGO3.jpeg" alt="Trendiify" style="width:150px; height:auto;">
    </div>
    
    <h2 style="color:#333; text-align:center;">Hello ${name},</h2>
    
    <p style="font-size:16px; color:#444; text-align:center;">
      You requested to reset your password. Use the following OTP to proceed:
    </p>
    
    <!-- OTP Box -->
    <div style="background: #ff4b2b; color: #fff; font-size:28px; font-weight:700; padding:20px; text-align:center; border-radius:10px; margin:20px 0;">
      ${otp}
    </div>
    
    <p style="font-size:14px; color:#333; text-align:center;">
      This OTP is valid for <strong>1 hour</strong>. Enter this OTP on the Binkeyit website to reset your password.
    </p>
    
    <!-- Button -->
    <div style="text-align:center; margin:30px 0;">
      <table cellspacing="0" cellpadding="0" border="0" align="center">
        <tr>
          <td align="center" bgcolor="#1e88e5" style="border-radius:5px;">
            <a href="http://localhost:5173/login" target="_blank" style="display:inline-block; padding:12px 25px; font-size:16px; color:#fff; text-decoration:none; font-weight:bold; border-radius:5px;">
              Go to Login
            </a>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="font-size:14px; color:#555; text-align:center; margin-top:20px;">
      Thanks,<br/>
      <strong>Trendiify Team</strong>
    </p>
    
    <!-- Footer -->
    <div style="text-align:center; font-size:12px; color:#777; margin-top:30px;">
      © 2025 Trendiify. All rights reserved.
    </div>
    
  </div>
  `;
};

export default forgotPasswordTemplate;
