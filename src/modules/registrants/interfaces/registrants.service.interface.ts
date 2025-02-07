// import { IRegistrants } from './registrants.interface';
import { RegistrantCreateDto } from '../dtos/registrants.create.dto';
import { RegistrantsDoc } from '../repository/entities/registrants.entity';
// import { UpdateRegistrantsDto } from '../dtos/registrants.update.dto';

export interface IRegistrantsService {
  createRegistrants(registrant: RegistrantCreateDto): Promise<RegistrantsDoc>;
  // findAll(): Promise<IRegistrants[]>;
  // findOne(id: string): Promise<IRegistrants>;
  // update(id: string, dto: UpdateRegistrantsDto): Promise<IRegistrants>;
  // remove(id: string): Promise<IRegistrants>;
}
