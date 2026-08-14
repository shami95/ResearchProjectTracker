# Research Project Tracker — Full Setup & Run Guide

This covers running **both** projects together on your PC in VS Code:
`research-tracker-backend` (Spring Boot + MySQL) and
`research-tracker-frontend` (React + TypeScript).

---

## 1. Prerequisites

Check each of these in a terminal before starting:

| Tool | Check with | Needed version |
|---|---|---|
| JDK | `java -version` | 17 or higher |
| Maven | `mvn -version` | 3.8+ (or use your IDE's bundled Maven — see below) |
| Node.js | `node -v` | 18 or higher |
| npm | `npm -v` | comes with Node |
| MySQL | `mysql --version` | 8.x, and the server running |

**VS Code extensions** (Extensions panel, `Ctrl+Shift+X` / `Cmd+Shift+X`):
- **Extension Pack for Java** (Microsoft) — gives you Maven support without installing Maven separately
- **Spring Boot Extension Pack** (VMware) — adds a Spring Boot dashboard to run/stop the app with one click
- **ES7+ React/Redux/React-Native snippets** (optional, for the frontend)

---

## 2. Unzip and open the projects

1. Unzip `research-tracker-backend.zip` and `research-tracker-frontend.zip` into a folder, e.g.:
   ```
   research-project-tracker/
   ├── research-tracker-backend/
   └── research-tracker-frontend/
   ```
2. In VS Code: **File → Open Folder** → select `research-project-tracker` (the parent folder). VS Code will show both projects side-by-side in the Explorer.

---

## 3. Set up MySQL

Since MySQL is already running on your machine, just create the database:

```sql
CREATE DATABASE research_tracker;
```

Then open `research-tracker-backend/src/main/resources/application.properties` and update these two lines to match **your** MySQL credentials:

```properties
spring.datasource.username=root
spring.datasource.password=root
```

(The connection string already includes `createDatabaseIfNotExist=true`, so the `CREATE DATABASE` step above is optional as long as your MySQL user is allowed to create databases.)

---

## 4. Run the backend

**Option A — Spring Boot Dashboard (easiest in VS Code):**
1. Click the Spring icon in the sidebar (added by the Spring Boot Extension Pack)
2. Find `research-tracker` under the dashboard
3. Click the ▶ (play) icon

**Option B — Terminal:**
```bash
cd research-tracker-backend
mvn spring-boot:run
```

**First run:** Hibernate creates all the database tables automatically, and a data seeder creates three starter accounts (see step 6). Watch the terminal for `Started ResearchTrackerApplication` — that means it's up on **http://localhost:8080**.

**Quick smoke test** (in a new terminal, or use Postman/Thunder Client):
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"Admin@123\"}"
```
You should get back a JSON response with a `token`. If you do, the backend is working correctly.

---

## 5. Run the frontend

Open a terminal in `research-tracker-frontend`:

```bash
cd research-tracker-frontend
npm install
npm start
```

This opens **http://localhost:3000** automatically. It's already configured to talk to the backend at `http://localhost:8080`.

> Both `npm install` and a full `npm run build` were already run and verified while building this — it compiles with zero errors.

---

## 6. Log in and test

Use one of the seeded accounts (created automatically the first time the backend starts against an empty database):

| Username | Password | Role | Can do |
|---|---|---|---|
| `admin` | `Admin@123` | ADMIN | Everything, including delete projects/users |
| `dr.perera` | `Pi@12345` | PI | Create/manage own projects, add milestones/documents |
| `viewer1` | `Viewer@123` | VIEWER | Read-only |

Or click **Create one** on the login page to self-register (new accounts get the `MEMBER` role, which can add milestones and upload documents).

**Suggested test flow:**
1. Log in as `dr.perera` (PI) → Projects → **+ New project** → fill it in
2. Open the new project → add a milestone, upload a document
3. Log out, log in as `admin` → visit `/admin` to see the user list, and try deleting/changing a project's status
4. Log in as `viewer1` → confirm the "New project" and edit/delete buttons are hidden

---


## 7. Version control (GitHub) — required for submission

The coursework requires a GitHub repo with meaningful commits, a README, screenshots/demo link, and an API summary. Suggested steps:

```bash
cd research-project-tracker
git init
git add .
git commit -m "feat: initial commit - backend and frontend scaffolding"
```

Then create commits as you make changes, using conventional prefixes (`feat:`, `fix:`, `refactor:`) as the assignment asks. Create a repo on GitHub and push:

```bash
git remote add origin https://github.com/<your-username>/research-project-tracker.git
git branch -M main
git push -u origin main
```
