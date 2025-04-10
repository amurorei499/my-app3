// /app/api/admin/updateUser/route.ts
import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Firebase Admin初期化
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export async function POST(request: Request) {
  try {
    const { userId, userData } = await request.json();

    // 必須パラメータチェック
    if (!userId || !userData) {
      return NextResponse.json(
        { success: false, error: "必要なパラメータが不足しています" },
        { status: 400 }
      );
    }

    // 権限更新処理
    await admin.auth().setCustomUserClaims(userId, {
      ...userData.customClaims,
      role: userData.role || null // undefinedをnullに変換
    });

    // Firestoreユーザーデータ更新
    await admin.firestore()
      .collection("users")
      .doc(userId)
      .update({
        ...userData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
