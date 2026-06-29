package wooriteam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wooriteam.entity.Bookmark;
import wooriteam.entity.Post;
import wooriteam.entity.User;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    Optional<Bookmark> findByUserAndPost(User user, Post post);
    List<Bookmark> findByUserOrderByCreatedAtDesc(User user);
    boolean existsByUserAndPost(User user, Post post);
}
