package wooriteam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wooriteam.dto.request.GroupCreateRequest;
import wooriteam.dto.request.GroupJoinRequest;
import wooriteam.dto.response.GroupDetailResponse;
import wooriteam.dto.response.GroupMemberResponse;
import wooriteam.dto.response.GroupSummaryResponse;
import wooriteam.dto.response.MyGroupResponse;
import wooriteam.entity.Group;
import wooriteam.entity.GroupMember;
import wooriteam.entity.User;
import wooriteam.enums.GroupMemberStatus;
import wooriteam.exception.CustomException;
import wooriteam.exception.ErrorCode;
import wooriteam.repository.GroupMemberRepository;
import wooriteam.repository.GroupRepository;
import wooriteam.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupService {

    private static final int MAX_JOINED_GROUPS = 3;

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public GroupDetailResponse createGroup(GroupCreateRequest request, Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (groupRepository.existsByOwner(owner)) {
            throw new CustomException(ErrorCode.GROUP_ALREADY_OWNED);
        }
        Group group = groupRepository.save(Group.builder()
                .owner(owner)
                .name(request.getName())
                .description(request.getDescription())
                .build());
        return buildDetail(group, userId);
    }

    @Transactional(readOnly = true)
    public List<GroupSummaryResponse> getGroups() {
        return groupRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(group -> new GroupSummaryResponse(group, memberCount(group)))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GroupDetailResponse getGroupDetail(Long groupId, Long userId) {
        return buildDetail(getGroup(groupId), userId);
    }

    public void joinGroup(Long groupId, Long userId, GroupJoinRequest request) {
        Group group = getGroup(groupId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (group.getOwner().getId().equals(userId)) {
            throw new CustomException(ErrorCode.GROUP_OWNER_CANNOT_JOIN);
        }
        if (groupMemberRepository.existsByGroupAndUser(group, user)) {
            throw new CustomException(ErrorCode.GROUP_ALREADY_MEMBER);
        }
        if (groupMemberRepository.countByUser(user) >= MAX_JOINED_GROUPS) {
            throw new CustomException(ErrorCode.GROUP_JOIN_LIMIT_EXCEEDED);
        }
        groupMemberRepository.save(GroupMember.builder()
                .group(group)
                .user(user)
                .status(GroupMemberStatus.PENDING)
                .introduction(request.getIntroduction())
                .experience(request.getExperience())
                .portfolioLink(request.getPortfolioLink())
                .email(request.getEmail())
                .build());
    }

    public void approveMember(Long groupId, Long memberId, Long ownerUserId) {
        Group group = getGroupOwnedBy(groupId, ownerUserId);
        GroupMember member = groupMemberRepository.findByIdAndGroup(memberId, group)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_MEMBER_NOT_FOUND));
        member.approve();
    }

    public void removeMember(Long groupId, Long memberId, Long ownerUserId) {
        Group group = getGroupOwnedBy(groupId, ownerUserId);
        GroupMember member = groupMemberRepository.findByIdAndGroup(memberId, group)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_MEMBER_NOT_FOUND));
        groupMemberRepository.delete(member);
    }

    @Transactional(readOnly = true)
    public List<MyGroupResponse> getMyGroups(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        List<MyGroupResponse> result = new ArrayList<>();
        groupRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(g -> g.getOwner().getId().equals(userId))
                .forEach(g -> result.add(new MyGroupResponse(g, "OWNER", memberCount(g))));
        groupMemberRepository.findByUserAndStatus(user, GroupMemberStatus.APPROVED)
                .forEach(m -> result.add(new MyGroupResponse(m.getGroup(), "MEMBER", memberCount(m.getGroup()))));
        return result;
    }

    @Transactional(readOnly = true)
    public Group getGroup(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Group getGroupForPost(Long groupId, Long userId) {
        Group group = getGroup(groupId);
        if (!isOwnerOrApprovedMember(group, userId)) {
            throw new CustomException(ErrorCode.GROUP_ACCESS_DENIED);
        }
        return group;
    }

    @Transactional(readOnly = true)
    public void requireMembership(Group group, Long userId) {
        if (!isOwnerOrApprovedMember(group, userId)) {
            throw new CustomException(ErrorCode.GROUP_MEMBERSHIP_REQUIRED);
        }
    }

    private boolean isOwnerOrApprovedMember(Group group, Long userId) {
        if (group.getOwner().getId().equals(userId)) {
            return true;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return groupMemberRepository.findByGroupAndUser(group, user)
                .map(m -> m.getStatus() == GroupMemberStatus.APPROVED)
                .orElse(false);
    }

    private Group getGroupOwnedBy(Long groupId, Long userId) {
        Group group = getGroup(groupId);
        if (!group.getOwner().getId().equals(userId)) {
            throw new CustomException(ErrorCode.GROUP_ACCESS_DENIED);
        }
        return group;
    }

    private int memberCount(Group group) {
        return 1 + (int) groupMemberRepository.countByGroupAndStatus(group, GroupMemberStatus.APPROVED);
    }

    private GroupDetailResponse buildDetail(Group group, Long userId) {
        boolean isOwner = group.getOwner().getId().equals(userId);
        String myStatus;
        if (isOwner) {
            myStatus = "OWNER";
        } else {
            User user = userRepository.findById(userId).orElse(null);
            myStatus = (user == null) ? "NONE" : groupMemberRepository.findByGroupAndUser(group, user)
                    .map(m -> m.getStatus().name())
                    .orElse("NONE");
        }
        List<GroupMemberResponse> approvedMembers = groupMemberRepository
                .findByGroupAndStatusOrderByJoinedAtAsc(group, GroupMemberStatus.APPROVED).stream()
                .map(GroupMemberResponse::new)
                .collect(Collectors.toList());
        List<GroupMemberResponse> pendingMembers = isOwner
                ? groupMemberRepository.findByGroupAndStatusOrderByJoinedAtAsc(group, GroupMemberStatus.PENDING).stream()
                    .map(GroupMemberResponse::new)
                    .collect(Collectors.toList())
                : null;
        return new GroupDetailResponse(group, memberCount(group), myStatus, approvedMembers, pendingMembers);
    }
}
