    // grantAdmin.js
    const admin = require("firebase-admin");

    // コマンドライン引数からUIDを取得
    const uidToGrantAdmin = process.argv[2];

    if (!uidToGrantAdmin) {
      console.error("エラー: 管理者権限を付与するユーザーのUIDを引数で指定してください。");
      console.log("使用方法: node grantAdmin.js <ユーザーUID>");
      process.exit(1); // エラーコード 1 で終了
    }

    // --- Firebase Admin SDKの初期化 ---
    try {
      // 環境変数からサービスアカウントキーを読み込む
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        throw new Error("環境変数 FIREBASE_SERVICE_ACCOUNT_KEY が設定されていません。");
      }

      // JSON文字列をパース
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

      // Firebase Admin SDKを初期化
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          // private_key内の改行文字(\n)を実際の改行に置換
          privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
        }),
      });

      console.log("Firebase Admin SDK の初期化に成功しました。");

    } catch (error) {
      console.error("Firebase Admin SDK の初期化中にエラーが発生しました:");
      console.error(error.message);
      console.error("環境変数 FIREBASE_SERVICE_ACCOUNT_KEY が正しく設定されているか、JSON形式が有効か確認してください。");
      process.exit(1); // エラーコード 1 で終了
    }
    // --- 初期化ここまで ---


    // --- 管理者権限付与の関数 ---
    async function grantAdminRole(uid) {
      console.log(`ユーザー ${uid} に管理者権限を付与します...`);
      try {
        // 1. Firebase Authenticationのカスタムクレームを設定
        await admin.auth().setCustomUserClaims(uid, { admin: true, role: 'admin' });
        console.log(`[成功] Firebase Auth: ユーザー ${uid} にカスタムクレーム (admin: true, role: 'admin') を設定しました。`);

        // 2. Firestoreのユーザードキュメントを更新 (推奨)
        const userRef = admin.firestore().collection("users").doc(uid);
        try {
          await userRef.update({
            role: 'admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`[成功] Firestore: ユーザー ${uid} のドキュメントのロールを 'admin' に更新しました。`);
        } catch(firestoreError) {
           // Firestoreドキュメントが存在しない場合のエラーコードは 'not-found' (5)
           if (firestoreError.code === 5) {
             console.warn(`[警告] Firestore: ユーザー ${uid} のドキュメントが見つかりませんでした。Authクレームは設定されましたが、Firestoreロールは更新されていません。必要であれば手動で作成・更新してください。`);
             // 必要であれば、ここでFirestoreドキュメントを新規作成する処理を追加できます
             // 例:
             // const userAuthData = await admin.auth().getUser(uid);
             // await userRef.set({
             //   id: uid,
             //   email: userAuthData.email || '不明',
             //   role: 'admin',
             //   family_name: '管理者(自動)', name: '設定',
             //   createdAt: admin.firestore.FieldValue.serverTimestamp(),
             //   updatedAt: admin.firestore.FieldValue.serverTimestamp(),
             // }, { merge: true });
             // console.log(`[情報] Firestore: ユーザー ${uid} のドキュメントを新規作成しました。`);
           } else {
             // その他のFirestoreエラー
             console.error(`[エラー] Firestore: ユーザー ${uid} のドキュメント更新中にエラーが発生しました:`, firestoreError);
           }
        }

        console.log("すべての処理が正常に完了しました。");

      } catch (error) {
        console.error(`[致命的エラー] ユーザー ${uid} への管理者権限付与中にエラーが発生しました:`);
        if (error.code === 'auth/user-not-found') {
          console.error(`-> 指定されたUID (${uid}) のユーザーはFirebase Authenticationに存在しません。UIDを確認してください。`);
        } else {
          console.error(error);
        }
        process.exit(1); // エラーコード 1 で終了
      }
    }
    // --- 関数定義ここまで ---

    // 関数を実行
    grantAdminRole(uidToGrantAdmin);