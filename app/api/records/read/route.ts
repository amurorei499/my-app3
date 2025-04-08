//  /app/api/records/read/route.ts
import { NextResponse } from "next/server";
import { collection, getDocs, query, where } from "firebase/firestore";
import { collectionName, db } from "@/app/utils/firebase";
import { UserData } from "@/app/utils/userData";

// **データ取得**
export async function GET(request: Request) {
  //exportで関数エクスポート、GETメソッドでデータ取得
  try {
    const email = new URL(request.url).searchParams.get("email"); //URLにパラメータとして付与されたemailを抽出、emailをキーにデータを取得
    if (!email) {
      //emailが存在しなければ、400エラーを返す
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const studiesRef = collection(db, collectionName); //FirebaseSDKを利用してFirestoreDBデータを取得
    const q = query(studiesRef, where("email", "==", email)); //emailがマッチするデータを取得
    const snapshot = await getDocs(q);

    const data: UserData[] = snapshot.docs.map(
      //取得したデータをmapメソッドで回し、UserData型の配列として、dataに格納
      (doc) => ({ id: doc.id, ...doc.data() } as UserData)
    );

    console.log("GET:", data); // デバッグ用
    //Firebaseからの応答は、successの値を持たないため、successとstatusをreturnするように追加
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching studies:", error);
    return NextResponse.json(
      //エラーの場合はsuccessをfalseとして、エラーメッセージ、status500をリターン
      {
        success: false,
        error: (error as Error).message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}