import * as taskService from '../services/taskService.js';
import { toDateOnlyString } from '../utils/dates.js';

export async function list(req, res) {
  const { items, meta } = await taskService.listTasks(req.validated.query);
  res.json({ data: items, meta });
}

export async function getOne(req, res) {
  res.json({ data: await taskService.getTask(req.params.id) });
}

export async function create(req, res) {
  res.status(201).json({ data: await taskService.createTask(req.validated.body) });
}

export async function update(req, res) {
  res.json({ data: await taskService.updateTask(req.params.id, req.validated.body) });
}

export async function changeStatus(req, res) {
  res.json({ data: await taskService.changeStatus(req.params.id, req.validated.body.status) });
}

export async function remove(req, res) {
  await taskService.deleteTask(req.params.id);
  res.status(204).end();
}

export async function exportCsv(req, res) {
  const csv = await taskService.exportTasksCsv(req.validated.query);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="tasks-${toDateOnlyString(new Date())}.csv"`,
  });
  res.send(csv);
}
