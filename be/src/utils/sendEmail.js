const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER || 'testaccount',
      pass: process.env.SMTP_PASS || 'testpass',
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'StudyFriend'} <${process.env.FROM_EMAIL || 'noreply@studyfriend.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
    console.log(`\n=== 📧 MOCK EMAIL DISPATCHED ===`);
    console.log(`TO:      ${options.email}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`--------------------------------`);
    if (options.resetUrl) {
      console.log(`PASSWORD RESET URL:`);
      console.log(`${options.resetUrl}`);
    } else {
      console.log(options.message || options.html?.replace(/<[^>]*>?/gm, ''));
    }
    console.log(`================================\n`);
  }
};

module.exports = sendEmail;
