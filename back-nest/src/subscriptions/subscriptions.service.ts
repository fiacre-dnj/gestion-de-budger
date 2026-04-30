import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async create(userId: string, createDto: CreateSubscriptionDto): Promise<SubscriptionDocument> {
    const subscription = new this.subscriptionModel({
      ...createDto,
      userId: new Types.ObjectId(userId),
      categoryId: new Types.ObjectId(createDto.categoryId),
      walletId: new Types.ObjectId(createDto.walletId),
    });
    return subscription.save();
  }

  async findAll(userId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('categoryId')
      .populate('walletId')
      .sort({ billingDate: 1 });
  }

  async findOne(userId: string, id: string): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).populate('categoryId').populate('walletId');

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }
    return subscription;
  }

  async update(userId: string, id: string, updateDto: UpdateSubscriptionDto): Promise<SubscriptionDocument> {
    const updateData: any = { ...updateDto };
    if (updateDto.categoryId) {
      updateData.categoryId = new Types.ObjectId(updateDto.categoryId);
    }

    if (updateDto.walletId) {
      updateData.walletId = new Types.ObjectId(updateDto.walletId);
    }

    const subscription = await this.subscriptionModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true },
    ).populate('categoryId').populate('walletId');

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }
    return subscription;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.subscriptionModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Abonnement non trouvé');
    }
  }

  async getSummary(userId: string) {
    const subscriptions = await this.subscriptionModel.find({ 
      userId: new Types.ObjectId(userId),
      isActive: true 
    });

    const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    
    return {
      totalMonthly,
      count: subscriptions.length,
      nextPayments: subscriptions
        .sort((a, b) => a.billingDate - b.billingDate)
        .slice(0, 5)
    };
  }
}
