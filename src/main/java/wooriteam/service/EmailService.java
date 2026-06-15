package wooriteam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import wooriteam.entity.Application;
import wooriteam.entity.Post;
import wooriteam.entity.User;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:}")
    private String from;

    @Async
    public void sendNewApplicationEmail(Post post, Application application) {
        if (!mailEnabled) {
            return;
        }
        User owner = post.getUser();
        if (owner.getEmail() == null || owner.getEmail().isBlank()) {
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(owner.getEmail());
        message.setSubject("[우리팀] '" + post.getTitle() + "' 공고에 새 지원자가 있습니다");
        message.setText(
                "회원님이 작성한 공고 '" + post.getTitle() + "'에 새로운 지원이 도착했습니다.\n\n"
                        + "- 지원자: " + application.getUser().getNickname() + "\n"
                        + "- 모집 역할: " + application.getRole().getRoleType() + "\n\n"
                        + "지원자 목록은 마이페이지에서 확인할 수 있습니다."
        );

        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("지원 알림 메일 발송 실패 (postId={}, to={})", post.getId(), owner.getEmail(), e);
        }
    }
}
