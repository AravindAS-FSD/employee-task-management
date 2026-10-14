# Employee & Task Management System

A full-stack application for managing employees and assigning tasks to them, with a dashboard, server-side search/filter/sort/pagination, and CSV export. Built for the Roots Media Marketing MERN Stack Developer Intern assignment.

The business rules are enforced on the **backend**. The frontend mirrors them for fast feedback, but a request that bypasses the UI is still rejected.

## Live deployment

| Part | URL |
| --- | --- |
| Frontend (Vercel) | https://employee-task-management-blush.vercel.app |
| Backend API (Render) | https://employee-task-api-9c3g.onrender.com/api |
| Health check | https://employee-task-api-9c3g.onrender.com/api/health |

The Render free tier sleeps when idle. The first request can take 30 to 60 seconds.

## Tech stack

- **Frontend:** React 18, Vite, React Router, Tailwind CSS (JavaScript)
- **Backend:** Node.js, Express, Mongoose, Zod (JavaScript, ES modules)
- **Database:** MongoDB (MongoDB Atlas in production)
- **Testing:** Node's built-in test runner (`node --test`) for the business rules

## Repository structure

```
.
├── backend/
│   ├── src/
│   │   ├── app.js, server.js          Express app and entry point
│   │   ├── config/db.js               MongoDB connection
│   │   ├── constants.js               Enums and limits
│   │   ├── domain/rules.js            All business rules (pure functions, unit-tested)
│   │   ├── models/                    Mongoose schemas (Employee, Task, Counter)
│   │   ├── validators/                Zod schemas for request bodies and queries
│   │   ├── services/                  Business logic that touches the database
│   │   ├── controllers/               Thin HTTP handlers
│   │   ├── routes/                    Route definitions
│   │   ├── middleware/                Validation and error handling
│   │   ├── utils/                     Errors, dates, CSV, pagination helpers
│   │   └── scripts/seed.js            Sample data
│   ├── tests/rules.test.js            Unit tests for the business rules
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                       One client module per resource
│   │   ├── components/                Reusable UI (Table, Pagination, FormField, Badges, ...)
│   │   ├── features/tasks/            Task list, filters, form, view, status dropdown
│   │   ├── features/employees/        Employee list, filters, form, view
│   │   ├── hooks/                     useFetch, useListParams (URL state), useDebouncedValue
│   │   ├── context/ToastContext.jsx   Notifications
│   │   ├── pages/                     Dashboard, NotFound
│   │   └── utils/                     Validation, formatting, error mapping
│   ├── .env.example
│   └── vercel.json                    SPA routing on Vercel
└── .gitignore
```

## Setup

### Prerequisites

- Node.js 20 or newer (`node -v`)
- MongoDB 6 or 7 running locally, or a MongoDB Atlas connection string
- Git (optional, for cloning)

### 1. Backend

```bash
cd backend
cp .env.example .env        # Windows PowerShell: copy .env.example .env
npm install
npm test                    # 13 rule tests should pass
npm run seed                # optional: loads 6 employees and 7 tasks
npm run dev                 # API on http://localhost:5000
```

Check it:

```bash
curl http://localhost:5000/api/health
# {"status":"ok"}
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # app on http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` to `localhost:5000`, so no CORS setup is needed locally.

### Production build

```bash
cd frontend
npm run build               # output in dist/
npm run preview             # serve dist/ locally
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `PORT` | No (default `5000`) | `5000` | Port the server listens on. Render sets this automatically. |
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/roots_tasks` | MongoDB connection string. Use the Atlas `mongodb+srv://` string in production. |
| `CORS_ORIGIN` | Yes in production | `https://employee-task-management-blush.vercel.app` | Comma-separated list of frontend origins allowed to call the API. No trailing slash. |

### Frontend (`frontend/.env`)

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | No (default `/api`) | `https://employee-task-api-9c3g.onrender.com/api` | Base URL of the API. Read at build time, so redeploy after changing it. |

Never commit `.env` files. Only `.env.example` is tracked.

