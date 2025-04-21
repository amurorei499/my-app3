import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase-admin";
import { z } from "zod";

const UpdateUserSchema = z.object({
  userId: z.string(),
  userData: z.object({
    role: z.enum(["admin", "user"]),
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

    // 管理者権限のチェック
    const adminDoc = await db.collection("users").doc(decodedToken.uid).get();
    const adminData = adminDoc.data();
    
    if (!adminData || adminData.role !== "admin") {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateUserSchema.parse(body);

    // カスタムクレームの更新
    await auth.setCustomUserClaims(validatedData.userId, {
      role: validatedData.userData.role,
    });

    // Firestoreの更新
    await db.collection("users").doc(validatedData.userId).update({
      role: validatedData.userData.role,
      updated_at: new Date(),
    });

    return NextResponse.json({ message: "ユーザー情報を更新しました" });
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