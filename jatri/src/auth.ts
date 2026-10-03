import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import connectDb from "./lib/db"
import User from "./models/user.model"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"
 

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    name: string;
    email: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      name: string;
      email: string;
    }
  }
  interface JWT {
    id: string;
    role: string;
    name: string;
    email: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "password", type: "password" },
        phone: { label: "phone", type: "text" },
        otp: { label: "otp", type: "text" },
        isPhoneLogin: { label: "isPhoneLogin", type: "text" },
      },
      async authorize(credentials, request) {
        await connectDb();

        // 📱 1. PHONE + WHATSAPP OTP LOGIN
        if (credentials?.isPhoneLogin === "true") {
          const rawPhone = credentials.phone as string;
          const otp = credentials.otp as string;

          if (!rawPhone || !otp) {
            throw new Error("Phone number and OTP are required");
          }

          const cleaned = rawPhone.replace(/\D/g, "");
          const tenDigits = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

          const user = await User.findOne({ mobileNumber: tenDigits });

          if (!user) {
            throw new Error("No account found with this mobile number");
          }

          if (!user.otp || user.otp.trim() !== String(otp).trim()) {
            throw new Error("Invalid OTP code");
          }

          if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
            throw new Error("OTP has expired. Please request a new one.");
          }

          user.isMobileVerified = true;
          user.otp = undefined;
          user.otpExpiresAt = undefined;
          await user.save();

          return {
            id: user._id.toString(),
            email: user.email || `${tenDigits}@ridenow.in`,
            name: user.name || `User ${tenDigits.slice(-4)}`,
            role: user.role || "user",
          };
        }

        // ✉️ 2. EMAIL + PASSWORD LOGIN
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const user = await User.findOne({ email });

        if (!user) {
          throw new Error("User does not exist");
        }

        if (!user.password) {
          throw new Error("Account was created using Google or Phone login. Please use that method.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new Error("Incorrect password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    Google({
      clientId: (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID) as string,
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET) as string
    })
  ],
  callbacks:{
    // token ke ander user ka data dalta hai
    async signIn({user,account}) {
      if(account?.provider=="google"){
        await connectDb()
        let dbUser=await User.findOne({email:user.email})
       if(!dbUser){
         dbUser=await User.create({
          name:user.name,
          email:user.email,
          isEmailVerified: true
         })
       } else if (!dbUser.isEmailVerified) {
         dbUser.isEmailVerified = true;
         await dbUser.save();
       }

       user.id=dbUser._id.toString()
       user.role=dbUser.role
      }
      return true
    },
    async jwt({token,user,trigger,session}) {
        if(user){
            token.id=user.id,
            token.name=user.name,
            token.email=user.email,
            token.role=user.role
        }

        // 🔥 CRITICAL FIX: Always fetch role from database to sync transitions (user -> vendor)
        if (token.email) {
            await connectDb()
            const dbUser = await User.findOne({ email: token.email }).select("role")
            if (dbUser) {
                token.role = dbUser.role
                token.id = dbUser._id.toString()
            }
        }

        if(trigger=="update"){
            token.role=session.role
        }

        return token
    },
    session({session,token}) {
        if(session.user){
            session.user.id=token.id as string,
            session.user.name=token.name as string,
            session.user.email=token.email as string
             session.user.role=token.role as string
        }
        return session
    },
  },
  pages:{
    signIn:"/",
    error:"/"
  },
  session:{
    strategy:"jwt",
    maxAge:10*24*60*60
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
})


// connect db
//email check
//password match