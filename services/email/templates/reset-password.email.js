export const resetPasswordTemplate = (user, resetLink) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { 
      background-color: #4299e1; 
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
    <h2>Password Reset Request</h2>
    <p>Hello ${user.name},</p>
    <p>We received a request to reset your password. Click the button below to reset it:</p>
    
    <a href="${resetLink}" class="button">Reset Password</a>
    
    <p>If you didn't request this password reset, you can safely ignore this email.</p>
    <p>This link will expire in 1 hour for security reasons.</p>
    
    <div class="footer">
      <p>Best regards,<br/>The ${process.env.APP_NAME} Team</p>
      <p>If you're having trouble with the button, copy and paste this URL into your browser:</p>
      <p>${resetLink}</p>
    </div>
  </div>
</body>
</html>
`;
