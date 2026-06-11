package wooriteam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wooriteam.entity.Post;
import wooriteam.entity.User;
import wooriteam.enums.RoleType;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

    List<Post> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT DISTINCT p FROM Post p JOIN p.roles r WHERE r.roleType = :roleType ORDER BY p.createdAt DESC")
    List<Post> findByRoleType(@Param("roleType") RoleType roleType);

    @Query("SELECT DISTINCT p FROM Post p JOIN p.roles r ORDER BY p.createdAt DESC")
    List<Post> findAllWithRoles();
}