export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "User is not authenticated" },
                {
                    status: 401,
                    headers: {
                        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                        "Pragma": "no-cache",
                        "Expires": "0",
                    },
                }
            );
        }

        const query = session.user.id
            ? { _id: session.user.id }
            : { email: session.user.email };
        const user = await User.findOne(query).select("-password");
        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                {
                    status: 404,
                    headers: {
                        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                        "Pragma": "no-cache",
                        "Expires": "0",
                    },
                }
            );
        }

        // Keep walletBalance in sync with authoritative Wallet document
        try {
            const wallet = await Wallet.findOne({ userId: user._id }).select("balance").lean();
            if (wallet && typeof wallet.balance === "number" && user.walletBalance !== wallet.balance) {
                user.walletBalance = wallet.balance;
                await User.updateOne({ _id: user._id }, { $set: { walletBalance: wallet.balance } });
            }
        } catch {}

        return NextResponse.json(
            user,
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            }
        );

    } catch (error) {
        return NextResponse.json(
            { message: `get me error : ${error}` },
            {
                status: 500,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "User is not authenticated" },
                { status: 401 }
            );
        }

        const { name, mobileNumber } = await req.json();
        if (!name) {
            return NextResponse.json(
                { message: "Name is required" },
                { status: 400 }
            );
        }

        const query = session.user.id
            ? { _id: session.user.id }
            : { email: session.user.email };

        const user = await User.findOneAndUpdate(
            query,
            { name, mobileNumber },
            { new: true }
        ).select("-password");

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(user, {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        });

    } catch (error) {
        return NextResponse.json(
            { message: `update profile error : ${error}` },
            { status: 500 }
        );
    }
}