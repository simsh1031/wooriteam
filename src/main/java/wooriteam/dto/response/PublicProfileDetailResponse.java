package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.UserProfile;
import wooriteam.enums.CareerType;

@Getter
public class PublicProfileDetailResponse {
    private final Long userId;
    private final String nickname;
    private final String email;
    private final String techStack;
    private final CareerType careerType;
    private final String experience;

    public PublicProfileDetailResponse(UserProfile profile) {
        this.userId = profile.getUser().getId();
        this.nickname = profile.getUser().getNickname();
        this.email = profile.getContactEmail();
        this.techStack = profile.getTechStack();
        this.careerType = profile.getCareerType();
        this.experience = profile.getExperience();
    }
}