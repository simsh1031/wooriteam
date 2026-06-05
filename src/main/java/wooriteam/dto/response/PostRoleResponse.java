package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.PostRole;
import wooriteam.enums.RoleType;

@Getter
public class PostRoleResponse {
    private final Long id;
    private final RoleType roleType;
    private final String description;
    private final String techStack;

    public PostRoleResponse(PostRole role) {
        this.id = role.getId();
        this.roleType = role.getRoleType();
        this.description = role.getDescription();
        this.techStack = role.getTechStack();
    }
}