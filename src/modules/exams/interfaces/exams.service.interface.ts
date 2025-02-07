import { IExams } from './exams.interface';
import { ExamCreateDto } from '../dtos/exams.create.dto';
import { UpdateExamsDto } from '../dtos/exams.update.dto';

export interface IExamsService {
  create(dto: ExamCreateDto): Promise<IExams>;
  findAll(): Promise<IExams[]>;
  findOne(id: string): Promise<IExams>;
  update(id: string, dto: UpdateExamsDto): Promise<IExams>;
  remove(id: string): Promise<IExams>;
}
