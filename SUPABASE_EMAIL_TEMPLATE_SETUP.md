# Supabase Email Template Setup for OTP Verification

## Overview
This guide helps you update your Supabase email templates to use a professional, branded design for OTP verification instead of the basic confirmation URL format.

## Current Template Issue
The current template is too basic:
```html
<h2>Confirm your signup</h2>
<p>Here is your token {{ .Token }}</p>
```

## New Professional Template

### 1. Go to Supabase Dashboard
1. Navigate to your Supabase project dashboard
2. Go to **Authentication** → **Email Templates**
3. Select **Confirm signup** template

### 2. Replace with Professional Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - GoLet.ie</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            width: 48px;
            height: 48px;
            background-color: #ffffff;
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
            color: #3b82f6;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            color: #e0e7ff;
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .welcome-text {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 24px;
            text-align: center;
        }
        
        .otp-container {
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            margin: 32px 0;
        }
        
        .otp-label {
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .otp-code {
            font-size: 48px;
            font-weight: 700;
            color: #1f2937;
            letter-spacing: 0.2em;
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 16px;
        }
        
        .otp-instructions {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
        }
        
        .features {
            margin: 40px 0;
        }
        
        .features h3 {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 24px;
        }
        
        .feature-item {
            text-align: center;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .feature-icon {
            width: 32px;
            height: 32px;
            background-color: #3b82f6;
            border-radius: 8px;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
        }
        
        .feature-title {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .feature-desc {
            font-size: 12px;
            color: #6b7280;
        }
        
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 16px;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        
        .footer-link {
            color: #3b82f6;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
        }
        
        .security-note h4 {
            color: #92400e;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .security-note p {
            color: #92400e;
            font-size: 13px;
            line-height: 1.4;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 24px 20px;
            }
            
            .otp-code {
                font-size: 36px;
            }
            
            .feature-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">GL</div>
            <h1>Welcome to GoLet.ie</h1>
            <p>Ireland's safer rental platform</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p class="welcome-text">
                Hi there! 👋<br>
                Thanks for joining GoLet.ie. To complete your registration, please verify your email address.
            </p>
            
            <!-- OTP Code -->
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">{{ .Token }}</div>
                <p class="otp-instructions">
                    Enter this 6-digit code in the verification screen to complete your signup.<br>
                    This code will expire in 10 minutes for security.
                </p>
            </div>
            
            <!-- Security Note -->
            <div class="security-note">
                <h4>🔒 Security Notice</h4>
                <p>
                    Never share this code with anyone. GoLet.ie will never ask for your verification code via phone, email, or text message.
                </p>
            </div>
            
            <!-- Features -->
            <div class="features">
                <h3>What makes GoLet.ie different?</h3>
                <div class="feature-grid">
                    <div class="feature-item">
                        <div class="feature-icon">🛡️</div>
                        <div class="feature-title">Scam Protection</div>
                        <div class="feature-desc">Verified listings & secure payments</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">💬</div>
                        <div class="feature-title">In-App Messaging</div>
                        <div class="feature-desc">Safe communication with landlords</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">👥</div>
                        <div class="feature-title">Tenant Profiles</div>
                        <div class="feature-desc">Build trust with detailed profiles</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">⚖️</div>
                        <div class="feature-title">Fair Queueing</div>
                        <div class="feature-desc">Transparent application process</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                Questions? Contact our support team at support@golet.ie
            </p>
            <div class="footer-links">
                <a href="https://golet.ie" class="footer-link">Visit Website</a>
                <a href="https://golet.ie/privacy" class="footer-link">Privacy Policy</a>
                <a href="https://golet.ie/terms" class="footer-link">Terms of Service</a>
            </div>
        </div>
    </div>
</body>
</html>
```

### 3. Template Features

**🎨 Professional Design:**
- Clean, modern layout with GoLet.ie branding
- Responsive design that works on all devices
- Professional color scheme matching the app

**🔐 Security Features:**
- Clear security notice about code protection
- Expiration time mentioned (10 minutes)
- Professional security messaging

**📱 User Experience:**
- Large, easy-to-read OTP code
- Clear instructions for next steps
- Feature highlights to build excitement
- Mobile-responsive design

**🎯 Brand Consistency:**
- GoLet.ie logo and branding
- Consistent with app's design language
- Professional typography and spacing

### 4. Customization Options

You can customize the template by:

1. **Colors**: Update the CSS variables for brand colors
2. **Logo**: Replace the "GL" text with an actual logo image
3. **Features**: Modify the feature highlights to match your current offerings
4. **Links**: Update footer links to your actual pages
5. **Copy**: Adjust the messaging to match your tone of voice

### 5. Testing

After updating the template:
1. Test the email in different email clients
2. Verify mobile responsiveness
3. Check that the OTP code displays correctly
4. Ensure all links work properly

### 6. Additional Templates

Consider also updating these templates with similar professional designs:
- **Password Reset**
- **Email Change**
- **Magic Link**

This professional template will significantly improve your user experience and build trust with new users joining GoLet.ie! 🚀 