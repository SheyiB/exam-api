import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const ExamsDatabaseName = 'exams';

export enum examType {
  promotion = 'promotion',
  conversion = 'conversion',
  confirmation = 'confirmation',
}

export enum examStatus {
  passed = 'passed',
  failed = 'failed',
  pending = 'pending'
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class ExamsEntity extends Document {
  @Prop({ })
  examDate: Date;

  @Prop({  })
  examType: examType;

  @Prop({ default: examStatus.pending })
  examStatus: string;

  @Prop({  })
  generalPaperScore: number;

  @Prop({  })
  professionalPaperScore: number;
  // totalScore will be virtual

  @Prop({  })
  remark: string;

  @Prop({  })
  examNumber: string;
}

export const ExamsSchema = SchemaFactory.createForClass(ExamsEntity);

// Add virtual property for totalScore
ExamsSchema.virtual('totalScore').get(function() {
  const generalScore = this.generalPaperScore || 0;
  const professionalScore = this.professionalPaperScore || 0;
  return generalScore + professionalScore;
});

// Define the passing score threshold
const PASSING_SCORE = 50; // Adjust this value based on your requirements

// Pre-save middleware to set examStatus based on totalScore
ExamsSchema.pre('save', function(next) {
  // Only auto-determine status if we have score data
  if (this.generalPaperScore !== undefined || this.professionalPaperScore !== undefined) {
    const generalScore = this.generalPaperScore || 0;
    const professionalScore = this.professionalPaperScore || 0;
    const totalScore = generalScore + professionalScore;
    
    // Set the examStatus based on the total score
    if (totalScore >= PASSING_SCORE) {
      this.examStatus = examStatus.passed;
    } else {
      this.examStatus = examStatus.failed;
    }
  }
  
  next();
});

// Pre-update middleware to set examStatus when updating scores
ExamsSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  const update = this.getUpdate();
  
  // Need to check if it's a regular update (not an aggregation pipeline)
  if (update && typeof update === 'object' && !Array.isArray(update)) {
    // Check if either score is being updated
    if (update.$set?.generalPaperScore !== undefined || 
        update.$set?.professionalPaperScore !== undefined ||
        update.generalPaperScore !== undefined || 
        update.professionalPaperScore !== undefined) {
      
      // Get the current document to calculate the total
      this.model.findOne(this.getQuery()).then(doc => {
        if (doc) {
          // Calculate new scores using existing and updated values
          const generalScore = 
            update.$set?.generalPaperScore !== undefined ? update.$set.generalPaperScore :
            update.generalPaperScore !== undefined ? update.generalPaperScore :
            doc.generalPaperScore || 0;
            
          const professionalScore = 
            update.$set?.professionalPaperScore !== undefined ? update.$set.professionalPaperScore :
            update.professionalPaperScore !== undefined ? update.professionalPaperScore :
            doc.professionalPaperScore || 0;
          
          const totalScore = generalScore + professionalScore;
          
          // Update the examStatus based on the total score
          if (totalScore >= PASSING_SCORE) {
            if (update.$set) {
              update.$set.examStatus = examStatus.passed;
            } else {
              if (!update.$set) update.$set = {};
              update.$set.examStatus = examStatus.passed;
            }
          } else {
            if (update.$set) {
              update.$set.examStatus = examStatus.failed;
            } else {
              if (!update.$set) update.$set = {};
              update.$set.examStatus = examStatus.failed;
            }
          }
        }
        next();
      }).catch(err => next(err));
    } else {
      next();
    }
  } else {
    next();
  }
});

export type ExamsDoc = ExamsEntity & Document;