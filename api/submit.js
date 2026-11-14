const nodemailer = require('nodemailer');

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const d = req.body || {};
  if (d.website) return res.status(200).json({ ok: true }); // spam trap
  if (!d['Full Name'] || !d['Personal Email ID']) return res.status(400).json({ ok: false });

  const photo = d.__photo;
  delete d.__photo; delete d.website;

  const rows = Object.entries(d).map(([k, v]) =>
    `<tr><td style="padding:6px 10px;border:1px solid #ccc;background:#f2f5fa;font-weight:bold">${esc(k)}</td>` +
    `<td style="padding:6px 10px;border:1px solid #ccc">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('');

  const attachments = [];
  if (photo && /^data:image\/jpeg;base64,/.test(photo)) {
    attachments.push({
      filename: `${String(d['Full Name']).replace(/[^\w\- ]/g, '')}_passport_photo.jpg`,
      content: photo.split(',')[1],
      encoding: 'base64'
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  });

  try {
    await transporter.sendMail({
      from: `"Zenjade Joining Form" <${process.env.GMAIL_USER}>`,
      to: 'hrzenjade@gmail.com',
      cc: 'zenjadeautomation@gmail.com, hrkarthickzenjade@gmail.com',
      replyTo: d['Personal Email ID'],
      subject: 'New Employee Joining Form Submission',
      html: `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows}</table>`,
      attachments
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
};
