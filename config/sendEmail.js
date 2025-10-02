import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.RESEND_API) {
    console.log("❌ Provide RESEND_API inside the .env file");
}

const resend = new Resend(process.env.RESEND_API);

const sendEmail = async ({ sendTo, subject, html }) => {
    try {
        const { data, error } = await resend.emails.send({
            // ✅ Resend ka default verified sender
            from: 'onboarding@resend.dev',   
            to: sendTo,
            subject: subject,
            html: html,
        });

        if (error) {
            console.error("❌ Email Error:", error);
            return null;
        }

        console.log("✅ Email sent successfully:", data);
        return data;

    } catch (error) {
        console.error("❌ Exception:", error);
        return null;
    }
};

export default sendEmail;
