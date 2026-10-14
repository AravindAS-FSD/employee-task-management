// Pure rule tests. They need no database: run with `npm test`.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCanAssign,
  assertCanTransition,
  assertDateOrder,
  assertLeaveConsistent,
  assertTaskEditable,
  canTransition,
  isOverdue,
} from '../src/domain/rules.js';
import { parseDateOnly } from '../src/utils/dates.js';

const date = (s) => parseDateOnly(s);

describe('status transitions', () => {
  test('allows the documented flow', () => {
    assert.equal(canTransition('Todo', 'In Progress'), true);
    assert.equal(canTransition('In Progress', 'Completed'), true);
    assert.equal(canTransition('Todo', 'Cancelled'), true);
    assert.equal(canTransition('In Progress', 'Cancelled'), true);
  });

  test('rejects everything else, including skipping In Progress', () => {
    assert.equal(canTransition('Todo', 'Completed'), false);
    assert.equal(canTransition('Completed', 'Todo'), false);
    assert.equal(canTransition('Cancelled', 'Todo'), false);
    assert.equal(canTransition('Todo', 'Todo'), false);
    assert.throws(() => assertCanTransition('Completed', 'In Progress'), { status: 400, code: 'BUSINESS_RULE_VIOLATION' });
  });

  test('completed and cancelled tasks cannot be edited', () => {
    assert.throws(() => assertTaskEditable({ status: 'Completed' }), { status: 400 });
    assert.throws(() => assertTaskEditable({ status: 'Cancelled' }), { status: 400 });
    assert.doesNotThrow(() => assertTaskEditable({ status: 'In Progress' }));
  });
});

describe('assignment', () => {
  const start = date('2026-10-15');

  test('inactive employees are always rejected', () => {
    assert.throws(() => assertCanAssign({ status: 'Inactive' }, start), { status: 400 });
  });

  test('active employees are accepted', () => {
    assert.doesNotThrow(() => assertCanAssign({ status: 'Active' }, start));
  });

  test('on-leave employees are rejected only when start date is inside the leave, both ends inclusive', () => {
    const leave = { status: 'On Leave', leaveStart: date('2026-10-15'), leaveEnd: date('2026-10-20') };
    assert.throws(() => assertCanAssign(leave, date('2026-10-15')), { status: 400 }); // first day
    assert.throws(() => assertCanAssign(leave, date('2026-10-20')), { status: 400 }); // last day
    assert.doesNotThrow(() => assertCanAssign(leave, date('2026-10-14')));
    assert.doesNotThrow(() => assertCanAssign(leave, date('2026-10-21')));
  });

  test('a task that runs through the leave is allowed if it starts before the leave', () => {
    const leave = { status: 'On Leave', leaveStart: date('2026-10-15'), leaveEnd: date('2026-10-20') };
    assert.doesNotThrow(() => assertCanAssign(leave, date('2026-10-10')));
  });
});

describe('dates', () => {
  test('due date may equal start date but not precede it', () => {
    assert.doesNotThrow(() => assertDateOrder(date('2026-10-14'), date('2026-10-14')));
    assert.throws(() => assertDateOrder(date('2026-10-14'), date('2026-10-13')), { status: 400 });
  });

  test('impossible calendar dates are rejected by the parser', () => {
    assert.equal(parseDateOnly('2026-02-31'), null);
    assert.equal(parseDateOnly('2026-13-01'), null);
    assert.notEqual(parseDateOnly('2028-02-29'), null);
  });

  test('leave dates must be present together and in order', () => {
    assert.throws(() => assertLeaveConsistent({ status: 'On Leave', leaveStart: null, leaveEnd: null }), { status: 400 });
    assert.throws(
      () => assertLeaveConsistent({ status: 'On Leave', leaveStart: date('2026-10-20'), leaveEnd: date('2026-10-10') }),
      { status: 400 }
    );
    assert.throws(() => assertLeaveConsistent({ status: 'Active', leaveStart: date('2026-10-10'), leaveEnd: null }), { status: 400 });
    assert.doesNotThrow(() => assertLeaveConsistent({ status: 'Active', leaveStart: null, leaveEnd: null }));
  });
});

describe('overdue', () => {
  const now = new Date('2026-10-14T09:00:00Z');

  test('past due and still open is overdue', () => {
    assert.equal(isOverdue({ status: 'Todo', dueDate: date('2026-10-13') }, now), true);
    assert.equal(isOverdue({ status: 'In Progress', dueDate: date('2026-10-13') }, now), true);
  });

  test('due today is not overdue yet', () => {
    assert.equal(isOverdue({ status: 'Todo', dueDate: date('2026-10-14') }, now), false);
  });

  test('completed or cancelled tasks are never overdue', () => {
    assert.equal(isOverdue({ status: 'Completed', dueDate: date('2026-10-01') }, now), false);
    assert.equal(isOverdue({ status: 'Cancelled', dueDate: date('2026-10-01') }, now), false);
  });
});
