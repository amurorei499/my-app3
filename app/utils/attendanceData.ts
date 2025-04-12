// /app/utils/attendanceData.ts
export interface AttendanceData {
  id?: string;
  email: string;
  family_name?: string;
  name: string;
  location: string;
  status_primary: string;
  status_secondary?: string;
  reason?: string;
  device?: string;
  branch: string;
  team: string;
  timestamp: string;

  // 以下を追加
  location_auth: 'success' | 'attention' | 'error';
  metadata: {
    distance: number;
    branch_config: {
      latitude: number;
      longitude: number;
      radius: number;
    } | null;
  };
}
