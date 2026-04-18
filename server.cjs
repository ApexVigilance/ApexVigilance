/**
 * Apex Ops - Email API Server
 * Draait naast de Vite dev server op poort 3001
 * Gebruikt nodemailer om facturen te verzenden via SMTP (one.com)
 *
 * Starten: node server.cjs
 */

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3001;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173', 'https://apexvigilance.github.io'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) callback(null, true);
    else callback(new Error('CORS: origine niet toegestaan'));
  }
}));
app.use(express.json({ limit: '25mb' })); // factuur PDF kan groot zijn

// Standaard one.com SMTP instellingen (worden overschreven door wat admin invult in Settings)
const DEFAULT_SMTP = {
  host: 'send.one.com',
  port: 465,
  secure: true, // SSL
  user: 'info@apexsecurity.be',
  pass: '' // admin vult wachtwoord in via Instellingen → SMTP
};

/**
 * POST /api/email/send
 * Body: {
 *   to: string[],
 *   subject: string,
 *   html: string,
 *   smtp?: { host, port, user, pass },
 *   attachments?: [{ filename, contentBase64, contentType }]
 * }
 */
app.post('/api/email/send', async (req, res) => {
  const { to, subject, html, attachments = [], smtp } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken: to, subject, html' });
  }

  // Gebruik SMTP config van de request (ingesteld door admin), of de standaard
  const smtpConfig = (smtp && smtp.host && smtp.user && smtp.pass) ? smtp : DEFAULT_SMTP;

  if (!smtpConfig.pass) {
    return res.status(400).json({
      error: 'Geen SMTP wachtwoord ingesteld. Ga naar Instellingen → SMTP en sla uw wachtwoord op.'
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host || DEFAULT_SMTP.host,
      port: parseInt(smtpConfig.port) || DEFAULT_SMTP.port,
      secure: parseInt(smtpConfig.port) === 465,
      auth: {
        user: smtpConfig.user || DEFAULT_SMTP.user,
        pass: smtpConfig.pass
      },
      tls: { rejectUnauthorized: false }
    });

    const mailOptions = {
      from: `"Apex Vigilance Group" <${smtpConfig.user || DEFAULT_SMTP.user}>`,
      to: to.join(', '),
      subject,
      html,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.contentBase64, 'base64'),
        contentType: att.contentType || 'application/pdf'
      }))
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email verzonden naar ${to.join(', ')} — MessageID: ${info.messageId}`);
    res.json({ ok: true, messageId: info.messageId });

  } catch (err) {
    console.error('❌ Email fout:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Apex Ops Email API' }));

app.listen(PORT, () => {
  console.log(`\n🚀 Apex Ops Email Server actief op http://localhost:${PORT}`);
  console.log(`   SMTP: ${DEFAULT_SMTP.host}:${DEFAULT_SMTP.port} (${DEFAULT_SMTP.user})`);
  console.log(`   ℹ️  Stel uw wachtwoord in via Instellingen → SMTP in de app\n`);
});
