import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency || 'MGA',
    };
  }

  async updateSettings(userId: string, settings: { currency?: string }) {
    const user = await this.findById(userId);
    if (settings.currency) {
      user.currency = settings.currency;
    }
    return user.save();
  }

  async updateProfile(userId: string, data: { name?: string, password?: string }) {
    const user = await this.findById(userId);
    if (data.name) {
      user.name = data.name;
    }
    if (data.password) {
      user.password = data.password;
    }
    return user.save();
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.findById(userId);
    return user.comparePassword(password);
  }
}
