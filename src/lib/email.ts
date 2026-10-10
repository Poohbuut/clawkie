import 'server-only';

type Mail = { to: string; subject: string; html: string; replyTo?: string };

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]!);
}

export function layout(content: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;background:#fbf6ef;padding:32px 12px;color:#2b2b2b;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:20px;overflow:hidden;">
      <tr><td style="background:#2c1820;padding:22px 32px;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#fbf6ef;">Clawsette <i>&amp;</i> Cookie Cart</td></tr>
      <tr><td style="padding:32px;line-height:1.6;">${content}</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export async function sendEmail({ to, subject, html, replyTo }: Mail) {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;
  if (!key || !from) {
    console.warn('Email skipped: SENDGRID_API_KEY or EMAIL_FROM_ADDRESS not set');
    return;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: process.env.EMAIL_FROM_NAME || 'Clawsette & Cookie Cart' },
        ...(replyTo ? { reply_to: { email: replyTo } } : {}),
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (response.status !== 202) console.error('SendGrid error', response.status, await response.text());
  } catch (error) {
    console.error('Email send failed', error);
  }
}