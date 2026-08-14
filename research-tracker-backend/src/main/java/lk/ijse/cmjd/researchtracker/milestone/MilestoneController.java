package lk.ijse.cmjd.researchtracker.milestone;

import jakarta.validation.Valid;
import lk.ijse.cmjd.researchtracker.milestone.dto.MilestoneRequest;
import lk.ijse.cmjd.researchtracker.milestone.dto.MilestoneResponse;
import lk.ijse.cmjd.researchtracker.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;

    @GetMapping("/api/projects/{projectId}/milestones")
    public ResponseEntity<List<MilestoneResponse>> getForProject(@PathVariable String projectId) {
        return ResponseEntity.ok(milestoneService.getMilestonesForProject(projectId));
    }

    @PostMapping("/api/projects/{projectId}/milestones")
    @PreAuthorize("hasAnyRole('MEMBER','PI','ADMIN')")
    public ResponseEntity<MilestoneResponse> create(
            @PathVariable String projectId,
            @Valid @RequestBody MilestoneRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(milestoneService.createMilestone(projectId, request, currentUser));
    }

    @PutMapping("/api/milestones/{id}")
    @PreAuthorize("hasAnyRole('MEMBER','PI','ADMIN')")
    public ResponseEntity<MilestoneResponse> update(
            @PathVariable String id,
            @Valid @RequestBody MilestoneRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(milestoneService.updateMilestone(id, request, currentUser));
    }

    @DeleteMapping("/api/milestones/{id}")
    @PreAuthorize("hasAnyRole('MEMBER','PI','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal User currentUser) {
        milestoneService.deleteMilestone(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
