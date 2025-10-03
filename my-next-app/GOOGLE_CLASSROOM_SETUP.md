# Google Classroom Integration Setup

This guide will help you set up real Google Classroom authentication for your StudyPal app.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to Google Classroom (as a student or teacher)
3. Your StudyPal app running locally

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Google Classroom API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Classroom API"
3. Click on it and press **Enable**
4. Also enable the "Google+ API" for user profile information

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in the required fields:
     - App name: "StudyPal"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/classroom.courses.readonly`
     - `https://www.googleapis.com/auth/classroom.coursework.students.readonly`
     - `https://www.googleapis.com/auth/classroom.announcements.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "StudyPal Google Classroom"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/composio/callback` (for development)
     - `https://yourdomain.com/api/composio/callback` (for production)

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Make sure you also have these existing variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
COMPOSIO_API_KEY=your_composio_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Step 5: Update Database Schema

Run the updated Google Classroom schema in your Supabase database:

```sql
-- Run the contents of google-classroom-schema.sql in your Supabase SQL editor
```

## Step 6: Test the Integration

1. Start your development server: `cd my-next-app && npm run dev`
2. Open your StudyPal app at `http://localhost:3000`
3. Click the Google Classroom connect button in the header
4. You should be redirected to Google's OAuth consent screen
5. Sign in with your Google account that has access to Google Classroom
6. Grant the requested permissions
7. You should be redirected back to your app with a successful connection

## Step 7: Verify Real Data

Once connected, try asking the AI assistant questions like:
- "What assignments do I have due this week?"
- "Show me my Google Classroom courses"
- "What's due tomorrow in my classes?"

The AI should now respond with your actual Google Classroom data instead of mock data.

## Troubleshooting

### Common Issues:

1. **"Google Client ID not configured" error**
   - Make sure `GOOGLE_CLIENT_ID` is set in your `.env.local` file
   - Restart your development server after adding environment variables

2. **"Redirect URI mismatch" error**
   - Ensure the redirect URI in your Google Cloud Console matches exactly: `http://localhost:3000/api/composio/callback`
   - Check for trailing slashes or typos

3. **"Access blocked" error**
   - Your OAuth consent screen might need verification if you're using sensitive scopes
   - For development, add your test email addresses to the test users list

4. **"No courses found" error**
   - Make sure you're signed in with a Google account that has access to Google Classroom
   - Verify that you're enrolled in at least one active course

5. **Token refresh issues**
   - The app automatically handles token refresh, but if you see authentication errors, try disconnecting and reconnecting

### Development Notes:

- The OAuth flow opens in a popup window that automatically closes after successful authentication
- Tokens are securely stored in your Supabase database with proper encryption
- The integration respects Google's rate limits and API best practices
- All data access is read-only - the app cannot modify your Google Classroom content

## Security Considerations

- Never commit your `.env.local` file to version control
- Use different OAuth credentials for development and production
- Regularly rotate your client secrets
- Monitor API usage in the Google Cloud Console
- The app only requests read-only permissions for maximum security

## Production Deployment

When deploying to production:

1. Create new OAuth credentials with your production domain
2. Update the redirect URI to your production URL
3. Set environment variables in your hosting platform
4. Update the OAuth consent screen with your production domain
5. Consider applying for OAuth verification if you plan to have many users

Your StudyPal app now has real Google Classroom integration! 🎉
