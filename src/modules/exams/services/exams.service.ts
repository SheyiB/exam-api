import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExamsDoc, ExamsEntity } from '../repository/entities/exams.entity';
import { ExamPassScore } from '../repository/entities/exam.passScore.entity';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ExamsService {
  constructor(
    @InjectModel(ExamsEntity.name)
    private readonly examsModel: Model<ExamsDoc>,
    @InjectModel(ExamPassScore.name)
    private examPassScoreModel: Model<ExamPassScore>,
  ) {}

  async createExamScore(examType: string, passScore: number): Promise<ExamPassScore> {
    const newExamScore = new this.examPassScoreModel({ 
      examType, 
      passScore 
    });
    return newExamScore.save();
  }

  async getAllExamPassScores(): Promise<ExamPassScore[]> {
    return this.examPassScoreModel.find().lean().exec();
  }

  async getExamPassScore(examType: string): Promise<ExamPassScore | null> {
    const passScore = await this.examPassScoreModel.findOne({ examType }).lean().exec();
    if (!passScore) {
      throw new NotFoundException(`Exam pass score for type ${examType} not found`);
    }
    return passScore;
  }

  async updateExamScore(examType: string, passScore: number): Promise<ExamPassScore | null> {
    const currentDate = new Date();
    
    return this.examPassScoreModel.findOneAndUpdate(
      { examType },
      { 
        passScore,
        updatedAt: currentDate 
      },
      { 
        new: true,
        lean: true
      },
    );
  }
}