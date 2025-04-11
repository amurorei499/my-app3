// /app/utils/branchData.ts

export type BranchName = "神奈川支店" | "東京支店" | "長野支店";

export const branchTeams: Record<BranchName, string[]> = {
  "神奈川支店": ["池田班", "大林班", "金子班", "永友班", "森山班"],
  "東京支店": ["天野班", "冨田班", "日坂班", "宮田班"],
  "長野支店": ["中嶋班", "松下班", "社長班"]
};

export const branches: BranchName[] = Object.keys(branchTeams) as BranchName[];

export const getTeamsByBranch = (branch: BranchName): string[] => {
  return branchTeams[branch];
};