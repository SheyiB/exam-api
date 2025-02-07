// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { IExamsService } from '../interfaces/exams.service.interface';
// import { IExams } from '../interfaces/exams.interface';
// import { ExamCreateDto } from '../dtos/exams.create.dto';
// import { UpdateExamsDto } from '../dtos/exams.update.dto';
// import { Exams, ExamsDocument } from '../schemas';

// @Injectable()
// export class ExamsService implements IExamsService {
//   constructor(
//     @InjectModel(Exams.name)
//     private readonly examsModel: Model<ExamsDocument>,
//   ) {}

//   async create(dto: CreateExamsDto): Promise<IExams> {
//     const created = new this.examsModel(dto);
//     return created.save();
//   }

//   async findAll(): Promise<IExams[]> {
//     return this.examsModel.find().exec();
//   }

//   async findOne(id: string): Promise<IExams> {
//     return this.examsModel.findById(id).exec();
//   }

//   async update(id: string, dto: UpdateExamsDto): Promise<IExams> {
//     return this.examsModel
//       .findByIdAndUpdate(id, dto, { new: true })
//       .exec();
//   }

//   async remove(id: string): Promise<IExams> {
//     return this.examsModel.findByIdAndDelete(id).exec();
//   }
// }
