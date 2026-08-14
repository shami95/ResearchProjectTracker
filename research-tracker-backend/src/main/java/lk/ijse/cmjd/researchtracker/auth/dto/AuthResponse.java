package lk.ijse.cmjd.researchtracker.auth.dto;

import lk.ijse.cmjd.researchtracker.user.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String userId;
    private String username;
    private String fullName;
    private UserRole role;
}
