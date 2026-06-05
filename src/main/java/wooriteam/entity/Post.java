package wooriteam.entity;

import jakarta.persistence.*;
import lombok.*;
import wooriteam.enums.Difficulty;
import wooriteam.enums.ProjectType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(name = "project_type")
    private ProjectType projectType;

    @Column(name = "is_closed", nullable = false)
    private boolean closed = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostRole> roles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @Builder
    public Post(User user, String title, String description, Difficulty difficulty, ProjectType projectType) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.difficulty = difficulty;
        this.projectType = projectType;
    }

    public void update(String title, String description, Difficulty difficulty, ProjectType projectType) {
        this.title = title;
        this.description = description;
        this.difficulty = difficulty;
        this.projectType = projectType;
    }

    public void close() {
        this.closed = true;
    }
}