package lk.ijse.cmjd.researchtracker.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjectRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String summary;

    private String tags;

    private LocalDate startDate;

    private LocalDate endDate;

    /**
     * Optional. Only honoured when the caller is an ADMIN and wants to
     * assign a project to a specific Principal Investigator. When a PI
     * creates their own project this is ignored and they become the PI.
     */
    private String piId;
}
