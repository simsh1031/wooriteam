package wooriteam.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import wooriteam.enums.RoleType;

@Getter
public class PostRoleRequest {

    @NotNull(message = "역할 타입은 필수입니다.")
    private RoleType roleType;

    private String description;

    private String techStack;
}