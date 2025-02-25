export const notificationTemplate = (user, notification) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .notification { background-color: #f7fafc; padding: 20px; border-radius: 8px; }
    .button { 
      background-color: #48bb78; 
      color: white; 
      padding: 12px 24px; 
      border-radius: 4px; 
      text-decoration: none;
      display: inline-block;
    }
    .footer { margin-top: 40px; font-size: 0.8em; color: #718096; }
  </style>
</head>
<body>
  <div class="container">
    <h2>${notification.title}</h2>
    <div class="notification">
      <p>Hello ${user.name},</p>
      ${notification.content}
      
      ${
        notification.actionUrl
          ? `
        <p style="margin-top: 20px;">
          <a href="${notification.actionUrl}" class="button">
            ${notification.actionText || "Take Action"}
          </a>
        </p>
      `
          : ""
      }
    </div>
    
    <div class="footer">
      <p>Best regards,<br/>The ${process.env.APP_NAME} Team</p>
      <p>Need help? Contact our support team at 
        <a href="mailto:${process.env.SUPPORT_EMAIL}">${
  process.env.SUPPORT_EMAIL
}</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
