package wooriteam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wooriteam.dto.request.PasswordChangeRequest;
import wooriteam.dto.request.UserProfileRequest;
import wooriteam.dto.response.MyApplicationResponse;
import wooriteam.dto.response.PostSummaryResponse;
import wooriteam.dto.response.UserProfileResponse;
import wooriteam.entity.User;
import wooriteam.entity.UserProfile;
import wooriteam.exception.CustomException;
import wooriteam.exception.ErrorCode;
import wooriteam.repository.ApplicationRepository;
import wooriteam.repository.PostRepository;
import wooriteam.repository.UserProfileRepository;
import wooriteam.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyPageService {

    private final PostRepository postRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void changePassword(Long userId, PasswordChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.SAME_PASSWORD);
        }
        user.updatePassword(passwordEncoder.encode(request.getNewPassword()));
    }

    public List<PostSummaryResponse> getMyPosts(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return postRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(PostSummaryResponse::new)
                .collect(Collectors.toList());
    }

    public List<MyApplicationResponse> getMyApplications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return applicationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(MyApplicationResponse::new)
                .collect(Collectors.toList());
    }

    public UserProfileResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        UserProfile profile = userProfileRepository.findByUser(user).orElseGet(() ->
                UserProfile.builder().user(user).isPublic(false).build());
        return new UserProfileResponse(profile);
    }

    @Transactional
    public UserProfileResponse updateMyProfile(Long userId, UserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (request.isPublic() && (request.getContactEmail() == null || request.getContactEmail().isBlank())) {
            throw new CustomException(ErrorCode.EMAIL_REQUIRED_FOR_PUBLIC);
        }
        UserProfile profile = userProfileRepository.findByUser(user).orElseGet(() ->
                UserProfile.builder().user(user).isPublic(false).build());
        if (profile.getId() == null) {
            profile = UserProfile.builder()
                    .user(user)
                    .techStack(request.getTechStack())
                    .careerType(request.getCareerType())
                    .experience(request.getExperience())
                    .isPublic(request.isPublic())
                    .contactEmail(request.getContactEmail())
                    .build();
            userProfileRepository.save(profile);
        } else {
            profile.update(request.getTechStack(), request.getCareerType(), request.getExperience(), request.isPublic(), request.getContactEmail());
        }
        return new UserProfileResponse(profile);
    }
}