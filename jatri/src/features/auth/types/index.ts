export type AuthStep =
  | "phone"
  | "phone_otp"
  | "email_login"
  | "email_signup"
  | "email_otp";

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export interface PhoneLinkModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reason?: string;
}
