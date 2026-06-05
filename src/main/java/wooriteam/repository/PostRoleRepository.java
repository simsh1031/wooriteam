package wooriteam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wooriteam.entity.Post;
import wooriteam.entity.PostRole;

import java.util.List;

public interface PostRoleRepository extends JpaRepository<PostRole, Long> {
    List<PostRole> findByPost(Post post);
}