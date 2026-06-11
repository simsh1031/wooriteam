package wooriteam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wooriteam.entity.Application;
import wooriteam.entity.Post;
import wooriteam.entity.User;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByPostAndWithdrawnFalse(Post post);
    List<Application> findByUserAndWithdrawnFalseOrderByCreatedAtDesc(User user);
    Optional<Application> findByPostAndUser(Post post, User user);
    void deleteByUser(User user);
    void deleteByPostIn(List<Post> posts);
}