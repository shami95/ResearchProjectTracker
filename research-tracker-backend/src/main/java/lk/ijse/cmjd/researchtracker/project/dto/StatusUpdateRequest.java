package lk.ijse.cmjd.researchtracker.project.dto;

import jakarta.validation.constraints.NotNull;
import lk.ijse.cmjd.researchtracker.project.Status;
import lombok.Data;

@Data
public class StatusUpdateRequest {

    @NotNull(message = "Status is required")
    private Status status;
}
