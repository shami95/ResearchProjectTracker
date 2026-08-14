package lk.ijse.cmjd.researchtracker.milestone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneResponse {
    private String id;
    private String projectId;
    private String title;
    private String description;
    private LocalDate dueDate;
    private Boolean isCompleted;
    private String createdById;
    private String createdByName;
}
