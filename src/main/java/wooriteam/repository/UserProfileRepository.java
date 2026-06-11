package wooriteam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import wooriteam.entity.User;
import wooriteam.entity.UserProfile;

import java.util.List;
import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUser(User user);

    Optional<UserProfile> findByUserId(Long userId);

    @Query("SELECT up FROM UserProfile up JOIN FETCH up.user WHERE up.isPublic = true ORDER BY up.id DESC")
    List<UserProfile> findAllPublic();
}