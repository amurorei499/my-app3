// /app/api/records/create/route.ts
import { NextResponse } from "next/server";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { z } from "zod";

// UserDataスキーマ
const UserDataSchema = z.object({
  email: z.string().email({message: "有効なメールアドレスを入力してください"}),
  family_name: z.string().min(1, {message: "姓を入力してください"}),
  name: z.string().min(1, {message: "名前を入力してください"}),
  branch: z.string().min(1, {message: "支店名を入力してください"}),
  team: z.string().min(1, {message: "チーム名を入力してください"})
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = UserDataSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error },
        { status: 400 }
      );
    }

    const usersRef = collection(db, "users");
    const docRef = await addDoc(usersRef, validation.data);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "ユーザーが正常に登録されました"
    });

  } catch (error) {
    console.error("ユーザー登録エラー:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}