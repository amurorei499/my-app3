// /app/api/attendanceCreate/route.ts
import { NextResponse } from "next/server";
import { addDoc, collection, getDoc, doc } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { z } from "zod";
import { getDistance } from "geolib";
import { branchLocations } from "@/app/utils/branchLocations";
import type { AttendanceData } from "@/app/utils/attendanceData";

// 位置情報解析用正規表現
const LOCATION_REGEX = /(-?\d+\.\d+).*?(-?\d+\.\d+)/;

// データスキーマ検証
const AttendanceDataSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  family_name: z.string().optional(),
  name: z.string().min(1, { message: "名前を入力してください" }),
  location: z.string(),
  status_primary: z.string().min(1, { message: "主要ステータスを入力してください" }),
  status_secondary: z.string().optional(),
  reason: z.string().optional(),
  device: z.string().optional()
});

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

    const { email, location, ...restData } = validation.data;

    // ユーザー情報取得
    const userRef = doc(db, "users", email);
    const userDoc = await getDoc(userRef);
    const userBranch = userDoc.data()?.branch;

    // 位置情報認証ロジック
    let location_auth: "success" | "attention" | "error" = "error";
    let distance = Infinity;

    if (userBranch && branchLocations[userBranch]) {
      const match = location.match(LOCATION_REGEX);
      if (match) {
        const [_, latStr, lngStr] = match;
        const currentLat = parseFloat(latStr);
        const currentLng = parseFloat(lngStr);

        const { latitude, longitude, radius } = branchLocations[userBranch];

        distance = getDistance(
          { latitude, longitude },
          { latitude: currentLat, longitude: currentLng }
        );

        if (distance <= radius * 0.95) {
          location_auth = "success";
        } else if (distance <= radius * 1.05) {
          location_auth = "attention";
        }
      }
    }

    // 日本時間タイムスタンプ生成
    const jstTimestamp = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();

    // 勤怠データ作成
    const attendanceData: AttendanceData = {
      ...restData,
      email,
      location,
      location_auth,
      branch: userBranch || "未設定",
      team: userDoc.data()?.team || "未設定",
      timestamp: jstTimestamp,
      device: restData.device || "Webブラウザ",
      metadata: {
        distance,
        branch_config: userBranch ? branchLocations[userBranch] : null
      }
    };

    // Firestoreに保存
    const attendanceRef = collection(db, "attendance");
    const docRef = await addDoc(attendanceRef, attendanceData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      location_auth,
      distance,
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
