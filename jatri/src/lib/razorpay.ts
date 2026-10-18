import Razorpay from "razorpay";

let razorpayInstance: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  const keyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "rzp_test_placeholder";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
};

const razorpay = new Proxy({} as Razorpay, {
  get(_, prop) {
    const instance = getRazorpay();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export default razorpay;