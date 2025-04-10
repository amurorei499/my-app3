// /app/api/admin/updateUser/route.ts
import { NextResponse } from "next/server";
import admin from "firebase-admin";

// サービスアカウントキーの型定義
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Firebase Adminの初期化
const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEYが環境変数に設定されていません");
    }

    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ) as ServiceAccount;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      })
    });
  }
  return admin;
};

export async function POST(request: Request) {
  try {
    const adminApp = initializeFirebaseAdmin();
    const { userId, userData } = await request.json();

    // 認証ヘッダーチェック
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }

    // トークン検証
    const token = authHeader.split(" ")[1];
    const decodedToken = await adminApp.auth().verifyIdToken(token);

    // 管理者権限チェック
    if (!decodedToken.admin) {
      return NextResponse.json(
        { success: false, error: "管理者権限がありません" },
        { status: 403 }
      );
    }

    // カスタムクレーム更新
    await adminApp.auth().setCustomUserClaims(userId, {
      role: userData.role || null
    });

    // Firestore更新
    await adminApp.firestore().collection("users").doc(userId).update({
      ...userData,
      updatedAt: adminApp.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: "ユーザー情報を更新しました"
    });

  } catch (error) {
    console.error("更新エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラー"
      },
      { status: 500 }
    );
  }
}
