export interface AdminKpiStats {
  totalVendors: number;
  approved: number;
  pending: number;
  rejected: number;
}

export type AdminDashboardTab = "kyc" | "vendor" | "vehicle" | "pricing";

export interface EarningDataPoint {
  date: string;
  earnings: number;
}
