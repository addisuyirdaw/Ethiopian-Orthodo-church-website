// src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { assignHierarchyPath } from '../lib/hierarchy';

export class AdminController {
  // Helpers to enforce system admin authorization check
  private checkAdmin(req: Request, res: Response): boolean {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return false;
    }
    // isSuperAdmin checks for authRole SYSTEM_ADMIN or ecclesiasticalRole PATRIARCH
    if (!req.user.isSuperAdmin) {
      res.status(403).json({ error: 'Forbidden: System Administrator access required.' });
      return false;
    }
    return true;
  }

  // POST /admin/dioceses
  async addDiocese(req: Request, res: Response): Promise<void> {
    if (!this.checkAdmin(req, res)) return;

    const { name, nameAm, nameEn, type } = req.body;
    if (!name || !nameAm || !nameEn || !type) {
      res.status(400).json({ error: 'name, nameAm, nameEn, and type (DIOCESE or ARCHDIOCESE) are required.' });
      return;
    }

    if (!['DIOCESE', 'ARCHDIOCESE'].includes(type)) {
      res.status(400).json({ error: 'Type must be DIOCESE or ARCHDIOCESE.' });
      return;
    }

    // Find the patriarchate to link under
    const patriarchate = await prisma.institution.findFirst({
      where: { type: 'PATRIARCHATE', deletedAt: null },
    });
    const parentId = patriarchate ? patriarchate.id : null;

    const diocese = await prisma.institution.create({
      data: {
        name,
        nameAm,
        nameEn,
        type: type as any,
        institutionType: type as any,
        parentId,
        hierarchyPath: '/pending/',
        isActive: true,
      },
    });

    await assignHierarchyPath(diocese.id, parentId, prisma);

    res.status(201).json({ message: 'ሀገረ ስብከቱ በተሳካ ሁኔታ ተፈጥሯል።', diocese });
  }

  // PUT /admin/dioceses/:id
  async editDiocese(req: Request, res: Response): Promise<void> {
    if (!this.checkAdmin(req, res)) return;

    const { id } = req.params;
    const { name, nameAm, nameEn, type } = req.body;

    const diocese = await prisma.institution.findFirst({
      where: { id, type: { in: ['DIOCESE', 'ARCHDIOCESE'] }, deletedAt: null },
    });
    if (!diocese) {
      res.status(404).json({ error: 'ሀገረ ስብከቱ አልተገኘም።' });
      return;
    }

    const updated = await prisma.institution.update({
      where: { id },
      data: {
        name: name ?? undefined,
        nameAm: nameAm ?? undefined,
        nameEn: nameEn ?? undefined,
        type: type ?? undefined,
        institutionType: type ?? undefined,
      },
    });

    res.status(200).json({ message: 'ሀገረ ስብከቱ በተሳካ ሁኔታ ተስተካክሏል።', diocese: updated });
  }

  // POST /admin/institutions
  async addChurch(req: Request, res: Response): Promise<void> {
    if (!this.checkAdmin(req, res)) return;

    const { name, nameAm, nameEn, parentId, address, phone, email, description, logo } = req.body;
    if (!name || !nameAm || !nameEn || !parentId) {
      res.status(400).json({ error: 'name, nameAm, nameEn, and parentId (Diocese) are required.' });
      return;
    }

    // Verify parent diocese exists
    const diocese = await prisma.institution.findFirst({
      where: { id: parentId, type: { in: ['DIOCESE', 'ARCHDIOCESE'] }, deletedAt: null },
    });
    if (!diocese) {
      res.status(404).json({ error: 'የመረጡት ሀገረ ስብከት አልተገኘም።' });
      return;
    }

    const church = await prisma.institution.create({
      data: {
        name,
        nameAm,
        nameEn,
        type: 'PARISH',
        institutionType: 'PARISH',
        parentId,
        hierarchyPath: '/pending/',
        address: address ?? null,
        phone: phone ?? null,
        email: email ?? null,
        description: description ?? null,
        logo: logo ?? null,
        isActive: true,
      },
    });

    await assignHierarchyPath(church.id, parentId, prisma);

    res.status(201).json({ message: 'ቤተ ክርስቲያኑ በተሳካ ሁኔታ ተፈጥሯል።', church });
  }

  // PUT /admin/institutions/:id
  async editChurch(req: Request, res: Response): Promise<void> {
    if (!this.checkAdmin(req, res)) return;

    const { id } = req.params;
    const { name, nameAm, nameEn, parentId, address, phone, email, description, logo } = req.body;

    const church = await prisma.institution.findFirst({
      where: { id, type: 'PARISH', deletedAt: null },
    });
    if (!church) {
      res.status(404).json({ error: 'ቤተ ክርስቲያኑ አልተገኘም።' });
      return;
    }

    if (parentId) {
      const diocese = await prisma.institution.findFirst({
        where: { id: parentId, type: { in: ['DIOCESE', 'ARCHDIOCESE'] }, deletedAt: null },
      });
      if (!diocese) {
        res.status(404).json({ error: 'ሀገረ ስብከቱ አልተገኘም።' });
        return;
      }
    }

    const updated = await prisma.institution.update({
      where: { id },
      data: {
        name: name ?? undefined,
        nameAm: nameAm ?? undefined,
        nameEn: nameEn ?? undefined,
        parentId: parentId ?? undefined,
        address: address !== undefined ? address : undefined,
        phone: phone !== undefined ? phone : undefined,
        email: email !== undefined ? email : undefined,
        description: description !== undefined ? description : undefined,
        logo: logo !== undefined ? logo : undefined,
      },
    });

    if (parentId && parentId !== church.parentId) {
      await assignHierarchyPath(church.id, parentId, prisma);
    }

    res.status(200).json({ message: 'ቤተ ክርስቲያኑ በተሳካ ሁኔታ ተስተካክሏል።', church: updated });
  }

  // POST /admin/institutions/:id/activate
  async activateChurch(req: Request, res: Response): Promise<void> {
    if (!this.checkAdmin(req, res)) return;

    const { id } = req.params;
    const church = await prisma.institution.findFirst({
      where: { id, deletedAt: null },
    });
    if (!church) {
      res.status(404).json({ error: 'ቤተ ክርስቲያን/ሀገረ ስብከት አልተገኘም።' });
      return;
    }

    const updated = await prisma.institution.update({
      where: { id },
      data: { isActive: true },
    });

    res.status(200).json({ message: 'ቤተ ክርስቲያኑ ሥራ ጀምሯል።', institution: updated });
  }

  // POST /admin/institutions/:id/deactivate
  async deactivateChurch(req: Request, res: Response): Promise<void> {
    if (!this.checkAdmin(req, res)) return;

    const { id } = req.params;
    const church = await prisma.institution.findFirst({
      where: { id, deletedAt: null },
    });
    if (!church) {
      res.status(404).json({ error: 'ቤተ ክርስቲያን/ሀገረ ስብከት አልተገኘም።' });
      return;
    }

    const updated = await prisma.institution.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({ message: 'ቤተ ክርስቲያኑ አገልግሎት አቁሟል።', institution: updated });
  }
}

export const adminController = new AdminController();
