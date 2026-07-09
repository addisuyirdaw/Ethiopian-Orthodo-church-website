import { Router } from 'express';
import sacramentRoutes from './sacrament.routes';
import institutionRoutes from './institution.routes';
import authRoutes from './auth.routes';
import financialRoutes from './financial.routes';
import calendarRoutes from './calendar.routes';
import devRoutes from './dev.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/financials', financialRoutes);
router.use('/calendar', calendarRoutes);
router.use('/sacraments', sacramentRoutes);
router.use('/institutions', institutionRoutes);
router.use('/dev', devRoutes);

export default router;
