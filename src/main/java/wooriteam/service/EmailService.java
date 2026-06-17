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
import wooriteam.entity.Report;
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

    @Value("${app.mail.admin:${app.mail.from:}}")
    private String adminEmail;

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

    @Async
    public void sendReportEmail(Report report) {
        if (!mailEnabled) {
            return;
        }
        if (adminEmail == null || adminEmail.isBlank()) {
            return;
        }

        Post post = report.getPost();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(adminEmail);
        message.setSubject("[우리팀] 신고가 접수되었습니다 - " + report.getTitle());
        message.setText(
                "새로운 신고가 접수되었습니다.\n\n"
                        + "- 신고 제목: " + report.getTitle() + "\n"
                        + "- 신고 대상 공고: " + post.getTitle() + " (postId=" + post.getId() + ")\n"
                        + "- 신고 내용:\n" + report.getContent()
        );

        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("신고 알림 메일 발송 실패 (reportId={})", report.getId(), e);
        }
    }
}
