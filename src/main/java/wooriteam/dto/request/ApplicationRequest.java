package wooriteam.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ApplicationRequest {

    @NotNull(message = "역할 ID는 필수입니다.")
    private Long roleId;

    @NotBlank(message = "지원동기는 필수입니다.")
    private String motivation;

    private String techStack;

    private String experience;

    @NotBlank(message = "연락처는 필수입니다.")
    private String contact;
}