const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  initialize() {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT, 10) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        this.isConfigured = true;
      }
    } catch (error) {
      console.warn('Email service not configured:', error.message);
      this.isConfigured = false;
    }
  }

  async verifyConnection() {
    if (!this.transporter) return false;
    
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.warn('Email verification failed:', error.message);
      return false;
    }
  }

  generateMailtoLink(toEmail, subject, body, attachmentNote = '') {
    const encodedSubject = encodeURIComponent(subject);
    const fullBody = attachmentNote 
      ? `${body}\n\n---\n${attachmentNote}`
      : body;
    const encodedBody = encodeURIComponent(fullBody);
    
    return `mailto:${toEmail}?subject=${encodedSubject}&body=${encodedBody}`;
  }

  async createEmailPreview(options) {
    const {
      to = '',
      subject,
      body,
      from = '',
      resumePath = null,
      resumeFileName = 'resume.pdf'
    } = options;

    const preview = {
      to,
      from: from || process.env.SMTP_USER || 'your-email@example.com',
      subject,
      body,
      hasAttachment: !!resumePath,
      attachmentName: resumeFileName,
      mailtoLink: this.generateMailtoLink(
        to,
        subject,
        body,
        resumePath ? `[Please attach your resume: ${resumeFileName}]` : ''
      ),
      canSend: this.isConfigured && !!to
    };

    return preview;
  }

  async sendEmail(options) {
    const {
      to,
      subject,
      body,
      resumePath,
      resumeFileName = 'resume.pdf'
    } = options;

    if (!this.isConfigured || !this.transporter) {
      throw new Error('Email service is not configured. Please use the mailto link instead.');
    }

    if (!to) {
      throw new Error('Recipient email is required');
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject,
        text: body,
        html: this.convertToHtml(body)
      };

      if (resumePath) {
        mailOptions.attachments = [{
          filename: resumeFileName,
          path: resumePath
        }];
      }

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      };
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  convertToHtml(text) {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  formatEmailBody(body) {
    return body.replace(/\\n/g, '\n');
  }
}

module.exports = new EmailService();