## API overview

Base path: `/api`. All request and response bodies are JSON.

### Response format

Successful list responses:

```json
{ "data": [ ... ], "meta": { "page": 1, "limit": 10, "total": 23, "totalPages": 3 } }
```

Successful single-item responses return `{ "data": { ... } }`. Delete returns `204 No Content`.

Errors use one shape:

```json
{ "code": "BUSINESS_RULE_VIOLATION", "message": "Inactive employees cannot be assigned tasks", "details": { "field": "assignedEmployee" } }
```

| Status | Codes | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR`, `BUSINESS_RULE_VIOLATION`, `BAD_REQUEST`, `EXPORT_LIMIT_EXCEEDED` | Invalid data or a broken business rule. `details` lists fields. |
| 404 | `NOT_FOUND` | Resource or route not found, including malformed IDs. |
| 409 | `DUPLICATE`, `CONFLICT` | Duplicate employee ID or email, or a concurrent change to the same record. |
| 500 | `INTERNAL_ERROR` | Unexpected server error. Details are logged, not returned. |

### Health

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Returns `{"status":"ok"}` |

### Employees

| Method | Path | Description |
| --- | --- | --- |
| GET | `/employees` | List with paging, search, filters and sort |
| POST | `/employees` | Create |
| GET | `/employees/:id` | View one |
| PUT | `/employees/:id` | Update (partial) |
| DELETE | `/employees/:id` | Delete, blocked while the employee has active tasks |

Query parameters for `GET /employees`:

| Parameter | Values | Default |
| --- | --- | --- |
| `search` | Matches name, email or employee ID | none |
| `department` | Development, Design, QA, HR, Sales | none |
| `status` | Active, Inactive, On Leave | none |
| `sort` | `fullName`, `joiningDate`, `employeeId` | `fullName` |
| `order` | `asc`, `desc` | `asc` |
| `page` | 1 or more | `1` |
| `limit` | 1 to 100 | `10` |

### Tasks

| Method | Path | Description |
| --- | --- | --- |
| GET | `/tasks` | List with paging, search, filters and sort |
| GET | `/tasks/export.csv` | CSV of every task matching the same filters (max 5,000 rows) |
| POST | `/tasks` | Create (always starts as `Todo`) |
| GET | `/tasks/:id` | View one |
| PUT | `/tasks/:id` | Edit fields. Cannot change status or completed date. |
| PUT | `/tasks/:id/status` | Change status. The only way to change status. |
| DELETE | `/tasks/:id` | Delete |

Query parameters for `GET /tasks` and `GET /tasks/export.csv`:

| Parameter | Values | Notes |
| --- | --- | --- |
| `search` | text | Matches task title or assignee name |
| `department` | Development, Design, QA, HR, Sales | |
| `priority` | Low, Medium, High, Critical | |
| `status` | Todo, In Progress, Completed, Cancelled, **Overdue** | `Overdue` is computed, see below |
| `employee` | employee ID | Tasks assigned to one employee |
| `dueFrom`, `dueTo` | `YYYY-MM-DD` | Inclusive due-date range |
| `sort` | `createdDate`, `dueDate`, `priority`, `title` | `priority` sorts by importance (Critical first when `desc`) |
| `order` | `asc`, `desc` | `desc` by default |
| `page`, `limit` | as above | CSV export ignores paging |

All filters combine with AND. Example:

```
/api/tasks?status=In%20Progress&priority=High&department=Development&page=2&limit=10
```

### Status change

```http
PUT /api/tasks/:id/status
Content-Type: application/json

{ "status": "In Progress" }
```

### Dashboard

| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard` | Employee counts by status, task counts by status, overdue count, and per-employee workload |

## Data model

### Employee

