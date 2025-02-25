import EmailService from "../services/email/emailService.js";

export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const result = await EmailService.sendEmail({
      recipient: process.env.CONTACT_EMAIL,
      subject: `New Contact Form Submission from ${name}`,
      template: `
        <p>Name: ${name}</p>
        <p>Email: ${email}</p>
        <p>Message: ${message}</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
