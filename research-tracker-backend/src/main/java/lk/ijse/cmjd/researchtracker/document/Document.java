package lk.ijse.cmjd.researchtracker.document;

import jakarta.persistence.*;
import lk.ijse.cmjd.researchtracker.project.Project;
import lk.ijse.cmjd.researchtracker.user.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a research-related file or reference material uploaded to a project.
 */
@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    /** Public URL/path where the uploaded file can be downloaded, e.g. /uploads/xyz.pdf */
    @Column(nullable = false)
    private String urlOrPath;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    private LocalDateTime uploadedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        uploadedAt = LocalDateTime.now();
    }
}
