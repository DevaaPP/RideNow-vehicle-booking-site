import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import User from "@/models/user.model";

// Helper function to check educational email
function isValidStudentEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const lower = email.toLowerCase().trim();
  const domain = lower.split("@")[1];
  if (!domain) return false;

  const validSuffixes = [
    ".edu",
    ".ac.in",
    ".edu.in",
    ".ac.uk",
    ".edu.au",
    ".edu.ca",
    ".edu.sg",
    ".edu.cn",
    ".ac.za",
    ".ac.nz",
    ".edu.pk",
    ".edu.bd",
    ".edu.np",
  ];

  return validSuffixes.some((suffix) => domain.endsWith(suffix)) || domain.includes(".edu.") || domain.includes(".ac.");
}

export async function GET() {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findById(session.user.id).select("isStudent studentDetails");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 444 }
      );
    }

    return NextResponse.json({
      success: true,
      isStudent: Boolean(user.isStudent),
      studentDetails: user.studentDetails || null,
    });
  } catch (error: any) {
    console.error("GET STUDENT STATUS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch student status", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { eduEmail, institution } = body;

    if (!eduEmail || typeof eduEmail !== "string") {
      return NextResponse.json(
        { success: false, message: "Please provide a valid educational email address." },
        { status: 400 }
      );
    }

    if (!isValidStudentEmail(eduEmail)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid educational email domain. Email must end with .edu, .ac.in, .edu.in, .ac.uk, or valid university domain.",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    user.isStudent = true;
    user.studentDetails = {
      eduEmail: eduEmail.toLowerCase().trim(),
      institution: institution?.trim() || "University Student",
      verifiedAt: new Date(),
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: "🎓 Student Pass verified! 10% discount activated on all your rides.",
      isStudent: true,
      studentDetails: user.studentDetails,
    });
  } catch (error: any) {
    console.error("VERIFY STUDENT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify student status", error: error.message },
      { status: 500 }
    );
  }
}
