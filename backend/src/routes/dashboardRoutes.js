import { Router } from 'express';
import * as ctrl from '../controllers/dashboardController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/', asyncHandler(ctrl.get));
export default router;
