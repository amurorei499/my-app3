// app/api/attendanceCreate/route.ts
import { NextResponse } from "next/server";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { z } from "zod";
import { format } from "date-fns-tz";
import { AttendanceData } from "@/app/utils/attendanceData";

// AttendanceDataスキーマ - 2層構造に対応
const AttendanceDataSchema = z.object({
  email: z.string().email({message: "有効なメールアドレスを入力してください"}),
  family_name: z.string().optional(),
  name: z.string().min(1, {message: "名前を入力してください"}),
  location: z.string(),
  status_primary: z.string().min(1, {message: "主要ステータスを入力してください"}),
  status_secondary: z.string().optional(),
  reason: z.string().optional(),
  device: z.string().optional()
});

// **データ追加**
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = AttendanceDataSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error },
        { status: 400 }
      );
    }

    // 日本時間で現在時刻を生成
    const now = new Date();
    now.setHours(now.getHours() + 9);
    const jstTimestamp = now.toISOString();

     // 型アサーションを使用して型エラーを解決
    const attendanceData = {
      ...validation.data,
      timestamp: jstTimestamp,
      device: validation.data.device || "Webブラウザ"
    } as AttendanceData;

    const attendanceRef = collection(db, "attendanceCreate");
    const docRef = await addDoc(attendanceRef, attendanceData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "勤怠データが正常に記録されました",
      timestamp: jstTimestamp
    });

  } catch (error) {
    console.error("勤怠登録エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "不明なエラー"
      },
      { status: 500 }
    );
  }
}