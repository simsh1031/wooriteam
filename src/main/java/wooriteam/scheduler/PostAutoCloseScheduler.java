package wooriteam.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import wooriteam.entity.Post;
import wooriteam.repository.PostRepository;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PostAutoCloseScheduler {

    private final PostRepository postRepository;

    // 매일 자정에 마감일이 지난 공고 자동 마감
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void autoClosePosts() {
        List<Post> expiredPosts = postRepository.findByClosedFalseAndApplicationDeadlineBefore(LocalDate.now());
        expiredPosts.forEach(Post::close);
        if (!expiredPosts.isEmpty()) {
            log.info("자동 마감 처리: {}건", expiredPosts.size());
        }
    }
}
