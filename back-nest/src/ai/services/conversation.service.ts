import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../schemas/conversation.schema';
import { Message, MessageDocument } from '../schemas/message.schema';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async findOrCreate(userId: string, conversationId?: string): Promise<ConversationDocument> {
    if (conversationId) {
      const existing = await this.conversationModel.findOne({
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
      });
      if (!existing) throw new NotFoundException('Conversation introuvable');
      return existing;
    }
    return this.conversationModel.create({
      userId: new Types.ObjectId(userId),
      title: 'Nouvelle conversation',
    });
  }

  async getMessages(conversationId: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'tool',
    content: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      role,
      content,
      metadata,
    });
  }

  async updateTitle(conversationId: string, title: string) {
    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      { title: title.slice(0, 80) },
    );
  }

  async listConversations(userId: string) {
    return this.conversationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(20)
      .exec();
  }
}
