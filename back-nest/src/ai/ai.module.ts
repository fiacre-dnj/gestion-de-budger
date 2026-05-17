import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AgentService } from './services/agent.service';
import { ContextBuilderService } from './services/context-builder.service';
import { ConversationService } from './services/conversation.service';
import { AiToolsExecutor } from './tools/ai-tools.executor';
import { LlmProviderFactory } from './providers/llm-provider.factory';
import { LLM_PROVIDER } from './providers/llm.types';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { TransactionsModule } from '../transactions/transactions.module';
import { WalletsModule } from '../wallets/wallets.module';
import { CategoriesModule } from '../categories/categories.module';
import { SavingsModule } from '../savings/savings.module';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
      }),
      inject: [ConfigService],
    }),
    TransactionsModule,
    WalletsModule,
    CategoriesModule,
    SavingsModule,
    AnalysisModule,
  ],
  controllers: [AiController],
  providers: [
    AgentService,
    ContextBuilderService,
    ConversationService,
    AiToolsExecutor,
    LlmProviderFactory,
    {
      provide: LLM_PROVIDER,
      useFactory: (factory: LlmProviderFactory) => factory.create(),
      inject: [LlmProviderFactory],
    },
  ],
})
export class AiModule {}
