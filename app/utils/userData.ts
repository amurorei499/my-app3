// /app/utils/userData.ts

export type UserData = {
  id?: string; // FirestoreではIDは自動付与なのでオプションとして定義
  email: string;
  family_name: string;
  name: string;
  branch: string;
  team: string;
  role?: 'admin' | 'user'; // 権限フィールドを追加
  createdAt?: string;
  updatedAt?: string;
};