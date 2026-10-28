# Realtime Self-Destruct Chat (Firebase)

This version replaces Upstash Redis and Upstash Realtime with Cloud Firestore through the Firebase Admin SDK. Users do not need to sign in. The server uses an HTTP-only room token cookie to authorize room access; Firestore is never accessed directly from the browser. The room page refreshes message history every 1.5 seconds.

## Setup

1. Create a Firebase project at https://console.firebase.google.com/.
2. Create a Cloud Firestore database.
3. In **Project settings → Service accounts**, generate a private key.
4. Copy `.env.example` to `.env.local` and set:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (keep the `\n` sequences in the environment value; never commit this file)
5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

## Ten-minute cleanup

The server rejects rooms after their 10-minute expiry even if Firestore's cleanup has not run. For automatic storage cleanup, enable a Firestore TTL policy on the `expiresAt` field for both the `rooms` and `messages` collection groups. TTL deletion is asynchronous, not an exact timer; messages include the same expiry timestamp as their room. If your Firebase console does not expose collection-group TTL configuration, configure it through Google Cloud Firestore's TTL settings.

## Security notes

- No Firebase Authentication is used.
- Do not expose the service-account private key in any `NEXT_PUBLIC_*` variable.
- Firestore client access is not needed. Keep client Firestore rules closed to unauthenticated users; the application accesses Firestore only on the server.
- Anyone who has a valid room URL can attempt to join, and each room allows two browser tokens. Treat room URLs as secrets.
