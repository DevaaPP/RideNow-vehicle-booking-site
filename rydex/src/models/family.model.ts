import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFamilyMember {
  _id?: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  relation: "Spouse" | "Child" | "Parent" | "Sibling" | "Other";
  addedAt: Date;
}

export interface IFamilyAccount extends Document {
  owner: Types.ObjectId;
  familyName: string;
  members: IFamilyMember[];
  sharedPaymentEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyMemberSchema = new Schema<IFamilyMember>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    relation: {
      type: String,
      enum: ["Spouse", "Child", "Parent", "Sibling", "Other"],
      default: "Other",
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const FamilyAccountSchema = new Schema<IFamilyAccount>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    familyName: { type: String, required: true, default: "My Family" },
    members: [FamilyMemberSchema],
    sharedPaymentEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FamilyAccount =
  mongoose.models.FamilyAccount ||
  mongoose.model<IFamilyAccount>("FamilyAccount", FamilyAccountSchema);

export default FamilyAccount;
