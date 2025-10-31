# Google OAuth Setup Guide

This guide walks through setting up Google OAuth authentication for the Force Majeure web application.

## Overview

Google OAuth has been integrated into the authentication flow, allowing users to sign in or sign up using their Google/Gmail accounts. The implementation uses Supabase's OAuth integration for secure authentication.

## Features Implemented

- ✅ Google OAuth button in Sign In tab
- ✅ Google OAuth button in Sign Up tab
- ✅ OAuth divider ("OR") between OAuth and email/password methods
- ✅ Loading states during OAuth flow
- ✅ Disabled states to prevent concurrent authentication attempts
- ✅ Auto-redirect after successful OAuth
- ✅ Error handling with toast notifications

## Configuration Required

### 1. Google Cloud Console Setup

#### Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application** as the application type
6. Configure the OAuth consent screen if prompted

#### Configure Authorized Redirect URIs

Add the following redirect URIs:

**For Development:**
```
http://localhost:5173
http://localhost:5173/
```

**For Production:**
```
https://your-domain.com
https://your-domain.com/
```

**For Supabase (Required):**
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Replace `<your-project-ref>` with your actual Supabase project reference.

#### Save Credentials

After creating the OAuth client, you'll receive:
- **Client ID**: Looks like `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: A secret string

**Keep these secure!**

### 2. Supabase Configuration

#### Enable Google Provider

1. Log into [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list
5. Toggle it to **Enabled**

#### Add Google Credentials

In the Google provider settings:

1. **Client ID**: Paste your Google OAuth Client ID
2. **Client Secret**: Paste your Google OAuth Client Secret
3. **Redirect URL**: Copy the provided Supabase callback URL (you added this to Google Console)

#### Additional Settings (Optional)

- **Skip nonce check**: Keep disabled for security
- **Additional scopes**: Add if you need extra Google API permissions
  - `https://www.googleapis.com/auth/userinfo.email` (included by default)
  - `https://www.googleapis.com/auth/userinfo.profile` (included by default)

#### Save Configuration

Click **Save** to apply the changes.

### 3. Application Configuration

The application code is already configured! The implementation includes:

**AuthContext** (`/src/features/auth/services/AuthContext.tsx`):
```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  // Error handling...
};
```

**GoogleOAuthButton** (`/src/features/auth/components/GoogleOAuthButton.tsx`):
- Styled button with Google logo
- Loading and disabled states
- Follows Google's brand guidelines

**AuthPanel** (`/src/features/auth/components/AuthPanel.tsx`):
- Integrated in both Sign In and Sign Up tabs
- OAuth divider for visual separation
- Prevents concurrent auth attempts

## Testing

### Local Development

1. Ensure Supabase is configured with Google OAuth
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Navigate to `/auth` or trigger the AuthPanel
4. Click "Continue with Google" or "Sign up with Google"
5. Complete the Google OAuth flow
6. You should be redirected back and signed in

### Testing Checklist

- [ ] Google OAuth button appears on Sign In tab
- [ ] Google OAuth button appears on Sign Up tab
- [ ] Button shows loading state when clicked
- [ ] Regular sign in/up buttons are disabled during OAuth
- [ ] OAuth flow redirects to Google consent screen
- [ ] After consent, redirects back to application
- [ ] User is authenticated after redirect
- [ ] Error messages display if OAuth fails
- [ ] Works in both development and production

## OAuth Flow Explained

1. **User clicks "Continue with Google"**
   - `handleGoogleSignIn()` is called
   - Loading state is set to true

2. **Supabase initiates OAuth**
   - `supabase.auth.signInWithOAuth()` is called
   - User is redirected to Google's consent screen

3. **User grants permission**
   - Google validates the user's identity
   - User authorizes the requested scopes

4. **Google redirects back to Supabase**
   - With an authorization code
   - Supabase exchanges code for tokens

5. **Supabase redirects to your app**
   - With session data in URL fragment
   - To the `redirectTo` URL specified

6. **AuthContext handles the session**
   - `onAuthStateChange` listener fires
   - User and session state are updated
   - Profile is fetched from database

## Troubleshooting

### "Redirect URI mismatch" error

**Problem**: The redirect URI used doesn't match those configured in Google Console.

**Solution**:
1. Check the exact URL in the error message
2. Add it to Google Console's Authorized redirect URIs
3. Include both with and without trailing slash

### OAuth button not working

**Problem**: Nothing happens when clicking the Google button.

**Solution**:
1. Check browser console for errors
2. Verify Supabase Google provider is enabled
3. Ensure Client ID and Secret are correctly configured
4. Check network tab for failed requests

### Users can't complete sign up

**Problem**: After OAuth, users are redirected but not signed in.

**Solution**:
1. Check Supabase logs for errors
2. Verify the redirect URL is correct
3. Ensure your app is handling the OAuth callback
4. Check if email confirmation is required in Supabase settings

### "Email not verified" error

**Problem**: Google OAuth succeeds but Supabase rejects it.

**Solution**:
1. Go to Supabase Dashboard > Authentication > Settings
2. Find "Email Confirmations"
3. Disable "Confirm email" if you trust Google's verification
4. Or implement email verification flow in your app

## Security Considerations

### Client-Side Security

- OAuth state parameter is handled automatically by Supabase
- Credentials are never exposed to the client
- Tokens are stored securely in Supabase session

### Server-Side Security

- Client Secret is stored in Supabase, not in your app
- OAuth flow uses PKCE (Proof Key for Code Exchange)
- Tokens are exchanged server-side via Supabase

### Best Practices

1. **Use HTTPS in production**
   - OAuth requires secure connections
   - Don't use OAuth over HTTP in production

2. **Rotate secrets regularly**
   - Change Client Secret periodically
   - Update in both Google Console and Supabase

3. **Monitor authentication logs**
   - Check Supabase logs for suspicious activity
   - Set up alerts for failed authentication attempts

4. **Validate user data**
   - Don't trust OAuth provider data blindly
   - Validate email domains if needed
   - Implement additional verification if required

## Additional OAuth Providers

The architecture supports adding more OAuth providers. To add another provider:

1. **Create provider button component** (similar to `GoogleOAuthButton.tsx`)
2. **Add provider method to AuthContext**:
   ```typescript
   const signInWithProvider = async (provider: 'github' | 'facebook' | etc.) => {
     const { error } = await supabase.auth.signInWithOAuth({ provider });
     // Handle error...
   };
   ```
3. **Configure provider in Supabase Dashboard**
4. **Add button to AuthPanel**

Supported providers:
- Google (implemented)
- GitHub
- Facebook
- Twitter/X
- Discord
- LinkedIn
- And more...

## Files Modified

- `/src/features/auth/services/AuthContext.tsx` - Added `signInWithGoogle()` method
- `/src/features/auth/components/AuthPanel.tsx` - Integrated OAuth buttons
- `/src/features/auth/components/GoogleOAuthButton.tsx` - New OAuth button component
- `/src/components/ui/misc/OAuthDivider.tsx` - New divider component

## References

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Review browser console errors
3. Verify all configuration steps
4. Contact the development team

---

**Last Updated**: 2025-10-31
