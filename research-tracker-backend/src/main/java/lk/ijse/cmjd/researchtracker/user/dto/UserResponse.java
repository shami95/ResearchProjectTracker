package lk.ijse.cmjd.researchtracker.user.dto;

import lk.ijse.cmjd.researchtracker.user.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private String fullName;
    private UserRole role;
    private LocalDateTime createdAt;
}
