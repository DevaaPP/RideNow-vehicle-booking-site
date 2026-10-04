export type VendorStatus = "pending" | "approved" | "rejected";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type VideoKycStatus =
  | "not_required"
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected";

export interface PricingData {
  baseFare?: number;
  pricePerKm?: number;
  waitingCharge?: number;
  imageUrl?: string;
  status?: ReviewStatus;
  rejectionReason?: string;
}

export interface OnboardingStep {
  id: number;
  title: string;
  route?: string;
}
