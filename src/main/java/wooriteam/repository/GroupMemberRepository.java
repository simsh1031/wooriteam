package wooriteam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wooriteam.entity.Group;
import wooriteam.entity.GroupMember;
import wooriteam.entity.User;
import wooriteam.enums.GroupMemberStatus;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    boolean existsByGroupAndUser(Group group, User user);
    Optional<GroupMember> findByGroupAndUser(Group group, User user);
    Optional<GroupMember> findByIdAndGroup(Long id, Group group);
    long countByUser(User user);
    long countByGroupAndStatus(Group group, GroupMemberStatus status);
    List<GroupMember> findByGroupAndStatusOrderByJoinedAtAsc(Group group, GroupMemberStatus status);
    List<GroupMember> findByUserAndStatus(User user, GroupMemberStatus status);
}