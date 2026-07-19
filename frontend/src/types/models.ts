// src/types/models.ts

export type CommunionStatus = 'ACTIVE' | 'IRREGULAR' | 'NONE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Parishioner {
  id: string; // MDB-YYYY-XXXX
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  firstNameAm: string;
  middleNameAm?: string;
  lastNameAm: string;
  gender: Gender;
  phone: string;
  email?: string;
  address: {
    subcity: string;
    woreda: string;
    kebele: string;
  };
  baptismalName?: string;
  spiritualFatherId?: string;
  communionStatus: CommunionStatus;
  dateOfBirthGregorian: string; // ISO string
  dateOfBirthEthiopian: string; // DD/MM/YYYY
}

export interface Clergy {
  id: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameAm: string;
  lastNameAm: string;
}

export interface FamilyLink {
  relation: 'Spouse' | 'Child' | 'Parent';
  parishionerId: string; // linked member id
}
