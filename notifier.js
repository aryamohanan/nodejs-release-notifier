const nodemailer = require('nodemailer');

async function sendEmail(recipients, subject, content) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER ,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

  try {
    for (const recipient of recipients) {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: recipient,
        subject: subject,
        html: content,
      };
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${recipient}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = sendEmail;
