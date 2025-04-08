// /app/utils/firebase.ts

import { initializeApp , getApps, getApp} from 'firebase/app';
import { getAuth } from 'firebase/auth';//認証機能のインポート
import { getFirestore } from 'firebase/firestore';//DB機能のインポート

const firebaseConfig = {//.env.localの内容を読み込むよう設定
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);//認証機能の定義
export const db = getFirestore(app);//DB機能の定義
export const collectionName = "users"; // Firestoreコレクション名
