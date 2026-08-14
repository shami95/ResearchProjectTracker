package lk.ijse.cmjd.researchtracker.project;

import lk.ijse.cmjd.researchtracker.common.exception.ResourceNotFoundException;
import lk.ijse.cmjd.researchtracker.document.DocumentRepository;
import lk.ijse.cmjd.researchtracker.document.FileStorageService;
import lk.ijse.cmjd.researchtracker.milestone.MilestoneRepository;
import lk.ijse.cmjd.researchtracker.project.dto.ProjectRequest;
import lk.ijse.cmjd.researchtracker.project.dto.ProjectResponse;
import lk.ijse.cmjd.researchtracker.user.User;
import lk.ijse.cmjd.researchtracker.user.UserRepository;
import lk.ijse.cmjd.researchtracker.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MilestoneRepository milestoneRepository;
    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream().map(this::toResponse).toList();
    }

    public ProjectResponse getProjectById(String id) {
        return toResponse(findProjectOrThrow(id));
    }

    public ProjectResponse createProject(ProjectRequest request, User currentUser) {
        User pi = currentUser;

        // Only an ADMIN may assign the project to a different PI than themselves.
        if (currentUser.getRole() == UserRole.ADMIN && request.getPiId() != null && !request.getPiId().isBlank()) {
            pi = userRepository.findById(request.getPiId())
                    .orElseThrow(() -> new ResourceNotFoundException("PI user not found with id: " + request.getPiId()));
        }

        Project project = Project.builder()
                .title(request.getTitle())
                .summary(request.getSummary())
                .tags(request.getTags())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(Status.PLANNING)
                .pi(pi)
                .build();

        return toResponse(projectRepository.save(project));
    }

    public ProjectResponse updateProject(String id, ProjectRequest request, User currentUser) {
        Project project = findProjectOrThrow(id);
        checkOwnershipOrAdmin(project, currentUser);

        project.setTitle(request.getTitle());
        project.setSummary(request.getSummary());
        project.setTags(request.getTags());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());

        return toResponse(projectRepository.save(project));
    }

    public ProjectResponse updateStatus(String id, Status status, User currentUser) {
        Project project = findProjectOrThrow(id);
        checkOwnershipOrAdmin(project, currentUser);

        project.setStatus(status);
        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(String id) {
        Project project = findProjectOrThrow(id);

        documentRepository.findByProjectId(id).forEach(document -> {
            fileStorageService.delete(document.getUrlOrPath());
            documentRepository.delete(document);
        });
        milestoneRepository.deleteAll(milestoneRepository.findByProjectId(id));

        projectRepository.delete(project);
    }

    // ----- helpers -----

    private void checkOwnershipOrAdmin(Project project, User currentUser) {
        boolean isOwner = project.getPi() != null && project.getPi().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the project's PI or an ADMIN may modify this project");
        }
    }

    private Project findProjectOrThrow(String id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private ProjectResponse toResponse(Project p) {
        return ProjectResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .summary(p.getSummary())
                .status(p.getStatus())
                .piId(p.getPi() != null ? p.getPi().getId() : null)
                .piName(p.getPi() != null ? p.getPi().getFullName() : null)
                .tags(p.getTags())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
