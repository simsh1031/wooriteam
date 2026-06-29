package wooriteam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wooriteam.dto.request.ReportRequest;
import wooriteam.entity.Post;
import wooriteam.entity.Report;
import wooriteam.exception.CustomException;
import wooriteam.exception.ErrorCode;
import wooriteam.repository.PostRepository;
import wooriteam.repository.ReportRepository;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final EmailService emailService;

    public void createReport(ReportRequest request) {
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));

        Report report = Report.builder()
                .post(post)
                .title(request.getTitle())
                .content(request.getContent())
                .build();
        reportRepository.save(report);

        emailService.sendReportEmail(report);
    }
}
