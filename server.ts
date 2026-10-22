import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Silent Print Notification endpoint (Dispatches alert to Adel whenever a quotation is printed/downloaded)
  app.post('/api/notify-print', async (req: Request, res: Response) => {
    try {
      const {
        quoteNo,
        customerName,
        project,
        total,
        currency = 'AED',
        userName = 'Team Member',
        userEmail = '',
        userRole = 'Staff',
        action = 'print',
        recipientEmail = 'adel.tow.2026@gmail.com',
        smtpSettings,
      } = req.body;

      const formattedDate = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Dubai',
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      console.log('---------------------------------------------------------');
      console.log(`[PRINT ALERT - TOUCH OF WOOD]`);
      console.log(`Time: ${formattedDate} (UAE Time)`);
      console.log(`Action: ${action.toUpperCase()}`);
      console.log(`Printed By: ${userName} (${userEmail || 'No Email'} - ${userRole})`);
      console.log(`Quotation: ${quoteNo}`);
      console.log(`Customer: ${customerName}`);
      console.log(`Project: ${project}`);
      console.log(`Total: ${total} ${currency}`);
      console.log(`Dispatched Alert To: ${recipientEmail}`);
      console.log('---------------------------------------------------------');

      // Attempt to send via Nodemailer if SMTP configured or environment SMTP provided
      let emailSent = false;
      let emailError: string | undefined;

      const host = smtpSettings?.smtpHost || process.env.SMTP_HOST;
      const port = Number(smtpSettings?.smtpPort || process.env.SMTP_PORT || 587);
      const user = smtpSettings?.smtpUser || process.env.SMTP_USER;
      const pass = smtpSettings?.smtpPass || process.env.SMTP_PASS;

      if (host && user && pass) {
        try {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
          });

          await transporter.sendMail({
            from: `"Touch Of Wood System" <${user}>`,
            to: recipientEmail,
            subject: `🔔 Quotation ${action === 'print' ? 'Printed' : 'Downloaded'}: ${quoteNo} by ${userName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
                <div style="background-color: #0f172a; color: #ffffff; padding: 16px; border-radius: 6px; text-align: center;">
                  <h2 style="margin: 0; font-size: 18px; letter-spacing: 0.5px;">TOUCH OF WOOD DECORATION WORKS LLC</h2>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Confidential Admin Activity Notice</p>
                </div>
                <div style="padding: 20px 0;">
                  <h3 style="color: #0f172a; margin-top: 0;">Quotation ${action === 'print' ? 'Printed' : 'Downloaded as PDF'}</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 140px;">Quotation Number:</td>
                      <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${quoteNo}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Customer:</td>
                      <td style="padding: 8px 0; color: #0f172a;">${customerName || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Project Reference:</td>
                      <td style="padding: 8px 0; color: #0f172a;">${project || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Grand Total:</td>
                      <td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 15px;">${total} ${currency}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Staff Member:</td>
                      <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${userName} <span style="color: #64748b; font-weight: normal;">(${userRole})</span></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Staff Email:</td>
                      <td style="padding: 8px 0; color: #0f172a;">${userEmail || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Timestamp:</td>
                      <td style="padding: 8px 0; color: #0f172a;">${formattedDate}</td>
                    </tr>
                  </table>
                </div>
                <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 11px; color: #64748b; text-align: center;">
                  Automated security notification triggered by Touch Of Wood Quotation Management System.
                </div>
              </div>
            `,
          });
          emailSent = true;
          console.log(`Email successfully delivered to ${recipientEmail}`);
        } catch (err: any) {
          emailError = err?.message || 'SMTP dispatch failed';
          console.warn(`SMTP error sending email:`, emailError);
        }
      } else {
        // SMTP not configured yet; alert logged securely in server console & audit trail
        console.log(`Note: SMTP host not yet configured; alert captured in system audit log.`);
      }

      // Return quiet success to client
      return res.json({
        success: true,
        emailSent,
        error: emailError,
        loggedAt: formattedDate,
      });
    } catch (error: any) {
      console.error('Silent print notification error:', error);
      // Still return 200/quiet response so staff member is never interrupted
      return res.json({ success: true, silentCatch: true });
    }
  });

  // Vite development middleware vs Static Production bundle
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Touch Of Wood server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
