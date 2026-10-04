export type RideRole = "user" | "driver";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "driver";
  createdAt: Date | string;
  status?: "sent" | "delivered" | "read";
}

export interface RideChatProps {
  currentRole: RideRole;
  driverName?: string;
  userName?: string;
  bookingId?: string;
  isOpen: boolean;
  onClose: () => void;
}
