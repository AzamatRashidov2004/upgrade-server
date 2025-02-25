export const welcomeTemplate = (user) => `
  <!DOCTYPE html>
  <html>
  <body>
    <h1>Welcome ${user.name}!</h1>
    <p>Thank you for joining our platform.</p>
    <p>Start exploring now:</p>
    <a href="${process.env.APP_URL}/dashboard">Go to Dashboard</a>
  </body>
  </html>
`;
