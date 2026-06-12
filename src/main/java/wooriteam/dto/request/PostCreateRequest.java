package wooriteam.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import wooriteam.enums.Difficulty;
import wooriteam.enums.ProjectType;

import java.time.LocalDate;
import java.util.List;

@Getter
public class PostCreateRequest {

    @NotBlank(message = "제목은 필수입니다.")
    private String title;

    private String description;

    private Difficulty difficulty;

    private ProjectType projectType;

    private LocalDate applicationDeadline;

    private LocalDate projectStartDate;

    private LocalDate projectEndDate;

    @NotEmpty(message = "모집 역할은 최소 1개 이상이어야 합니다.")
    @Valid
    private List<PostRoleRequest> roles;
}