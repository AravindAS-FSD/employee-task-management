import * as employeeService from '../services/employeeService.js';

export async function list(req, res) {
  const { items, meta } = await employeeService.listEmployees(req.validated.query);
  res.json({ data: items, meta });
}

export async function getOne(req, res) {
  res.json({ data: await employeeService.getEmployee(req.params.id) });
}

export async function create(req, res) {
  res.status(201).json({ data: await employeeService.createEmployee(req.validated.body) });
}

export async function update(req, res) {
  res.json({ data: await employeeService.updateEmployee(req.params.id, req.validated.body) });
}

export async function remove(req, res) {
  await employeeService.deleteEmployee(req.params.id);
  res.status(204).end();
}
