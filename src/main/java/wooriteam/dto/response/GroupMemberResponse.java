package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.GroupMember;

import java.time.LocalDateTime;

@Getter
public class GroupMemberResponse {
    private final Long id;
    private final Long userId;
    private final String nickname;
    private final String status;
    private final LocalDateTime joinedAt;
    private final String introduction;
    private final String experience;
    private final String portfolioLink;
    private final String email;

    public GroupMemberResponse(GroupMember member) {
        this.id = member.getId();
        this.userId = member.getUser().getId();
        this.nickname = member.getUser().getNickname();
        this.status = member.getStatus().name();
        this.joinedAt = member.getJoinedAt();
        this.introduction = member.getIntroduction();
        this.experience = member.getExperience();
        this.portfolioLink = member.getPortfolioLink();
        this.email = member.getEmail();
    }
}