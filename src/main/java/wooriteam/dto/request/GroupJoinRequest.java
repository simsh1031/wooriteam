package wooriteam.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class GroupJoinRequest {

    @NotBlank(message = "자기소개는 필수입니다.")
    private String introduction;

    @NotBlank(message = "경험 및 경력은 필수입니다.")
    private String experience;

    private String portfolioLink;

    @NotBlank(message = "이메일은 필수입니다.")
    private String email;
}
