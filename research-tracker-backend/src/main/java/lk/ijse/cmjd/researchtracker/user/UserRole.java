package lk.ijse.cmjd.researchtracker.user;

/**
 * Roles available in the Research Project Tracker system.
 * ADMIN   - full system access
 * PI      - Principal Investigator, manages own projects and members
 * MEMBER  - creates/updates milestones, uploads documents
 * VIEWER  - read-only access to public project data
 */
public enum UserRole {
    ADMIN,
    PI,
    MEMBER,
    VIEWER
}
