package wooriteam.dto.response;

import lombok.Getter;
import wooriteam.entity.Group;

@Getter
public class MyGroupResponse {
    private final Long id;
    private final String name;
    private final String description;
    private final String role;
    private final int memberCount;

    public MyGroupResponse(Group group, String role, int memberCount) {
        this.id = group.getId();
        this.name = group.getName();
        this.description = group.getDescription();
        this.role = role;
        this.memberCount = memberCount;
    }
}