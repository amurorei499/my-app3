//  /app/api/records/read/route.ts
import { NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/utils/firebase";

// **データ取得**
export async function GET(request: Request) {
  //exportで関数エクスポート、GETメソッドでデータ取得
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      //emailが存在しなければ、400エラーを返す
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate()
    }));

    console.log("GET:", userData); // デバッグ用
    //Firebaseからの応答は、successの値を持たないため、successとstatusをreturnするように追加
    return NextResponse.json({ success: true, data: userData }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      //エラーの場合はsuccessをfalseとして、エラーメッセージ、status500をリターン
      {
        success: false,
        error: (error as Error).message || "Failed to fetch user data",
      },
      { status: 500 }
    );
  }
}