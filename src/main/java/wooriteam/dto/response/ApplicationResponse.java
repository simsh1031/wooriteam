package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.Application;
import wooriteam.enums.RoleType;

import java.time.LocalDateTime;

@Getter
public class ApplicationResponse {
    private final Long id;
    private final Long roleId;
    private final RoleType roleType;
    private final String applicantNickname;
    private final String motivation;
    private final String techStack;
    private final String experience;
    private final String contact;
    private final LocalDateTime createdAt;
    private final boolean withdrawn;

    public ApplicationResponse(Application application) {
        this.id = application.getId();
        this.roleId = application.getRole().getId();
        this.roleType = application.getRole().getRoleType();
        this.applicantNickname = application.getUser().getNickname();
        this.motivation = application.getMotivation();
        this.techStack = application.getTechStack();
        this.experience = application.getExperience();
        this.contact = application.getContact();
        this.createdAt = application.getCreatedAt();
        this.withdrawn = application.isWithdrawn();
    }
}