import { describe, it, expect, vi, beforeEach } from "vitest";
import { creditUserWalletTopup } from "@/lib/walletLedger";

// Mock MongoDB models & DB connection
vi.mock("@/lib/db", () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models/user.model", () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("@/models/wallet.model", () => ({
  default: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn().mockResolvedValue(true),
    create: vi.fn(),
  },
}));

vi.mock("@/models/wallet-transaction.model", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: "txn_mock_id" })),
  },
}));

import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import WalletTransaction from "@/models/wallet-transaction.model";

describe("Wallet Top-Up Reconciliation and Ledger Integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid top-up amounts (zero, negative, NaN)", async () => {
    await expect(
      creditUserWalletTopup({
        userId: "user123",
        amount: 0,
      })
    ).rejects.toThrow("Invalid wallet top-up amount");

    await expect(
      creditUserWalletTopup({
        userId: "user123",
        amount: -50,
      })
    ).rejects.toThrow("Invalid wallet top-up amount");

    await expect(
      creditUserWalletTopup({
        userId: "user123",
        amount: NaN,
      })
    ).rejects.toThrow("Invalid wallet top-up amount");
  });

  it("returns idempotent replay if razorpayPaymentId was already successfully processed", async () => {
    (WalletTransaction.findOne as any).mockResolvedValueOnce({
      _id: "tx_existing",
      amount: 500,
      balanceAfter: 1200,
      status: "success",
    });

    (Wallet.findOne as any).mockResolvedValueOnce({
      _id: "wallet_123",
      balance: 1200,
    });

    const result = await creditUserWalletTopup({
      userId: "user123",
      amount: 500,
      razorpayPaymentId: "pay_test_already_done",
    });

    expect(result.isIdempotentReplay).toBe(true);
    expect(result.creditAmount).toBe(500);
    expect(result.balanceAfter).toBe(1200);
    expect(Wallet.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("atomically increments wallet and user balances on valid new top-up", async () => {
    (WalletTransaction.findOne as any).mockResolvedValueOnce(null);
    (User.findById as any).mockResolvedValueOnce({
      _id: "user123",
      name: "Test Rider",
      walletBalance: 200,
    });
    (Wallet.findOne as any).mockResolvedValueOnce({
      _id: "wallet_123",
      userId: "user123",
      balance: 200,
    });

    const result = await creditUserWalletTopup({
      userId: "user123",
      amount: 300,
      razorpayOrderId: "order_123",
      razorpayPaymentId: "pay_fresh_123",
      source: "Online Payment (Webhook Reconciled)",
    });

    expect(result.isIdempotentReplay).toBe(false);
    expect(result.creditAmount).toBe(300);
    expect(result.balanceAfter).toBe(500);

    expect(Wallet.findByIdAndUpdate).toHaveBeenCalledWith("wallet_123", {
      $inc: { balance: 300 },
    });

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
      $inc: { walletBalance: 300 },
    });

    expect(WalletTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "credit",
        transactionType: "TOPUP",
        amount: 300,
        balanceBefore: 200,
        balanceAfter: 500,
        razorpayPaymentId: "pay_fresh_123",
        razorpayOrderId: "order_123",
      })
    );
  });
});
