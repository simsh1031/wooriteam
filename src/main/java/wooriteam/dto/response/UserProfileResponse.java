package wooriteam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import wooriteam.entity.UserProfile;
import wooriteam.enums.CareerType;

@Getter
public class UserProfileResponse {
    private final Long userId;
    private final String nickname;
    private final String email;
    private final String techStack;
    private final CareerType careerType;
    private final String experience;
    @JsonProperty("isPublic")
    private final boolean isPublic;
    private final String contactEmail;

    public UserProfileResponse(UserProfile profile) {
        this.userId = profile.getUser().getId();
        this.nickname = profile.getUser().getNickname();
        this.email = profile.getUser().getEmail();
        this.techStack = profile.getTechStack();
        this.careerType = profile.getCareerType();
        this.experience = profile.getExperience();
        this.isPublic = profile.isPublic();
        this.contactEmail = profile.getContactEmail();
    }
}