
export interface IFile extends Omit<Express.Multer.File, 'filename'> {
  
}