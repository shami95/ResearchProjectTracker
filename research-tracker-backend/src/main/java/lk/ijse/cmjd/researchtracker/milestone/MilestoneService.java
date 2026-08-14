package lk.ijse.cmjd.researchtracker.milestone;

import lk.ijse.cmjd.researchtracker.common.exception.ResourceNotFoundException;
import lk.ijse.cmjd.researchtracker.milestone.dto.MilestoneRequest;
import lk.ijse.cmjd.researchtracker.milestone.dto.MilestoneResponse;
import lk.ijse.cmjd.researchtracker.project.Project;
import lk.ijse.cmjd.researchtracker.project.ProjectRepository;
import lk.ijse.cmjd.researchtracker.user.User;
import lk.ijse.cmjd.researchtracker.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectRepository projectRepository;

    public List<MilestoneResponse> getMilestonesForProject(String projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        }
        return milestoneRepository.findByProjectId(projectId).stream().map(this::toResponse).toList();
    }

    public MilestoneResponse createMilestone(String projectId, MilestoneRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Milestone milestone = Milestone.builder()
                .project(project)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .isCompleted(request.getIsCompleted() != null ? request.getIsCompleted() : false)
                .createdBy(currentUser)
                .build();

        return toResponse(milestoneRepository.save(milestone));
    }

    public MilestoneResponse updateMilestone(String id, MilestoneRequest request, User currentUser) {
        Milestone milestone = findMilestoneOrThrow(id);
        checkCanModify(milestone, currentUser);

        milestone.setTitle(request.getTitle());
        milestone.setDescription(request.getDescription());
        milestone.setDueDate(request.getDueDate());
        if (request.getIsCompleted() != null) {
            milestone.setIsCompleted(request.getIsCompleted());
        }

        return toResponse(milestoneRepository.save(milestone));
    }

    public void deleteMilestone(String id, User currentUser) {
        Milestone milestone = findMilestoneOrThrow(id);
        checkCanModify(milestone, currentUser);
        milestoneRepository.delete(milestone);
    }

    // ----- helpers -----

    /** ADMIN, the project's PI, or the MEMBER who originally created the milestone may modify/delete it. */
    private void checkCanModify(Milestone milestone, User currentUser) {
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        boolean isProjectPi = milestone.getProject().getPi() != null
                && milestone.getProject().getPi().getId().equals(currentUser.getId());
        boolean isCreator = milestone.getCreatedBy() != null
                && milestone.getCreatedBy().getId().equals(currentUser.getId());

        if (!isAdmin && !isProjectPi && !isCreator) {
            throw new AccessDeniedException("You do not have permission to modify this milestone");
        }
    }

    private Milestone findMilestoneOrThrow(String id) {
        return milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found with id: " + id));
    }

    private MilestoneResponse toResponse(Milestone m) {
        return MilestoneResponse.builder()
                .id(m.getId())
                .projectId(m.getProject().getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .dueDate(m.getDueDate())
                .isCompleted(m.getIsCompleted())
                .createdById(m.getCreatedBy() != null ? m.getCreatedBy().getId() : null)
                .createdByName(m.getCreatedBy() != null ? m.getCreatedBy().getFullName() : null)
                .build();
    }
}
