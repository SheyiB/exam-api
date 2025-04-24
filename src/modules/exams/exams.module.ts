import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamsController } from './controllers/exams.controller';
import { ExamsService } from './services/exams.service';
import { ExamsEntity, ExamsSchema } from './repository/entities/exams.entity';
import { ExamPassScore, ExamPassScoreSchema } from './repository/entities/exam.passScore.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: ExamsEntity.name, 
        schema: ExamsSchema 
      },
      { 
        name: ExamPassScore.name, 
        schema: ExamPassScoreSchema 
      }
    ])
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService]
})
export class ExamsModule {}