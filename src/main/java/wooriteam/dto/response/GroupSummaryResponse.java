package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.Group;

import java.time.LocalDateTime;

@Getter
public class GroupSummaryResponse {
    private final Long id;
    private final String name;
    private final String description;
    private final Long ownerId;
    private final String ownerNickname;
    private final int memberCount;
    private final LocalDateTime createdAt;

    public GroupSummaryResponse(Group group, int memberCount) {
        this.id = group.getId();
        this.name = group.getName();
        this.description = group.getDescription();
        this.ownerId = group.getOwner().getId();
        this.ownerNickname = group.getOwner().getNickname();
        this.memberCount = memberCount;
        this.createdAt = group.getCreatedAt();
    }
}