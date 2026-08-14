package lk.ijse.cmjd.researchtracker.document;

import lk.ijse.cmjd.researchtracker.document.dto.DocumentResponse;
import lk.ijse.cmjd.researchtracker.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping("/api/projects/{projectId}/documents")
    public ResponseEntity<List<DocumentResponse>> getForProject(@PathVariable String projectId) {
        return ResponseEntity.ok(documentService.getDocumentsForProject(projectId));
    }

    @PostMapping(value = "/api/projects/{projectId}/documents", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('MEMBER','PI','ADMIN')")
    public ResponseEntity<DocumentResponse> upload(
            @PathVariable String projectId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.uploadDocument(projectId, title, description, file, currentUser));
    }

    @DeleteMapping("/api/documents/{id}")
    @PreAuthorize("hasAnyRole('PI','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal User currentUser) {
        documentService.deleteDocument(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