| Field | Type | Rules |
| --- | --- | --- |
| `employeeId` | string | Required, unique, 3 to 20 characters, letters/digits/hyphens, stored uppercase |
| `fullName` | string | Required, 2 to 100 characters |
| `email` | string | Required, unique, valid format, stored lowercase |
| `phone` | string | Required, digits with optional `+`, spaces or hyphens |
| `department` | enum | Development, Design, QA, HR, Sales |
| `role` | string | Required, 2 to 100 characters |
| `joiningDate` | date | Required |
| `status` | enum | Active (default), Inactive, On Leave |
| `leaveStart`, `leaveEnd` | date | Required together when On Leave, end not before start. Must be empty otherwise. |
| `skills` | string[] | Up to 20 entries |
| `activeTaskCount` | number | Maintained by the server. Counts Todo and In Progress tasks. |

### Task

| Field | Type | Rules |
| --- | --- | --- |
| `taskCode` | string | Generated by the server, `TSK-001`, `TSK-002`, ... |
| `title` | string | Required, 3 to 120 characters |
| `description` | string | Optional, up to 2,000 characters |
| `employee` | ObjectId → Employee | The assigned employee. `null` once that employee is deleted. |
| `assignee` | snapshot | `{ code, name, email, department, deleted }`. Keeps history readable after deletion. |
| `department` | enum | Development, Design, QA, HR, Sales |
| `priority` | enum | Low, Medium, High, Critical |
| `priorityRank` | number | 1 to 4, used for sorting by importance |
| `status` | enum | Todo (default), In Progress, Completed, Cancelled |
| `startDate`, `dueDate` | date | Required, due date not before start date |
| `createdDate` | date | Set by the server |
| `completedDate` | date | Set by the server when status becomes Completed. Never accepted from the client. |

Overdue is not stored. It's computed from `dueDate` and `status` on every read, so it's always current.

### Employee → Task relationship

- One employee has many tasks. Each task references one employee through `employee`.
- The task also stores an `assignee` snapshot. The snapshot is what the UI shows, so a task still reads correctly after its employee is deleted.
- Renaming an employee or changing their email or department updates the snapshot on all of that employee's tasks.

### Counter

A small `Counter` collection generates the sequential task codes (`TSK-001`, ...).

## Business rules

| Rule | Where it is enforced |
| --- | --- |
| A task can only go to an Active employee | `assertCanAssign` in `domain/rules.js`, called from `taskService` on create and on reassignment |
| Inactive employees never receive tasks | Same as above |
| On Leave employees are blocked only when the task's start date falls inside the leave period (both ends inclusive) | Same as above |
| Due date cannot be earlier than start date | `assertDateOrder`, checked on create and update |
| Status flow: Todo → In Progress → Completed; Todo or In Progress → Cancelled; anything else rejected | `ALLOWED_TRANSITIONS` and `assertCanTransition`, used by `taskService.changeStatus` |
| New tasks start as Todo | `createTask` sets the status, ignoring any client value |
| Status changes only through `PUT /tasks/:id/status` | The generic update schema is `.strict()`, so `status` and `completedDate` are rejected there |
| Completed and Cancelled tasks cannot be edited | `assertTaskEditable` |
| Completed Date is set by the server | `changeStatus` sets it when the new status is Completed |
| An employee holds at most 3 active tasks | Atomic slot reservation in `taskService.reserveSlot` |
| Overdue: today is after due date and the task is not Completed or Cancelled | `isOverdue` in `domain/rules.js`, the same logic used in the dashboard query and the CSV |
| Employee cannot be deleted while they have Todo or In Progress tasks | Atomic check in `employeeService.deleteEmployee` |

## How employee deletion is handled

1. The server deletes the employee only when `activeTaskCount` is 0. The check and the delete happen in one atomic database operation (`findOneAndDelete` with that condition), so a task can't be assigned between a separate check and the delete.
2. If the condition fails, the API returns `400 BUSINESS_RULE_VIOLATION` with the number of active tasks in `details`.
3. On success, every task of that employee gets `employee: null` and `assignee.deleted: true`. The snapshot keeps the name, email, code and department.
4. The UI shows these tasks with "(removed)" next to the name and no link to the employee.

