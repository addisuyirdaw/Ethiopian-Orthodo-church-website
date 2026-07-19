import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Maps a Prisma Parishioner record to the shape expected
 * by the frontend `Parishioner` interface (types/models.ts).
 */
function toApiShape(p: {
  id: string;
  membershipIdNumber: string;
  firstNameEn: string;
  middleNameEn: string;
  lastNameEn: string;
  firstNameAm: string;
  middleNameAm: string;
  lastNameAm: string;
  gender: string;
  phoneNumber: string;
  email: string | null;
  residentialAddress: unknown;
  christianNameAm: string | null;
  spiritualFatherId: string | null;
  status: string;
  dateOfBirthGregorian: Date;
  dateOfBirthEthiopian: string;
}) {
  // Resolve communionStatus from status field
  const communionStatus =
    p.status === 'Active' ? 'ACTIVE' :
    p.status === 'Inactive' ? 'IRREGULAR' : 'NONE';

  // Safely parse address JSON
  let address = { subcity: '', woreda: '', kebele: '' };
  try {
    const raw = p.residentialAddress as Record<string, string>;
    address = {
      subcity: raw?.subcity ?? raw?.city ?? '',
      woreda: raw?.wereda ?? raw?.woreda ?? '',
      kebele: raw?.kebele ?? '',
    };
  } catch {
    // keep defaults
  }

  return {
    id: p.membershipIdNumber,        // expose the human-readable membership ID
    _uuid: p.id,                      // keep internal UUID for reference
    firstNameEn: p.firstNameEn,
    middleNameEn: p.middleNameEn || undefined,
    lastNameEn: p.lastNameEn,
    firstNameAm: p.firstNameAm,
    middleNameAm: p.middleNameAm || undefined,
    lastNameAm: p.lastNameAm,
    gender: p.gender === 'Male' ? 'MALE' : p.gender === 'Female' ? 'FEMALE' : 'OTHER',
    phone: p.phoneNumber,
    email: p.email ?? undefined,
    address,
    baptismalName: p.christianNameAm ?? undefined,
    spiritualFatherId: p.spiritualFatherId ?? undefined,
    communionStatus,
    dateOfBirthGregorian: p.dateOfBirthGregorian.toISOString().split('T')[0],
    dateOfBirthEthiopian: p.dateOfBirthEthiopian,
  };
}

export const parishionersController = {
  /**
   * GET /api/v1/parishioners
   * Returns all parishioners ordered by last name.
   * Supports optional ?q= search and ?status= filter.
   */
  async list(req: Request, res: Response) {
    const { q, status, limit = '200', offset = '0' } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { firstNameEn: { contains: q, mode: 'insensitive' } },
        { lastNameEn: { contains: q, mode: 'insensitive' } },
        { firstNameAm: { contains: q } },
        { lastNameAm: { contains: q } },
        { membershipIdNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (status) {
      // Map frontend status enum back to DB value
      const dbStatus =
        status === 'ACTIVE' ? 'Active' :
        status === 'IRREGULAR' ? 'Inactive' : 'Deceased';
      where.status = dbStatus;
    }

    const parishioners = await (prisma as any).parishioner.findMany({
      where,
      orderBy: [{ lastNameEn: 'asc' }, { firstNameEn: 'asc' }],
      take: Math.min(parseInt(limit, 10), 500),
      skip: parseInt(offset, 10),
    });

    res.json(parishioners.map(toApiShape));
  },

  /**
   * GET /api/v1/parishioners/:id
   * Returns single parishioner by UUID or membershipIdNumber.
   */
  async getOne(req: Request, res: Response) {
    const { id } = req.params;

    const parishioner = await (prisma as any).parishioner.findFirst({
      where: {
        OR: [
          { id },
          { membershipIdNumber: id },
        ],
      },
    });

    if (!parishioner) {
      res.status(404).json({ error: 'Parishioner not found' });
      return;
    }

    res.json(toApiShape(parishioner));
  },

  /**
   * POST /api/v1/parishioners
   * Registers a new parishioner.
   */
  async create(req: Request, res: Response) {
    const {
      firstNameEn,
      middleNameEn = '',
      lastNameEn,
      firstNameAm,
      middleNameAm = '',
      lastNameAm,
      gender,
      phone,
      email,
      subcity,
      woreda,
      kebele,
      baptismalName,
      spiritualFatherId,
      communionStatus,
      dateOfBirthGregorian,
      dateOfBirthEthiopian,
    } = req.body;

    // Find the first parish in the database to link to
    const parish = await (prisma as any).parish.findFirst();
    if (!parish) {
      res.status(404).json({ error: 'No Parish registered in the system. Run database seed first.' });
      return;
    }

    // Generate unique membership ID format: [PARISH_CODE]-[REG_YEAR]-[SEQ]
    // Get parish initials
    const parishCode = parish.nameEnglish
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase() || 'EOTC';

    // Count existing parishioners to determine sequence number
    const count = await (prisma as any).parishioner.count({
      where: { parishId: parish.id },
    });

    const regYear = new Date().getFullYear(); // e.g. 2026
    const seqNum = String(count + 1).padStart(4, '0');
    const membershipIdNumber = `${parishCode}-${regYear}-${seqNum}`;

    // Map frontend values to database values
    const status = communionStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const dbGender = gender === 'FEMALE' ? 'Female' : 'Male';

    const parishioner = await (prisma as any).parishioner.create({
      data: {
        parishId: parish.id,
        membershipIdNumber,
        firstNameEn,
        middleNameEn,
        lastNameEn,
        firstNameAm,
        middleNameAm,
        lastNameAm,
        christianNameAm: baptismalName || null,
        dateOfBirthGregorian: new Date(dateOfBirthGregorian),
        dateOfBirthEthiopian,
        gender: dbGender,
        spiritualFatherId: spiritualFatherId || null,
        maritalStatus: 'Single',
        phoneNumber: phone,
        email: email || null,
        residentialAddress: {
          subcity: subcity || '',
          wereda: woreda || '',
          kebele: kebele || '',
        },
        status,
        registeredAtEthiopian: '10/11/2018', // Default fallback registration date
      },
    });

    res.status(201).json(toApiShape(parishioner));
  },
};

