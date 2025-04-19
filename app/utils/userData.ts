// /app/utils/userData.ts

import { Timestamp } from 'firebase/firestore';

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | "manager" | "viewer";
  branch?: string;
  team?: string;
  created_at: Date | Timestamp;
  updated_at: Date | Timestamp;
}