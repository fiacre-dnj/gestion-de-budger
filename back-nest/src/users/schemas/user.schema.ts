import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  refreshTokens: string[];
  currency: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  addRefreshToken(token: string): Promise<void>;
  removeRefreshToken(token: string): Promise<void>;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], default: [] })
  refreshTokens: string[];

  @Prop({ default: 'MGA' })
  currency: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to add refresh token
UserSchema.methods.addRefreshToken = async function (token: string): Promise<void> {
  this.refreshTokens.push(token);
  await this.save();
};

// Instance method to remove refresh token
UserSchema.methods.removeRefreshToken = async function (token: string): Promise<void> {
  this.refreshTokens = this.refreshTokens.filter((t: string) => t !== token);
  await this.save();
};
