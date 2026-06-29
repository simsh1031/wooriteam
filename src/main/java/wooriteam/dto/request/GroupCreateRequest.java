package wooriteam.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class GroupCreateRequest {

    @NotBlank(message = "그룹명은 필수입니다.")
    private String name;

    private String description;
}