import { Router } from 'express';
import * as ctrl from '../controllers/employeeController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createEmployeeSchema,
  employeeListQuerySchema,
  updateEmployeeSchema,
} from '../validators/employeeSchemas.js';

const router = Router();

router.get('/', validate(employeeListQuerySchema, 'query'), asyncHandler(ctrl.list));
router.post('/', validate(createEmployeeSchema), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getOne));
router.put('/:id', validate(updateEmployeeSchema), asyncHandler(ctrl.update));
router.delete('/:id', asyncHandler(ctrl.remove));

export default router;
