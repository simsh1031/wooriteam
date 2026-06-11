package wooriteam.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private PostRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String motivation;

    @Column(name = "tech_stack")
    private String techStack;

    private String experience;

    private String contact;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "withdrawn", nullable = false)
    private boolean withdrawn = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @Builder
    public Application(Post post, PostRole role, User user, String motivation, String techStack, String experience, String contact) {
        this.post = post;
        this.role = role;
        this.user = user;
        this.motivation = motivation;
        this.techStack = techStack;
        this.experience = experience;
        this.contact = contact;
    }

    public void update(PostRole role, String motivation, String techStack, String experience, String contact) {
        this.role = role;
        this.motivation = motivation;
        this.techStack = techStack;
        this.experience = experience;
        this.contact = contact;
        this.withdrawn = false;
    }

    public void withdraw() {
        this.withdrawn = true;
    }
}