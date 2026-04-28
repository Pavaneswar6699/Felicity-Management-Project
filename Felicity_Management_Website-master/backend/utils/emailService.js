// const nodemailer = require('nodemailer');

// const sendEmail = async ({ to, subject, html, attachments = [] }) => {
//     try {
//         const transporter = nodemailer.createTransport({
//             host: process.env.SMTP_HOST,
//             port: process.env.SMTP_PORT,
//             secure: true,
//             family: 4,
//             auth: {
//                 user: process.env.SMTP_USER,
//                 pass: process.env.SMTP_PASS
//             }
//         });

//         const info = await transporter.sendMail({
//             from: `"Felicity" <${process.env.SMTP_USER}>`,
//             to,
//             subject,
//             html,
//             attachments
//         });

//         console.log(`Email sent successfully to ${to}: ${info.messageId}`);
//         return true;
//     } catch (error) {
//         console.error(`Error sending email to ${to}:`, error.message);
//         return false;
//     }
// };

// module.exports = { sendEmail };

const postmark = require("postmark");

const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    try {
        await client.sendEmail({
            From: `"Felicity Team" <${process.env.POSTMARK_SENDER_EMAIL}>`,
            To: to,
            Subject: subject,
            HtmlBody: html,
            MessageStream: "outbound",
            Attachments: attachments,
        });

        console.log(`Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error.message);
        return false;
    }
};

module.exports = { sendEmail };