import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Only the hash is ever stored. `select: false` keeps it out of every query
    // result unless a query explicitly asks for it with .select('+passwordHash').
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member',
    },
  },
  { timestamps: true }
);

// `unique: true` on the email path above creates the index. It enforces one
// account per address at the database level, so two simultaneous signups for the
// same email cannot both succeed.

/** Hashes and stores a plaintext password. Never store the plaintext itself. */
userSchema.methods.setPassword = async function setPassword(plaintext) {
  this.passwordHash = await bcrypt.hash(plaintext, env.BCRYPT_ROUNDS);
};

/** Constant-time comparison of a candidate password against the stored hash. */
userSchema.methods.verifyPassword = function verifyPassword(plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

/** The only user shape that is ever sent to a client. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
  };
};

// Belt and braces: if a document is serialised directly, strip the hash anyway.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
