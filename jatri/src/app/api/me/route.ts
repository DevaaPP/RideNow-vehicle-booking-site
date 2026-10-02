import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "User is not authenticated" },
                { status: 401 }
            )
        }

        const query = session.user.id
            ? { _id: session.user.id }
            : { email: session.user.email };
        const user = await User.findOne(query).select("-password");
        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            )
        }
        return NextResponse.json(
            user,
            { status: 200 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: `get me error : ${error}` },
            { status: 500 }
        )
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "User is not authenticated" },
                { status: 401 }
            )
        }

        const { name, mobileNumber } = await req.json()
        if (!name) {
            return NextResponse.json(
                { message: "Name is required" },
                { status: 400 }
            )
        }

        const query = session.user.id
            ? { _id: session.user.id }
            : { email: session.user.email };

        const user = await User.findOneAndUpdate(
            query,
            { name, mobileNumber },
            { new: true }
        ).select("-password")

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(user, { status: 200 })

    } catch (error) {
        return NextResponse.json(
            { message: `update profile error : ${error}` },
            { status: 500 }
        )
    }
}