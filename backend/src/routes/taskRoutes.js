import { Router } from 'express';
import * as ctrl from '../controllers/taskController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  statusSchema,
  taskListQuerySchema,
  updateTaskSchema,
} from '../validators/taskSchemas.js';

const router = Router();

// Declared before '/:id' so "export.csv" is not treated as an id
router.get('/export.csv', validate(taskListQuerySchema, 'query'), asyncHandler(ctrl.exportCsv));
router.get('/', validate(taskListQuerySchema, 'query'), asyncHandler(ctrl.list));
router.post('/', validate(createTaskSchema), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getOne));
router.put('/:id', validate(updateTaskSchema), asyncHandler(ctrl.update));
router.put('/:id/status', validate(statusSchema), asyncHandler(ctrl.changeStatus));
router.delete('/:id', asyncHandler(ctrl.remove));

export default router;
