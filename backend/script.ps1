$BASE = "http://localhost:5000/api"

# Sends a request and prints "<status> <body>". Works for success and error responses.
function Api($Method, $Path, $Body = $null) {
  $p = @{ Method = $Method; Uri = "$BASE$Path"; ContentType = "application/json"; UseBasicParsing = $true }
  if ($null -ne $Body) {
    $p.Body = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 5 }
  }
  try {
    $r = Invoke-WebRequest @p
    "$($r.StatusCode) $($r.Content)"
  } catch {
    "$([int]$_.Exception.Response.StatusCode) $($_.ErrorDetails.Message)"
  }
}

function Id($Path) { (Invoke-RestMethod "$BASE$Path").data[0].id }
function Day($n) { (Get-Date).AddDays($n).ToString("yyyy-MM-dd") }
function NewTask($Body) { (Invoke-RestMethod -Method Post -Uri "$BASE/tasks" -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 5)).data }

# Look up seeded employees
$karan = Id "/employees?search=Karan"
$neha  = Id "/employees?search=Neha"
$rahul = Id "/employees?search=Rahul"
$priya = Id "/employees?search=Priya"
$amit  = Id "/employees?search=Amit"

# Neha's leave dates, taken from the API so the tests work whenever you run them
$nehaData = (Invoke-RestMethod "$BASE/employees/$neha").data
$ls = $nehaData.leaveStart.Substring(0,10)
$le = $nehaData.leaveEnd.Substring(0,10)

# Api GET "/employees?page=2&limit=2"
# Api POST /tasks @{ title="Inactive test"; assignedEmployee=$karan; department="Sales"; priority="Low"; startDate=(Day 1); dueDate=(Day 2) }
# Api POST /tasks @{ title="Leave inside"; assignedEmployee=$neha; department="HR"; priority="Low"; startDate=$ls; dueDate=$ls }
# $before = ([datetime]$ls).AddDays(-1).ToString("yyyy-MM-dd")
# Api POST /tasks @{ title="Leave outside"; assignedEmployee=$neha; department="HR"; priority="Low"; startDate=$before; dueDate=$before }
# NewTask @{ title="Capacity A"; assignedEmployee=$rahul; department="Development"; priority="Medium"; startDate=(Day 1); dueDate=(Day 5) }
# Api POST /tasks @{ title="Capacity B"; assignedEmployee=$rahul; department="Development"; priority="Medium"; startDate=(Day 1); dueDate=(Day 5) }
# Api POST /tasks @{ title="Date order"; assignedEmployee=$priya; department="Design"; priority="Low"; startDate=(Day 5); dueDate=(Day 3) }
$t = NewTask @{ title="Start status"; assignedEmployee=$karan; department="Design"; priority="Low"; startDate=(Day 1); dueDate=(Day 4) }
# $t.status
# Api PUT "/tasks/$($t.id)/status" '{"status":"Completed"}'        # Todo -> Completed (skips In Progress)
# Api PUT "/tasks/$($t.id)/status" '{"status":"Todo"}'             # Todo -> Todo
$t2 = NewTask @{ title="Flow test"; assignedEmployee=$amit; department="Design"; priority="Low"; startDate=(Day 1); dueDate=(Day 4) }
# (Invoke-RestMethod -Method Put "$BASE/tasks/$($t2.id)/status" -ContentType application/json -Body '{"status":"In Progress"}').data.status
# $done = (Invoke-RestMethod -Method Put "$BASE/tasks/$($t2.id)/status" -ContentType application/json -Body '{"status":"Completed"}').data
# $done.status; $done.completedDate
# Api PUT "/tasks/$($t2.id)" @{ title="Trying to edit" }
# Api PUT "/tasks/$($t.id)" '{"status":"Completed"}'
# Api PUT "/tasks/$($t.id)" '{"completedDate":"2026-01-01T00:00:00.000Z"}'
# Api POST /employees '{"employeeId":"EMP-099","fullName":"Test Person","email":"rahul.sharma@example.com","phone":"+91 90000 00001","department":"QA","role":"Tester","joiningDate":"2026-01-01"}'
# Api POST /employees '{"employeeId":"EMP-001","fullName":"Another Person","email":"another.person@example.com","phone":"+91 90000 00002","department":"QA","role":"Tester","joiningDate":"2026-01-01"}'
# Api DELETE "/employees/$rahul"
# Api DELETE "/employees/$amit" 
# (Invoke-RestMethod "$BASE/tasks?search=Amit").data | Select-Object taskCode, @{n='employee';e={$_.assignee.id}}, @{n='name';e={$_.assignee.name}}, @{n='deleted';e={$_.assignee.deleted}}
# $od = Invoke-RestMethod "$BASE/tasks?status=Overdue"
# $od.meta.total 
# (Invoke-RestMethod "$BASE/dashboard").data.tasks.overdue
# $od.data | ForEach-Object { $_.isOverdue }
# (Invoke-RestMethod "$BASE/tasks?status=In%20Progress&priority=High&department=Development").data |
# ForEach-Object { "$($_.status) | $($_.priority) | $($_.department) | $($_.title)" }
# (Invoke-RestMethod "$BASE/tasks?search=rahul").data | ForEach-Object { $_.assignee.name }
# (Invoke-RestMethod "$BASE/tasks?sort=priority&order=desc&limit=100").data | ForEach-Object { $_.priority }
# (Invoke-RestMethod "$BASE/tasks?sort=dueDate&order=asc&limit=100").data | ForEach-Object { $_.dueDate.Substring(0,10) }
# curl.exe -o tasks-test.csv "http://localhost:5000/api/tasks/export.csv?status=Todo"
# Get-Content tasks-test.csv | Select-Object -First 2
# (Get-Content tasks-test.csv).Count - 1
# (Invoke-RestMethod "$BASE/tasks?status=Todo&limit=100").meta.total
# Api GET /tasks/000000000000000000000000
# Api GET /tasks/abc
# Api POST /employees '{"email":"bad"}'
# Api PUT "/employees/$priya" '{"status":"On Leave"}'
# (Invoke-RestMethod "$BASE/dashboard").data.tasks.total
# (Invoke-RestMethod "$BASE/tasks?limit=1").meta.total
$p = NewTask @{ title="Reassign test"; assignedEmployee=$priya; department="Design"; priority="Low"; startDate=(Day 1); dueDate=(Day 4) }
Api PUT "/tasks/$($p.id)" @{ assignedEmployee=$rahul }