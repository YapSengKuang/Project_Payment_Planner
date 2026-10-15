# Google sign-in setup

The app supports Continue with Google through Supabase Auth. The button uses the same session and database ownership rules as email sign-in. No Google client secret belongs in Vite variables or Git.

1. In Google Cloud, configure the OAuth consent screen and create a Web application OAuth client for this app. While in testing mode, add your pilot users as test users.
2. Add the Supabase callback shown under Authentication → Sign In / Providers → Google as an authorized redirect URI in Google Cloud. For the hosted backend it is `https://mmfltpbbkpugdfypruqg.supabase.co/auth/v1/callback`. The Google redirect goes to Supabase, not directly to the frontend.
3. Enter the client ID and client secret directly in Supabase's Google provider settings and enable the provider. Keep the existing email provider enabled.
4. In Supabase URL Configuration, allow the exact frontend origins used for local, production and branch previews. The app redirects back to its current origin.
5. Test a real Google user signing in, saving a project, reloading and signing out. Cancel the Google consent flow and confirm that retry/email sign-in remain available. Provider errors are shown without displaying tokens.

Local Supabase needs a separate Google client configuration with its local callback if testing Google against the local backend. Do not disable authentication or email verification on the hosted backend to test this.

Status: application integration and mocked error/retry tests are implemented. The hosted provider is now enabled. A real request initially failed with `redirect_uri_mismatch`; verify that the Google Cloud web client lists the exact Supabase callback above, then complete a real consent/sign-in round trip.

Reference: https://supabase.com/docs/guides/auth/social-login/auth-google
