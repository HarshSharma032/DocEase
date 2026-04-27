const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Using Ethereal or Dummy SMTP for local testing
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || 'dummy_user',
      pass: process.env.SMTP_PASSWORD || 'dummy_password'
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || 'DocBook'} <${process.env.FROM_EMAIL || 'noreply@docbook.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Email sending failed: ', error);
  }
};

module.exports = sendEmail;
