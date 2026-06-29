package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.UserProfile;
import wooriteam.enums.CareerType;

@Getter
public class PublicProfileSummaryResponse {
    private final Long userId;
    private final String nickname;
    private final String techStack;
    private final CareerType careerType;

    public PublicProfileSummaryResponse(UserProfile profile) {
        this.userId = profile.getUser().getId();
        this.nickname = profile.getUser().getNickname();
        this.techStack = profile.getTechStack();
        this.careerType = profile.getCareerType();
    }
}