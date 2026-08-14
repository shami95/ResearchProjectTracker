package lk.ijse.cmjd.researchtracker.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private String id;
    private String projectId;
    private String title;
    private String description;
    private String urlOrPath;
    private String uploadedById;
    private String uploadedByName;
    private LocalDateTime uploadedAt;
}
