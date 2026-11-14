import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
    totpEnabled: {
      type: Boolean,
      default: false,
    },
    totpSecret: {
      type: String,
      default: null,
      select: false,
    },
    totpTempSecret: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone ?? null,
    totpEnabled: Boolean(this.totpEnabled),
  };
};

export const User = mongoose.model('User', userSchema);
