import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase-admin";
import { z } from "zod";

const UpdateUserSchema = z.object({
  userId: z.string(),
  userData: z.object({
    role: z.enum(["admin", "manager", "user", "viewer"]),
  }),
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "認証トークンが必要です" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken.uid) {
      return NextResponse.json(
        { error: "無効な認証トークンです" },
        { status: 401 }
      );
    }

    // カスタムクレームで管理者権限をチェック
    if (!decodedToken.role || decodedToken.role !== "admin") {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateUserSchema.parse(body);

    // Firestoreからユーザー情報を取得
    const userDoc = await db.collection("users").doc(validatedData.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    console.log("更新前のユーザー情報:", {
      userId: validatedData.userId,
      email: userData?.email,
      role: userData?.role
    });

    try {
      // カスタムクレームの更新
      const customClaims = {
        role: validatedData.userData.role,
        updated_at: new Date().toISOString()
      };

      // Firebase Admin SDKを使用してカスタムクレームを設定
      await auth.setCustomUserClaims(validatedData.userId, customClaims);

      // Firestoreの更新
      await db.collection("users").doc(validatedData.userId).update({
        role: validatedData.userData.role,
        updated_at: new Date(),
      });

      // 更新後のユーザー情報を取得
      const updatedUserRecord = await auth.getUser(validatedData.userId);
      console.log("更新後のカスタムクレーム:", {
        userId: validatedData.userId,
        email: updatedUserRecord.email,
        customClaims: updatedUserRecord.customClaims
      });

      // 更新されたユーザーの新しいカスタムトークンを生成
      const newCustomToken = await auth.createCustomToken(validatedData.userId, {
        ...customClaims,
        email: updatedUserRecord.email,
        email_verified: updatedUserRecord.emailVerified,
      });

      // 更新されたユーザーの新しいIDトークンを強制的に無効化
      await auth.revokeRefreshTokens(validatedData.userId);

      return NextResponse.json({ 
        success: true,
        message: "ユーザー情報を更新しました",
        user: {
          id: validatedData.userId,
          email: updatedUserRecord.email,
          role: validatedData.userData.role,
          customClaims: updatedUserRecord.customClaims,
          token: newCustomToken
        }
      });
    } catch (error) {
      console.error("カスタムクレームの更新に失敗:", error);
      return NextResponse.json(
        { error: "カスタムクレームの更新に失敗しました" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "無効なリクエストデータです" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "ユーザー情報の更新に失敗しました" },
      { status: 500 }
    );
  }
} 