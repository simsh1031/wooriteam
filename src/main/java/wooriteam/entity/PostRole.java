package wooriteam.entity;

import jakarta.persistence.*;
import lombok.*;
import wooriteam.enums.RoleType;

@Entity
@Table(name = "post_roles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false)
    private RoleType roleType;

    private String description;

    @Column(name = "tech_stack")
    private String techStack;

    @Builder
    public PostRole(Post post, RoleType roleType, String description, String techStack) {
        this.post = post;
        this.roleType = roleType;
        this.description = description;
        this.techStack = techStack;
    }

    public void update(String description, String techStack) {
        this.description = description;
        this.techStack = techStack;
    }
}