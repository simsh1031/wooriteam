package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.Post;
import wooriteam.enums.Difficulty;
import wooriteam.enums.ProjectType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class PostDetailResponse {
    private final Long id;
    private final String title;
    private final String description;
    private final Difficulty difficulty;
    private final ProjectType projectType;
    private final boolean closed;
    private final LocalDate applicationDeadline;
    private final LocalDate projectStartDate;
    private final LocalDate projectEndDate;
    private final LocalDateTime createdAt;
    private final Long authorId;
    private final String authorNickname;
    private final Long groupId;
    private final String groupName;
    private final List<PostRoleResponse> roles;

    public PostDetailResponse(Post post) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.description = post.getDescription();
        this.difficulty = post.getDifficulty();
        this.projectType = post.getProjectType();
        this.closed = post.isClosed();
        this.applicationDeadline = post.getApplicationDeadline();
        this.projectStartDate = post.getProjectStartDate();
        this.projectEndDate = post.getProjectEndDate();
        this.createdAt = post.getCreatedAt();
        this.authorId = post.getUser().getId();
        this.authorNickname = post.getUser().getNickname();
        this.groupId = post.getGroup() != null ? post.getGroup().getId() : null;
        this.groupName = post.getGroup() != null ? post.getGroup().getName() : null;
        this.roles = post.getRoles().stream()
                .map(PostRoleResponse::new)
                .collect(Collectors.toList());
    }
}