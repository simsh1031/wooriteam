package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.Group;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class GroupDetailResponse {
    private final Long id;
    private final String name;
    private final String description;
    private final Long ownerId;
    private final String ownerNickname;
    private final int memberCount;
    private final LocalDateTime createdAt;
    private final String myStatus;
    private final List<GroupMemberResponse> members;
    private final List<GroupMemberResponse> pendingMembers;

    public GroupDetailResponse(Group group, int memberCount, String myStatus,
                                List<GroupMemberResponse> members, List<GroupMemberResponse> pendingMembers) {
        this.id = group.getId();
        this.name = group.getName();
        this.description = group.getDescription();
        this.ownerId = group.getOwner().getId();
        this.ownerNickname = group.getOwner().getNickname();
        this.memberCount = memberCount;
        this.createdAt = group.getCreatedAt();
        this.myStatus = myStatus;
        this.members = members;
        this.pendingMembers = pendingMembers;
    }
}