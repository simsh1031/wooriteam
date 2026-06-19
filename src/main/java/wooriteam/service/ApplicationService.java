package wooriteam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wooriteam.dto.request.ApplicationRequest;
import wooriteam.dto.response.ApplicationResponse;
import wooriteam.entity.Application;
import wooriteam.entity.Post;
import wooriteam.entity.PostRole;
import wooriteam.entity.User;
import wooriteam.exception.CustomException;
import wooriteam.exception.ErrorCode;
import wooriteam.repository.ApplicationRepository;
import wooriteam.repository.PostRepository;
import wooriteam.repository.PostRoleRepository;
import wooriteam.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final PostRepository postRepository;
    private final PostRoleRepository postRoleRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final GroupService groupService;

    public ApplicationResponse apply(Long postId, ApplicationRequest request, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        if (post.getGroup() != null) {
            groupService.requireMembership(post.getGroup(), userId);
        }
        PostRole role = postRoleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new CustomException(ErrorCode.ROLE_NOT_FOUND));
        if (!role.getPost().getId().equals(postId)) {
            throw new CustomException(ErrorCode.ROLE_NOT_IN_POST);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Application application = applicationRepository.findByPostAndUser(post, user).orElse(null);
        if (application != null) {
            if (!application.isWithdrawn()) {
                throw new CustomException(ErrorCode.ALREADY_APPLIED);
            }
            application.update(role, request.getMotivation(), request.getTechStack(), request.getExperience(), request.getContact());
            emailService.sendNewApplicationEmail(post, application);
            return new ApplicationResponse(application);
        }

        application = Application.builder()
                .post(post)
                .role(role)
                .user(user)
                .motivation(request.getMotivation())
                .techStack(request.getTechStack())
                .experience(request.getExperience())
                .contact(request.getContact())
                .build();
        application = applicationRepository.save(application);
        emailService.sendNewApplicationEmail(post, application);
        return new ApplicationResponse(application);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsByPost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        if (!post.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.APPLICATION_ACCESS_DENIED);
        }
        return applicationRepository.findByPostAndWithdrawnFalse(post).stream()
                .map(ApplicationResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApplicationResponse getMyApplication(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return applicationRepository.findByPostAndUser(post, user)
                .map(ApplicationResponse::new)
                .orElse(null);
    }

    public ApplicationResponse updateMyApplication(Long postId, ApplicationRequest request, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        if (post.getGroup() != null) {
            groupService.requireMembership(post.getGroup(), userId);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        Application application = applicationRepository.findByPostAndUser(post, user)
                .filter(a -> !a.isWithdrawn())
                .orElseThrow(() -> new CustomException(ErrorCode.APPLICATION_NOT_FOUND));
        PostRole role = postRoleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new CustomException(ErrorCode.ROLE_NOT_FOUND));
        if (!role.getPost().getId().equals(postId)) {
            throw new CustomException(ErrorCode.ROLE_NOT_IN_POST);
        }
        application.update(role, request.getMotivation(), request.getTechStack(), request.getExperience(), request.getContact());
        return new ApplicationResponse(application);
    }

    public void withdrawMyApplication(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        Application application = applicationRepository.findByPostAndUser(post, user)
                .filter(a -> !a.isWithdrawn())
                .orElseThrow(() -> new CustomException(ErrorCode.APPLICATION_NOT_FOUND));
        application.withdraw();
    }
}