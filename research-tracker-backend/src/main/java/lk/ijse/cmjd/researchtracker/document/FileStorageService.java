package lk.ijse.cmjd.researchtracker.document;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Handles saving uploaded files to a local directory on disk and building
 * the public-facing URL under which they can later be retrieved
 * (see WebConfig, which exposes this directory at /uploads/**).
 */
@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file was provided for upload");
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
            String extension = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = originalFilename.substring(dotIndex);
            }

            String storedFilename = UUID.randomUUID() + extension;
            Path targetPath = uploadPath.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + storedFilename;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store uploaded file: " + ex.getMessage(), ex);
        }
    }

    public void delete(String urlOrPath) {
        if (urlOrPath == null || !urlOrPath.startsWith("/uploads/")) {
            return;
        }
        try {
            String filename = urlOrPath.substring("/uploads/".length());
            Path targetPath = Paths.get(uploadDir).resolve(filename);
            Files.deleteIfExists(targetPath);
        } catch (IOException ignored) {
            // Non-fatal: the DB record is still removed even if disk cleanup fails.
        }
    }
}
