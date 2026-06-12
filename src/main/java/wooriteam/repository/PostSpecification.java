package wooriteam.repository;

import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import wooriteam.entity.Post;
import wooriteam.entity.PostRole;
import wooriteam.enums.Difficulty;
import wooriteam.enums.ProjectType;
import wooriteam.enums.RoleType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PostSpecification {

    public static Specification<Post> withFilters(
            RoleType roleType,
            Difficulty difficulty,
            ProjectType projectType,
            List<String> techStacks,
            String keyword) {
        return (root, query, cb) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.isFalse(root.get("closed")));
            predicates.add(cb.or(
                    cb.isNull(root.get("applicationDeadline")),
                    cb.greaterThanOrEqualTo(root.get("applicationDeadline"), LocalDate.now())
            ));

            Join<Post, PostRole> roleJoin = root.join("roles", JoinType.INNER);

            if (roleType != null) {
                predicates.add(cb.equal(roleJoin.get("roleType"), roleType));
            }

            if (difficulty != null) {
                predicates.add(cb.equal(root.get("difficulty"), difficulty));
            }

            if (projectType != null) {
                predicates.add(cb.equal(root.get("projectType"), projectType));
            }

            if (techStacks != null && !techStacks.isEmpty()) {
                List<Predicate> tsPredicates = new ArrayList<>();
                for (String ts : techStacks) {
                    tsPredicates.add(cb.like(cb.lower(roleJoin.get("techStack")), "%" + ts.toLowerCase() + "%"));
                }
                predicates.add(cb.or(tsPredicates.toArray(new Predicate[0])));
            }

            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.toLowerCase() + "%";
                Predicate titlePred = cb.like(cb.lower(root.get("title")), kw);
                Predicate descPred = cb.like(cb.lower(root.get("description")), kw);
                Predicate tsPred = cb.like(cb.lower(roleJoin.get("techStack")), kw);
                predicates.add(cb.or(titlePred, descPred, tsPred));
            }

            query.orderBy(cb.desc(root.get("createdAt")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}