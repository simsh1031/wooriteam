package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.Application;
import wooriteam.enums.RoleType;

import java.time.LocalDateTime;

@Getter
public class MyApplicationResponse {
    private final Long id;
    private final Long postId;
    private final String postTitle;
    private final RoleType roleType;
    private final boolean postClosed;
    private final LocalDateTime createdAt;

    public MyApplicationResponse(Application application) {
        this.id = application.getId();
        this.postId = application.getPost().getId();
        this.postTitle = application.getPost().getTitle();
        this.roleType = application.getRole().getRoleType();
        this.postClosed = application.getPost().isClosed();
        this.createdAt = application.getCreatedAt();
    }
}