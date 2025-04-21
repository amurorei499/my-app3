import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const firebaseAdminConfig = {
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
};

const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 