Completed and Cancelled tasks are kept. Only the link to the employee is removed.

## Assumptions

- **No authentication.** The assignment states that none is required.
- **Dates are UTC.** "Today" means UTC midnight, and dates are displayed in UTC so a day never shifts.
- **Inactive or On Leave employees keep their existing tasks.** The rules restrict new assignments and reassignments only.
- **Tasks are deleted permanently.** Completed and Cancelled tasks can also be deleted.
- **Renames propagate to history.** Changing an employee's name updates the snapshot on all their tasks, including completed ones.
- **Priority sorting uses importance,** not alphabetical order. `desc` puts Critical first.
- **CSV export is capped at 5,000 rows.** Above that, the API asks the user to narrow the filters. The cap protects the server.
- **The frontend's employee dropdown loads up to 100 employees.** A searchable picker would be needed beyond that.
- **Atlas network access is open to `0.0.0.0/0`** for deployment, because Render's outbound IPs change. Tighten this in production.

## Answers to the six review questions

**1. Where do you validate status transitions, and why there?**
The transitions are defined once in `ALLOWED_TRANSITIONS` (`domain/rules.js`) and checked in `taskService.changeStatus` before any write. The check lives on the backend because the UI can be bypassed, and the document requires the backend to enforce every rule. The database update is also conditioned on the current status, so two simultaneous changes can't both succeed.

**2. Why does Completed Date come from the backend?**
The client's clock and timezone can be wrong, and the client can send any value. The completion timestamp is a fact about when the server applied the change, so the server sets it. The update schema also rejects `completedDate` outright.

**3. How do you block inactive and on-leave assignment?**
`assertCanAssign` runs on create, and on update when the employee or start date changes. Inactive employees are always rejected. On Leave employees are rejected only when the task's start date falls inside `[leaveStart, leaveEnd]`, both ends inclusive. The reservation step also repeats the status check inside the database write, so an employee who becomes Inactive between the check and the write is still rejected.

**4. Why are filtering and pagination on the backend?**
Fetching everything and filtering in React gets slower as data grows, and it sends data the user never sees. Server-side paging also keeps the page count and totals correct. The CSV export must include every matching row, not just the visible page, and sharing the same query builder guarantees the export matches the list. Indexes on `status`, `dueDate`, `employee` and `priorityRank` keep queries fast.

**5. Why do the filters live in the URL?**
The URL becomes the single source of truth. A copied link reproduces the same filters, sort and page. Refresh keeps the view. The browser Back button steps through filter changes. The list fetches from the URL, so there's no separate client state to drift out of sync.

**6. What can go wrong if two requests assign a 4th active task at the same time?**
Without protection, both requests could read `2` active tasks, both pass the check, and both insert, leaving the employee with 4. This implementation prevents it with a single conditional update: `activeTaskCount` is incremented only when it is below 3. Only one of two simultaneous requests can take the last slot. The other gets `400 Employee already has 3 active tasks`.

Remaining risks, and how they are handled:
- **Crash between reserving the slot and saving the task.** The slot stays taken with no task. A failed insert is rolled back, but a process crash skips the rollback. A periodic recount of active tasks per employee would repair this. MongoDB transactions would make the two writes atomic, and Atlas supports them on replica sets.
- **Counter drift from manual database edits.** Changes made outside the application can desynchronize `activeTaskCount`. Recounting from tasks fixes it.

## Testing

- **Unit tests** (`npm test` in `backend/`): 13 tests cover the status transitions, assignment rules including inclusive leave boundaries, date order, leave consistency, and overdue logic.
- **API tests:** 28 scripted checks in the test plan cover every business rule, validation, error codes, filters, sorting, CSV export and deletion behavior.
- **UI tests:** 36 manual checks cover routing, URL persistence, status flow, form validation, server error display, export, responsive layout and offline behavior.

## Known limitations

- No authentication or roles.
- No automated end-to-end or integration tests against a live database.
- Free-tier hosting cold start.
- No audit history of status changes beyond `completedDate` and timestamps.