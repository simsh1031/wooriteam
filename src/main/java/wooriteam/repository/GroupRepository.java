package wooriteam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wooriteam.entity.Group;
import wooriteam.entity.User;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    boolean existsByOwner(User owner);
    List<Group> findAllByOrderByCreatedAtDesc();
}