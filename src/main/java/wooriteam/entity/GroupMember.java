package wooriteam.entity;

import jakarta.persistence.*;
import lombok.*;
import wooriteam.enums.GroupMemberStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_members", uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "user_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupMemberStatus status;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(name = "portfolio_link")
    private String portfolioLink;

    private String email;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    @Builder
    public GroupMember(Group group, User user, GroupMemberStatus status,
                        String introduction, String experience, String portfolioLink, String email) {
        this.group = group;
        this.user = user;
        this.status = status;
        this.introduction = introduction;
        this.experience = experience;
        this.portfolioLink = portfolioLink;
        this.email = email;
    }

    public void approve() {
        this.status = GroupMemberStatus.APPROVED;
    }
}