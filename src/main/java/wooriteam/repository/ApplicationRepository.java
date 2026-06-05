package wooriteam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wooriteam.entity.Application;
import wooriteam.entity.Post;
import wooriteam.entity.User;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByPost(Post post);
    List<Application> findByUserOrderByCreatedAtDesc(User user);
    boolean existsByPostAndRoleIdAndUser(wooriteam.entity.Post post, Long roleId, User user);
    void deleteByUser(User user);
    void deleteByPostIn(List<Post> posts);
}