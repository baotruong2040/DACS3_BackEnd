const admin = require("firebase-admin");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");

let initialized = false;

function initializeFirebase() {
  const hasCredentials =
    env.FIREBASE_PROJECT_ID &&
    env.FIREBASE_CLIENT_EMAIL &&
    env.FIREBASE_PRIVATE_KEY;

  if (!hasCredentials || admin.apps.length > 0) {
    initialized = hasCredentials && admin.apps.length > 0;
    if (!hasCredentials) {
      logger.info("Firebase initialization skipped: missing credentials in .env");
    }
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  initialized = true;
  logger.info("Firebase Admin SDK initialized successfully");
}

async function sendPush(tokens, title, body, data = {}) {
  if (!initialized || !tokens.length) {
    return;
  }

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });
}

function fireAndForgetPush(tokens, title, body, data = {}) {
  void sendPush(tokens, title, body, data).catch((error) => {
    logger.warn("FCM push failed", { message: error.message });
  });
}

module.exports = {
  initializeFirebase,
  fireAndForgetPush,
};
