import mg from "./mailgun.config.js";
import { welcomeTemplate } from "./templates/welcome.email.js";
import { resetPasswordTemplate } from "./templates/reset-password.email.js";
import { notificationTemplate } from "./templates/notification.email.js";

class EmailService {
  constructor() {
    this.domain = process.env.MAILGUN_DOMAIN;
  }

  async sendEmail(payload) {
    try {
      const data = {
        from: `Your App <noreply@${this.domain}>`,
        to: payload.recipient,
        subject: payload.subject,
        html: payload.template,
        ...(payload.attachment && { attachment: payload.attachment }),
      };

      return await mg.messages.create(this.domain, data);
    } catch (error) {
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    const template = resetPasswordTemplate(user, resetLink);

    return this.sendEmail({
      recipient: user.email,
      subject: "Password Reset Request",
      template,
    });
  }

  async sendNotificationEmail(user, notification) {
    const template = notificationTemplate(user, notification);

    return this.sendEmail({
      recipient: user.email,
      subject: notification.subject || "New Notification",
      template,
    });
  }

  async sendWelcomeEmail(user) {
    const template = welcomeTemplate(user);
    return this.sendEmail({
      recipient: user.email,
      subject: "Welcome to Our Platform!",
      template,
    });
  }
}

export default new EmailService();
