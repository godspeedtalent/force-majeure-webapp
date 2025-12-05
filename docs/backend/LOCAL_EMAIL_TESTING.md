# Local Email Testing with Mailpit

## Overview

When running Supabase locally, all emails are captured by **Mailpit** (formerly Inbucket), an email testing server that lets you view emails without actually sending them.

## Accessing Mailpit

**URL**: http://127.0.0.1:54324

Open this in your browser to view the Mailpit web interface where all emails will appear.

## Email Authentication Flow

### 1. Sign Up Flow

1. **Start your app**: `npm run dev` (should be running on http://localhost:5173)
2. **Navigate to sign up page**: http://localhost:5173/auth or wherever your auth page is
3. **Fill out the sign-up form**:
   - Email: any email (e.g., `test@example.com`)
   - Password: minimum 6 characters
   - Other required fields
4. **Submit the form**

### 2. Check Mailpit for Confirmation Email

1. Open **Mailpit**: http://127.0.0.1:54324
2. You should see a new email from Supabase with subject like "Confirm your signup"
3. Click the email to view it
4. Click the **confirmation link** in the email

### 3. Email is Confirmed

The confirmation link will redirect back to your app (http://localhost:5173) and automatically sign you in.

## Configuration Details

### Current Settings (supabase/config.toml)

```toml
[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://127.0.0.1:5173", "http://localhost:5173"]

[auth.email]
enable_signup = true
enable_confirmations = true  # ✅ Email confirmation required
double_confirm_changes = true
otp_expiry = 3600  # 1 hour

[inbucket]  # Now called Mailpit
enabled = true
port = 54324
```

## Testing Different Email Scenarios

### Sign Up with Email Confirmation
```typescript
// This will send a confirmation email to Mailpit
await supabase.auth.signUp({
  email: 'newuser@test.com',
  password: 'password123',
});
// Check Mailpit at http://127.0.0.1:54324
```

### Password Reset
```typescript
// This will send a password reset email to Mailpit
await supabase.auth.resetPasswordForEmail('user@test.com', {
  redirectTo: 'http://localhost:5173/reset-password',
});
// Check Mailpit for the reset link
```

### Email Change (with double confirmation)
```typescript
// This will send confirmation emails to BOTH old and new addresses
await supabase.auth.updateUser({
  email: 'newemail@test.com',
});
// Check Mailpit for both confirmation emails
```

### Resend Verification Email
```typescript
// Resend the signup confirmation email
await supabase.auth.resend({
  type: 'signup',
  email: 'user@test.com',
});
```

## Troubleshooting

### Emails not appearing in Mailpit

1. **Check Supabase is running**: `npx supabase status`
2. **Check Mailpit is accessible**: Open http://127.0.0.1:54324
3. **Check email rate limits**: Max 2 emails per hour per user (configurable in config.toml)
4. **Check browser console** for any errors during sign-up

### Confirmation link doesn't work

1. **Check the redirect URL** matches your app URL (http://localhost:5173)
2. **Check additional_redirect_urls** in config.toml includes your app URL
3. **Restart Supabase** after config changes: `npx supabase restart`

### "Email not confirmed" error when signing in

This is expected behavior! Users must click the confirmation link in the email before they can sign in.

**To disable email confirmations for testing:**
```toml
[auth.email]
enable_confirmations = false  # Users can sign in immediately
```
Then restart Supabase: `npx supabase restart`

## Email Templates

Email templates can be customized by creating HTML files and referencing them in config.toml:

```toml
[auth.email.template.invite]
subject = "You have been invited"
content_path = "./supabase/templates/invite.html"

[auth.email.template.confirmation]
subject = "Confirm your email"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "Reset your password"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.email_change]
subject = "Confirm email change"
content_path = "./supabase/templates/email_change.html"
```

## Quick Test Script

To quickly test the email flow:

```bash
# 1. Start Supabase
npx supabase start

# 2. Start your app
npm run dev

# 3. Open Mailpit in browser
open http://127.0.0.1:54324

# 4. Open your app in another tab
open http://localhost:5173/auth

# 5. Sign up with any email and check Mailpit for the confirmation email
```

## Production Email Setup

For production, you'll need to configure an SMTP server (SendGrid, Mailgun, AWS SES, etc.):

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "noreply@yourdomain.com"
sender_name = "Force Majeure"
```

## Related Documentation

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Configuration](https://supabase.com/docs/guides/auth/auth-email)
- [Local Development](https://supabase.com/docs/guides/local-development)
