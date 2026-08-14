package lk.ijse.cmjd.researchtracker.document;

import lk.ijse.cmjd.researchtracker.common.exception.ResourceNotFoundException;
import lk.ijse.cmjd.researchtracker.document.dto.DocumentResponse;
import lk.ijse.cmjd.researchtracker.project.Project;
import lk.ijse.cmjd.researchtracker.project.ProjectRepository;
import lk.ijse.cmjd.researchtracker.user.User;
import lk.ijse.cmjd.researchtracker.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final FileStorageService fileStorageService;

    public List<DocumentResponse> getDocumentsForProject(String projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        }
        return documentRepository.findByProjectId(projectId).stream().map(this::toResponse).toList();
    }

    public DocumentResponse uploadDocument(String projectId, String title, String description, MultipartFile file, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        String storedPath = fileStorageService.store(file);

        Document document = Document.builder()
                .project(project)
                .title(title)
                .description(description)
                .urlOrPath(storedPath)
                .uploadedBy(currentUser)
                .build();

        return toResponse(documentRepository.save(document));
    }

    public void deleteDocument(String id, User currentUser) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        boolean isProjectPi = document.getProject().getPi() != null
                && document.getProject().getPi().getId().equals(currentUser.getId());

        if (!isAdmin && !isProjectPi) {
            throw new AccessDeniedException("Only an ADMIN or the project's PI may delete this document");
        }

        fileStorageService.delete(document.getUrlOrPath());
        documentRepository.delete(document);
    }

    private DocumentResponse toResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .projectId(d.getProject().getId())
                .title(d.getTitle())
                .description(d.getDescription())
                .urlOrPath(d.getUrlOrPath())
                .uploadedById(d.getUploadedBy() != null ? d.getUploadedBy().getId() : null)
                .uploadedByName(d.getUploadedBy() != null ? d.getUploadedBy().getFullName() : null)
                .uploadedAt(d.getUploadedAt())
                .build();
    }
}
