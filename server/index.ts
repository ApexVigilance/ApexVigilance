
/**
 * Server Implementation Reference
 * This file is for deployment on a Node.js server (e.g. Vercel, Heroku, VPS).
 * It cannot run inside the browser-based Vite preview.
 */

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large payloads for PDF

const PORT = process.env.PORT || 3000;

// Config Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/email/incident', async (req, res) => {
  const { to, subject, html, attachments } = req.body;

  if (!to || !to.length || !subject || !html) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Apex Ops" <no-reply@apex-vigilance.be>',
      to: to.join(','),
      subject,
      html,
      attachments: attachments?.map((att: any) => ({
        filename: att.filename,
        content: att.contentBase64,
        encoding: 'base64',
        contentType: att.contentType
      }))
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    
    return res.json({ ok: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Email Error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
