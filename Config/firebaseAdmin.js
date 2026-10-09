const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Verifying ID tokens only needs the project ID. A service account
// (GOOGLE_APPLICATION_CREDENTIALS) is used if present, for other admin features.
const firebaseAdminApp = initializeApp({
  ...(process.env.GOOGLE_APPLICATION_CREDENTIALS && {
    credential: applicationDefault(),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const firebaseAuth = getAuth(firebaseAdminApp);

module.exports = { firebaseAuth };
