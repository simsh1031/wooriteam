package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.Post;
import wooriteam.enums.Difficulty;
import wooriteam.enums.ProjectType;
import wooriteam.enums.RoleType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class PostSummaryResponse {
    private final Long id;
    private final String title;
    private final Difficulty difficulty;
    private final ProjectType projectType;
    private final boolean closed;
    private final LocalDateTime createdAt;
    private final String authorNickname;
    private final List<RoleType> roleTypes;

    public PostSummaryResponse(Post post) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.difficulty = post.getDifficulty();
        this.projectType = post.getProjectType();
        this.closed = post.isClosed();
        this.createdAt = post.getCreatedAt();
        this.authorNickname = post.getUser().getNickname();
        this.roleTypes = post.getRoles().stream()
                .map(r -> r.getRoleType())
                .distinct()
                .collect(Collectors.toList());
    }
}