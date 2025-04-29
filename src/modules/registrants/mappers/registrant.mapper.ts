import { ExamCreateDto } from 'src/modules/exams/dtos/exams.create.dto';
import { ExamUpdateDto } from 'src/modules/exams/dtos/exams.update.dto';

export class RegistrantMapper {
  static mapExamDtoToUpdate(exam: ExamUpdateDto, uploader: string) {
    if (!exam) return undefined;

    const fieldsNeedingUploader = [
      'generalPaperScore',
      'professionalPaperScore',
      'interviewScore',
      'appraisalScore',
      'seniorityScore',
      'totalScore',
      'remark',
    ];

    const examUpdate: any = { ...exam };

    for (const field of fieldsNeedingUploader) {
      if (exam[field] !== undefined && exam[field] !== null) {
        examUpdate[`${field}UploadedBy`] = uploader;
      }
    }

    return examUpdate;
  }
}
