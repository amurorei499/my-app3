// /app/utils/branchLocations.ts
export interface BranchLocation {
  latitude: number;
  longitude: number;
  radius: number; // 許容半径（メートル）
}

export const branchLocations: Record<string, BranchLocation> = {
  "東京支店": {
    latitude: 35.6042,
    longitude: 139.6973,
    radius: 100 // 100メートル範囲
  },
  "神奈川支店": {
    latitude: 35.5672,
    longitude: 139.6558,
    radius: 100
  }
};

// 35.5402°N, 139.6638°E MH
// 35.6042°N, 139.6973°E TK