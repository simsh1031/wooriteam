package wooriteam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wooriteam.dto.response.PublicProfileDetailResponse;
import wooriteam.dto.response.PublicProfileSummaryResponse;
import wooriteam.entity.UserProfile;
import wooriteam.exception.CustomException;
import wooriteam.exception.ErrorCode;
import wooriteam.repository.UserProfileRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserProfileRepository userProfileRepository;

    public List<PublicProfileSummaryResponse> getPublicProfiles() {
        return userProfileRepository.findAllPublic().stream()
                .map(PublicProfileSummaryResponse::new)
                .collect(Collectors.toList());
    }

    public PublicProfileDetailResponse getPublicProfileDetail(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PROFILE_NOT_FOUND));
        if (!profile.isPublic()) {
            throw new CustomException(ErrorCode.PROFILE_NOT_PUBLIC);
        }
        return new PublicProfileDetailResponse(profile);
    }
}