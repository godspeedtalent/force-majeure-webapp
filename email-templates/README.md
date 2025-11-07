# Force Majeure Email Templates

Custom email templates for Supabase authentication emails.

## Setup Instructions

### 1. Configure URL Settings (REQUIRED FIRST)

1. Go to your Supabase project: https://supabase.com/dashboard/project/orgxcrnnecblhuxjfruy
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to: `https://www.forcemajeure.vip`
4. Add these to **Redirect URLs** (one per line):
   - `https://www.forcemajeure.vip/**`
   - `https://forcemajeure.vip/**`
   - `http://localhost:3000/**`
5. Click **Save**

### 2. Disable Custom Email Hook (if enabled)

1. Navigate to **Authentication** → **Hooks**
2. If the **Send Email** hook is enabled, disable it
3. Click **Save**

### 3. Update Email Template

1. Navigate to **Authentication** → **Email Templates**
2. Click on **Confirm signup** template
3. Update the **Subject line**:
   ```
   Welcome to Force Majeure - Confirm Your Email
   ```
4. Copy the contents of `confirm-signup.html` and paste into the **Message (Body)** field
5. Make sure "Enable email confirmations" is ON
6. Click **Save**

### 4. Test Your Template

1. Create a test account with a personal email
2. Check your inbox for the confirmation email
3. Verify:
   - All links work correctly and redirect to https://www.forcemajeure.vip
   - Styling displays properly
   - Mobile responsiveness looks good

## Template Features

✅ **Brand-aligned design** using Force Majeure colors:

- Deep Crimson (#6B0F1A) for CTAs
- Black background with white text
- Clean, minimalist aesthetic

✅ **Mobile responsive** - Looks great on all devices

✅ **Email-safe HTML** - Inline styles for maximum compatibility

✅ **Professional typography** - Clean, readable fonts

## Customization

You can customize:

- Subject line
- Welcome message text
- Footer text
- Colors (update hex codes in the HTML)
- Button text

## Available Variables

Use these Supabase variables in your templates:

- `{{ .ConfirmationURL }}` - Email confirmation link
- `{{ .Token }}` - Confirmation token
- `{{ .TokenHash }}` - Token hash
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

## Other Templates

You can create similar templates for:

- **Magic Link** - Passwordless login emails
- **Reset Password** - Password reset emails
- **Change Email Address** - Email change confirmation
- **Invite User** - Team/organization invites

Follow the same process for each template type.
