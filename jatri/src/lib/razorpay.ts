import Razorpay from "razorpay";

export const getRazorpay = (): Razorpay => {
  const keyId = (
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    ""
  ).trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

  return new Razorpay({
    key_id: keyId || "rzp_test_placeholder",
    key_secret: keySecret || "placeholder_secret",
  });
};

const razorpay = new Proxy({} as Razorpay, {
  get(_, prop) {
    const instance = getRazorpay();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export default razorpay;