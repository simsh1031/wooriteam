package wooriteam.entity;

import jakarta.persistence.*;
import lombok.*;
import wooriteam.enums.CareerType;

@Entity
@Table(name = "user_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "tech_stack", columnDefinition = "TEXT")
    private String techStack;

    @Enumerated(EnumType.STRING)
    @Column(name = "career_type")
    private CareerType careerType;

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @Column(name = "contact_email")
    private String contactEmail;

    @Builder
    public UserProfile(User user, String techStack, CareerType careerType, String experience, boolean isPublic, String contactEmail) {
        this.user = user;
        this.techStack = techStack;
        this.careerType = careerType;
        this.experience = experience;
        this.isPublic = isPublic;
        this.contactEmail = contactEmail;
    }

    public void update(String techStack, CareerType careerType, String experience, boolean isPublic, String contactEmail) {
        this.techStack = techStack;
        this.careerType = careerType;
        this.experience = experience;
        this.isPublic = isPublic;
        this.contactEmail = contactEmail;
    }
}
