// /app/api/admin/updateUser/route.ts
import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin初期化
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function POST(request: Request) {
  try {
    const { userId, userData, setCustomClaims } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // Firestoreユーザーデータの更新
    await db.collection("users").doc(userId).update({
      family_name: userData.family_name,
      name: userData.name,
      branch: userData.branch,
      team: userData.team,
      role: userData.role,
      updatedAt: new Date().toISOString(),
    });

    // カスタムクレームの設定（権限情報）
    if (setCustomClaims && userData.role) {
      // カスタムクレームオブジェクトの作成
      const claims: Record<string, boolean> = {};

      // 役割に応じた権限設定
      switch (userData.role) {
        case "admin":
          claims.admin = true;
          claims.manager = true;
          claims.viewer = true;
          break;
        case "manager":
          claims.manager = true;
          claims.viewer = true;
          break;
        case "viewer":
          claims.viewer = true;
          break;
        default:
          // 権限なしの場合は空のオブジェクト
          break;
      }

      // Firebase Authユーザーにカスタムクレームを設定
      await auth.setCustomUserClaims(userId, claims);
    }

    return NextResponse.json({
      success: true,
      message: "ユーザー情報が更新されました",
    });
  } catch (error) {
    console.error("ユーザー更新エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: "ユーザー情報の更新に失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
