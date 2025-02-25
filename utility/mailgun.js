const axios = require("axios");
require("dotenv").config();

const sendMail = async (to, subject, text) => {
  try {
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;

    const response = await axios.post(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      new URLSearchParams({
        from: `Excited User <mailgun@${MAILGUN_DOMAIN}>`,
        to,
        subject,
        text,
      }),
      {
        auth: {
          username: "api",
          password: MAILGUN_API_KEY,
        },
      }
    );

    console.log("Email sent:", response.data);
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response?.data || error.message
    );
  }
};

module.exports = sendMail;
