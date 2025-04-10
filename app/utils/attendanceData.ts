// /app/utils/attendanceData.ts

export type AttendanceData = {
  id?: string;
  email: string;
  family_name: string;
  name: string;
  location: string;
  timestamp: string;
  status_primary: string; // 主要カテゴリ
  status_secondary?: string; // 詳細カテゴリ
  reason?: string; // 欠勤・公休の理由
  device: string;
  branch?: string;  // 支店情報
  team?: string;    // 班情報
};