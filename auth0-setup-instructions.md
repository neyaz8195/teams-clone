# Auth0 Configuration Instructions for Teams Clone

## Fix the "Callback URL Mismatch" Error

You're seeing the Auth0 "Callback URL Mismatch" error because your application is trying to redirect to `http://localhost:5173` after authentication, but this URL is not in the list of allowed callback URLs in your Auth0 application settings.

Follow these steps to update your Auth0 settings:

1. **Log in to your Auth0 Dashboard**

   - Go to https://manage.auth0.com/
   - Log in with your credentials

2. **Navigate to Applications**

   - Click on "Applications" in the left sidebar
   - Select your application (may be named "Teams Clone" or similar)

3. **Update Application Settings**

   - Scroll to "Application URIs" section
   - Add the following URL to "Allowed Callback URLs":
     ```
     http://localhost:5173
     ```
   - Add the same URL to "Allowed Logout URLs":
     ```
     http://localhost:5173
     ```
   - Add the same URL to "Allowed Web Origins":
     ```
     http://localhost:5173
     ```
   - Add the same URL to "Allowed Origins (CORS)":
     ```
     http://localhost:5173
     ```

4. **Save Changes**

   - Click "Save Changes" at the bottom of the page

5. **Return to your application**
   - Try logging in again - the error should be resolved

## Additional Configuration Tips

If you need to deploy your application to other environments (staging, production):

- Add additional URLs for each environment (e.g., `https://your-staging-url.com`, `https://your-production-url.com`)
- Keep the development URLs as well so you can continue testing locally

## Troubleshooting

If you still encounter issues after updating the settings:

1. Clear your browser cache or try in incognito mode
2. Check Auth0 logs for detailed error information
3. Verify that your environment variables match the Auth0 application settings
