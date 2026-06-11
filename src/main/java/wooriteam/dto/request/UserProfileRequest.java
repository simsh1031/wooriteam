package wooriteam.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import wooriteam.enums.CareerType;

@Getter
@NoArgsConstructor
public class UserProfileRequest {
    private String techStack;
    private CareerType careerType;
    private String experience;
    @JsonProperty("isPublic")
    private boolean isPublic;
    private String contactEmail;
}