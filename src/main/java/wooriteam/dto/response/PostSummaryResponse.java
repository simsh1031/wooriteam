package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.Post;
import wooriteam.entity.PostRole;
import wooriteam.enums.Difficulty;
import wooriteam.enums.ProjectType;
import wooriteam.enums.RoleType;

import java.time.LocalDate;
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
    private final LocalDate applicationDeadline;
    private final LocalDate projectStartDate;
    private final LocalDate projectEndDate;
    private final LocalDateTime createdAt;
    private final String authorNickname;
    private final Long groupId;
    private final String groupName;
    private final List<RoleType> roleTypes;
    private final List<RoleStack> roleStacks;

    public PostSummaryResponse(Post post) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.difficulty = post.getDifficulty();
        this.projectType = post.getProjectType();
        this.closed = post.isClosed();
        this.applicationDeadline = post.getApplicationDeadline();
        this.projectStartDate = post.getProjectStartDate();
        this.projectEndDate = post.getProjectEndDate();
        this.createdAt = post.getCreatedAt();
        this.authorNickname = post.getUser().getNickname();
        this.groupId = post.getGroup() != null ? post.getGroup().getId() : null;
        this.groupName = post.getGroup() != null ? post.getGroup().getName() : null;
        this.roleTypes = post.getRoles().stream()
                .map(r -> r.getRoleType())
                .distinct()
                .collect(Collectors.toList());
        this.roleStacks = post.getRoles().stream()
                .map(RoleStack::new)
                .collect(Collectors.toList());
    }

    @Getter
    public static class RoleStack {
        private final RoleType roleType;
        private final String techStack;

        public RoleStack(PostRole role) {
            this.roleType = role.getRoleType();
            this.techStack = role.getTechStack();
        }
    }
}