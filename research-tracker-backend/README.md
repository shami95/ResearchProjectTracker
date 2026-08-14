# Research Project Tracker — Backend

Spring Boot + MySQL backend for the CMJD Assignment 1 coursework: a Research
Project Tracker for an Educational Institute, with JWT authentication and
role-based access control (ADMIN, PI, MEMBER, VIEWER).

## Tech Stack
- Spring Boot 3.3.4 (Java 17)
- Spring Web, Spring Data JPA, Spring Security
- MySQL 8
- JWT (jjwt 0.11.5)
- Maven
- Lombok

## Project Structure
```
lk.ijse.cmjd.researchtracker
├── auth/          signup & login
├── user/          user entity, admin user management
├── project/       Project entity + CRUD
├── milestone/      Milestone entity + CRUD
├── document/       Document entity + file upload/download
├── config/        Spring Security, JWT filter, CORS, data seeder
└── common/exception/  centralised error handling
```

## Prerequisites
- JDK 17+
- Maven 3.8+ (or use your IDE's bundled Maven)
- MySQL 8 running locally

## Setup

1. **Create the database** (or let the app create it automatically — see below):
   ```sql
   CREATE DATABASE research_tracker;
   ```

2. **Configure credentials** in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```
   The connection URL already includes `createDatabaseIfNotExist=true`, so
   step 1 is optional as long as your MySQL user has permission to create
   databases.

3. **Run the app**:
   ```bash
   mvn spring-boot:run
   ```
   The API starts on `http://localhost:8080`. Hibernate will auto-create all
   tables on first run (`spring.jpa.hibernate.ddl-auto=update`).

## Seeded accounts

The public `/api/auth/signup` endpoint always creates a `MEMBER` account (per
the coursework spec), and the spec's API doesn't include a "promote user"
endpoint. So that you can actually exercise ADMIN/PI-only features, a
`DataSeeder` creates these accounts the first time the app runs against an
empty database:

| Username    | Password    | Role   |
|-------------|-------------|--------|
| `admin`     | `Admin@123` | ADMIN  |
| `dr.perera` | `Pi@12345`  | PI     |
| `viewer1`   | `Viewer@123`| VIEWER |

You can delete `config/DataSeeder.java` once you've created your own users,
or edit it to change the seeded accounts.

## API Endpoints

**Auth** (public)
- `POST /api/auth/signup` — `{ username, password, fullName }` → creates a MEMBER, returns JWT
- `POST /api/auth/login` — `{ username, password }` → returns JWT

**Projects** (`Authorization: Bearer <token>` required)
- `GET /api/projects` — list all
- `GET /api/projects/{id}` — view one
- `POST /api/projects` — create (PI, ADMIN)
- `PUT /api/projects/{id}` — update (owning PI, ADMIN)
- `PATCH /api/projects/{id}/status` — `{ status }` (owning PI, ADMIN)
- `DELETE /api/projects/{id}` — (ADMIN only)

**Milestones**
- `GET /api/projects/{id}/milestones`
- `POST /api/projects/{id}/milestones` — (MEMBER, PI, ADMIN)
- `PUT /api/milestones/{id}` — (creator, owning PI, ADMIN)
- `DELETE /api/milestones/{id}` — (creator, owning PI, ADMIN)

**Documents**
- `GET /api/projects/{id}/documents`
- `POST /api/projects/{id}/documents` — multipart form-data: `title`, `description`, `file` (MEMBER, PI, ADMIN)
- `DELETE /api/documents/{id}` — (owning PI, ADMIN)
- Uploaded files are served back from `http://localhost:8080/uploads/<filename>`

**Users**
- `GET /api/users` — (ADMIN only)
- `GET /api/users/{id}`
- `DELETE /api/users/{id}` — (ADMIN only)

## Notes
- IDs are UUID strings, generated automatically on save.
- Passwords are hashed with BCrypt.
- JWTs are valid for 24 hours (`jwt.expiration` in `application.properties`).
- Errors are returned as JSON: `{ "status": ..., "message": ..., "timestamp": ... }`.
