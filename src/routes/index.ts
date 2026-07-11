import { Router } from 'express';
import sacramentRoutes from './sacrament.routes';
import institutionRoutes from './institution.routes';
import authRoutes from './auth.routes';
import financialRoutes from './financial.routes';
import calendarRoutes from './calendar.routes';
import devRoutes from './dev.routes';
import vaultRoutes from './vault.routes';
import clergyRoutes from './clergy.routes';
import synodRoutes from './synod.routes';
import financeRoutes from './finance.routes';
import logisticsRoutes from './logistics.routes';
import artifactsEstatesRoutes from './artifacts-estates.routes';
import pastoralRoutes from './pastoral.routes';
import hymnologyRoutes from './hymnology.routes';
import synodalRoutes from './synodal.routes';
import courtRoutes from './court.routes';
import clearinghouseRoutes from './clearinghouse.routes';
import sacramentalRoutes from './sacramental-profile.routes';
import liturgicalAlertRoutes from './liturgical-alert.routes';
import publicPaymentRoutes from './public-payment.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/financials', financialRoutes);
router.use('/calendar', calendarRoutes);
router.use('/sacraments', sacramentRoutes);
router.use('/institutions', institutionRoutes);
router.use('/vault', vaultRoutes);
router.use('/clergy', clergyRoutes);
router.use('/synod', synodRoutes);
router.use('/synodal', synodalRoutes);
router.use('/finance', financeRoutes);
router.use('/logistics', logisticsRoutes);
router.use('/pastoral', pastoralRoutes);
router.use('/hymnology', hymnologyRoutes);
router.use('/canonical-court', courtRoutes);
router.use('/fintech/clearing', clearinghouseRoutes);
router.use('/sacramental', sacramentalRoutes);
router.use('/liturgical', liturgicalAlertRoutes);
router.use('/logistics', artifactsEstatesRoutes);
router.use('/public', publicPaymentRoutes);
router.use('/dev', devRoutes);

export default router;
