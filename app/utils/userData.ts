// /app/utils/userData.ts

export type UserData = {
  id?: string; // FirestoreではIDは自動付与なのでオプションとして定義
  email: string;
  family_name: string;
  name: string;
  branch: string;
  team: string;
};