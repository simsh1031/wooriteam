package wooriteam.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ReportRequest {

    @NotNull(message = "신고할 공고를 선택해 주세요.")
    private Long postId;

    @NotBlank(message = "신고 제목은 필수입니다.")
    private String title;

    @NotBlank(message = "신고 내용은 필수입니다.")
    private String content;
}
