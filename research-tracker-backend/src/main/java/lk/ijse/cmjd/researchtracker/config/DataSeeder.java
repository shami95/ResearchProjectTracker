package lk.ijse.cmjd.researchtracker.config;

import lk.ijse.cmjd.researchtracker.user.User;
import lk.ijse.cmjd.researchtracker.user.UserRepository;
import lk.ijse.cmjd.researchtracker.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * The coursework spec's public signup endpoint always creates a MEMBER
 * account, and there is no "promote user" endpoint in the required API.
 * So that ADMIN- and PI-only features can actually be tested, this seeder
 * creates one starter account for each role the very first time the app
 * runs against an empty database. It does nothing on subsequent runs.
 *
 * Seeded accounts (username / password):
 *   admin    / Admin@123
 *   dr.perera (PI)    / Pi@12345
 *   viewer1  (VIEWER) / Viewer@123
 *
 * Feel free to delete this class once you have created your own users.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser("admin", "Admin@123", "System Administrator", UserRole.ADMIN);
        seedUser("dr.perera", "Pi@12345", "Dr. S. Perera", UserRole.PI);
        seedUser("viewer1", "Viewer@123", "Guest Viewer", UserRole.VIEWER);
    }

    private void seedUser(String username, String rawPassword, String fullName, UserRole role) {
        if (userRepository.existsByUsername(username)) {
            return;
        }
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .fullName(fullName)
                .role(role)
                .build();
        userRepository.save(user);
        log.info("Seeded {} account -> username: {}", role, username);
    }
}
