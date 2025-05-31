import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface LicenseWelcomeEmailData {
  userEmail: string;
  userName: string;
  appUrl: string;
  defaultPassword: string;
}

export async function sendLicenseWelcomeEmail(data: LicenseWelcomeEmailData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY not configured');
      return false;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to LOADMworkflow</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Arial', sans-serif;
                background-color: #f5f5f5;
                line-height: 1.6;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            .logo-container {
                margin-bottom: 20px;
            }
            .logo {
                max-width: 150px;
                height: auto;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
                color: #f97316;
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 16px;
                color: #cbd5e1;
            }
            .content {
                padding: 40px 30px;
                color: #374151;
            }
            .welcome-message {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 20px;
            }
            .credentials-box {
                background-color: #f8fafc;
                border: 2px solid #f97316;
                border-radius: 8px;
                padding: 25px;
                margin: 25px 0;
            }
            .credentials-title {
                font-size: 16px;
                font-weight: bold;
                color: #f97316;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
            }
            .credentials-title::before {
                content: "🔐";
                margin-right: 8px;
            }
            .credential-item {
                margin-bottom: 12px;
                font-family: 'Courier New', monospace;
            }
            .credential-label {
                font-weight: bold;
                color: #374151;
                display: inline-block;
                width: 100px;
            }
            .credential-value {
                background-color: #e5e7eb;
                padding: 4px 8px;
                border-radius: 4px;
                color: #1f2937;
                font-weight: bold;
            }
            .steps-container {
                background-color: #f0f9ff;
                border-radius: 8px;
                padding: 25px;
                margin: 25px 0;
            }
            .steps-title {
                font-size: 16px;
                font-weight: bold;
                color: #0369a1;
                margin-bottom: 15px;
            }
            .step {
                margin-bottom: 12px;
                display: flex;
                align-items: flex-start;
            }
            .step-number {
                background-color: #f97316;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                margin-right: 12px;
                flex-shrink: 0;
            }
            .step-text {
                color: #374151;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);
                transition: transform 0.2s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
            }
            .warning-box {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .warning-title {
                font-weight: bold;
                color: #92400e;
                margin-bottom: 5px;
            }
            .warning-text {
                color: #78350f;
                font-size: 14px;
            }
            .footer {
                background-color: #1e293b;
                padding: 30px;
                text-align: center;
                color: #94a3b8;
            }
            .footer-logo {
                max-width: 100px;
                height: auto;
                margin-bottom: 15px;
            }
            .footer p {
                margin: 5px 0;
                font-size: 14px;
            }
            .footer a {
                color: #f97316;
                text-decoration: none;
            }
            @media (max-width: 600px) {
                .email-container {
                    margin: 0;
                    box-shadow: none;
                }
                .header, .content {
                    padding: 20px;
                }
                .logo {
                    max-width: 120px;
                }
                .header h1 {
                    font-size: 24px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div class="logo-container">
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Digital Dynamics Logo" class="logo">
                </div>
                <h1>Welcome to LOADMworkflow</h1>
                <p>Your military logistics training platform</p>
            </div>

            <!-- Main Content -->
            <div class="content">
                <div class="welcome-message">
                    Welcome, ${data.userName}!
                </div>
                
                <p>Your account has been successfully created for <strong>LOADMworkflow</strong>, the comprehensive military logistics and training management platform designed for loadmaster operations.</p>

                <div class="credentials-box">
                    <div class="credentials-title">Your Login Credentials</div>
                    <div class="credential-item">
                        <span class="credential-label">Email:</span>
                        <span class="credential-value">${data.userEmail}</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Password:</span>
                        <span class="credential-value">${data.defaultPassword}</span>
                    </div>
                </div>

                <div class="warning-box">
                    <div class="warning-title">⚠️ Important Security Notice</div>
                    <div class="warning-text">
                        You will be required to change your password on first login for security purposes. Please choose a strong, unique password.
                    </div>
                </div>

                <div class="steps-container">
                    <div class="steps-title">Getting Started - Follow These Steps:</div>
                    
                    <div class="step">
                        <div class="step-number">1</div>
                        <div class="step-text">Click the "Access LOADMworkflow" button below to open the application</div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-text">Enter your email address and the temporary password provided above</div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">3</div>
                        <div class="step-text">Create a new secure password when prompted</div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">4</div>
                        <div class="step-text">Explore the training modules, load planning tools, and calculators</div>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="${data.appUrl}" class="cta-button">Access LOADMworkflow</a>
                </div>

                <p><strong>What you'll have access to:</strong></p>
                <ul>
                    <li>🛩️ Aircraft load planning for C-17, C-130, C-27J, and KC30A</li>
                    <li>🧮 Professional calculation tools (WAM, PSI, Fuel, Restraint)</li>
                    <li>📚 Comprehensive training modules and interactive content</li>
                    <li>💬 Real-time chat system for instructor support</li>
                    <li>📋 Document management and scenario planning</li>
                    <li>📊 Progress tracking and performance analytics</li>
                </ul>

                <p>If you have any questions or need assistance, please don't hesitate to contact your instructor or system administrator.</p>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>Digital Dynamics</strong></p>
                <p>Military Logistics Training Solutions</p>
                <p>This email was sent because a LOADMworkflow account was created for you.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
Welcome to LOADMworkflow, ${data.userName}!

Your account has been successfully created for LOADMworkflow, the comprehensive military logistics and training management platform.

LOGIN CREDENTIALS:
Email: ${data.userEmail}
Password: ${data.defaultPassword}

IMPORTANT: You will be required to change your password on first login for security purposes.

GETTING STARTED:
1. Visit: ${data.appUrl}
2. Login with your email and temporary password
3. Create a new secure password when prompted
4. Explore the training modules and tools

FEATURES YOU'LL HAVE ACCESS TO:
- Aircraft load planning for C-17, C-130, C-27J, and KC30A
- Professional calculation tools (WAM, PSI, Fuel, Restraint)
- Comprehensive training modules and interactive content
- Real-time chat system for instructor support
- Document management and scenario planning
- Progress tracking and performance analytics

If you have any questions, please contact your instructor or system administrator.

Best regards,
Digital Dynamics Team
    `;

    const msg = {
      to: data.userEmail,
      from: {
        email: 'noreply@digitaldynamics.com',
        name: 'Digital Dynamics - LOADMworkflow'
      },
      subject: 'Welcome to LOADMworkflow - Your Account is Ready!',
      text: textContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`Welcome email sent successfully to ${data.userEmail}`);
    return true;

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}