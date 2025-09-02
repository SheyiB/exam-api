import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../common/database/postgres.provider';

export interface CivilServant {
  id: number;
  surname: string;
  firstname: string;
  middlename?: string;
  gender: string;
  date_of_birth: Date;
  phone_number: string;
  email?: string;
  home_address: string;
  nationality: string;
  marital_status: string;
  marital_status_other?: string;
  id_card_service_number: string;
  nin: string;
  verification_code: string;
  state_of_origin: string;
  local_government_area: string;
  cadre: string;
  cadre_other?: string;
  department: string;
  grade_level: number;
  duty_station: string;
  type_of_appointment: string;
  date_of_first_appointment: Date;
  date_of_confirmation?: Date;
  date_of_previous_appointment: Date;
  date_of_present_appointment: Date;
  current_mda: string;
  mda_other?: string;
  previous_mdas?: any;
  academic_qualifications: string;
  date_of_first_school_leaving_certificate: Date;
  areas_of_core_competency: any;
  passport_url?: string;
  consent_given: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class CivilServantService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool: Pool
  ) {}

  async findByNin(nin: string): Promise<CivilServant | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM civil_servants_view 
        WHERE nin = $1 
        LIMIT 1
      `;
      
      const result = await client.query(query, [nin]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as CivilServant;
    } catch (error) {
      console.error('Error fetching civil servant by NIN:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async findByServiceNumber(serviceNumber: string): Promise<CivilServant | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM civil_servants_view 
        WHERE id_card_service_number = $1 
        LIMIT 1
      `;
      
      const result = await client.query(query, [serviceNumber]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as CivilServant;
    } catch (error) {
      console.error('Error fetching civil servant by service number:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async validateCivilServant(nin: string, serviceNumber: string): Promise<CivilServant | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM civil_servants_view 
        WHERE nin = $1 AND id_card_service_number = $2
        LIMIT 1
      `;
      
      const result = await client.query(query, [nin, serviceNumber]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as CivilServant;
    } catch (error) {
      console.error('Error validating civil servant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async searchCivilServants(searchTerm: string, limit = 10): Promise<CivilServant[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM civil_servants_view 
        WHERE 
          LOWER(surname) LIKE LOWER($1) OR
          LOWER(firstname) LIKE LOWER($1) OR
          LOWER(middlename) LIKE LOWER($1) OR
          nin LIKE $1 OR
          id_card_service_number LIKE $1 OR
          LOWER(email) LIKE LOWER($1)
        ORDER BY surname, firstname
        LIMIT $2
      `;
      
      const result = await client.query(query, [`%${searchTerm}%`, limit]);
      
      return result.rows as CivilServant[];
    } catch (error) {
      console.error('Error searching civil servants:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}