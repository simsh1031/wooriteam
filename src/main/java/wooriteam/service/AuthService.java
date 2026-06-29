package wooriteam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wooriteam.dto.request.LoginRequest;
import wooriteam.dto.request.SignUpRequest;
import wooriteam.dto.response.LoginResponse;
import wooriteam.entity.User;
import wooriteam.exception.CustomException;
import wooriteam.exception.ErrorCode;
import wooriteam.entity.Post;
import wooriteam.repository.ApplicationRepository;
import wooriteam.repository.PostRepository;
import wooriteam.repository.UserRepository;

import java.util.List;
import wooriteam.security.JwtProvider;
import wooriteam.security.TokenBlacklistService;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ApplicationRepository applicationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final TokenBlacklistService tokenBlacklistService;

    public void signUp(SignUpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATED);
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .build();
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }
        String token = jwtProvider.generateToken(user.getId(), user.getEmail());
        return new LoginResponse(token, user.getNickname());
    }

    public void logout(String token) {
        if (jwtProvider.validateToken(token)) {
            tokenBlacklistService.blacklist(token, jwtProvider.getExpiration(token));
        }
    }

    public void withdraw(Long userId, String token) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 내가 지원한 내역 삭제
        applicationRepository.deleteByUser(user);

        // 내 공고에 달린 지원 내역 삭제 → 공고 삭제 (cascade로 PostRole 자동 삭제)
        List<Post> myPosts = postRepository.findByUserOrderByCreatedAtDesc(user);
        if (!myPosts.isEmpty()) {
            applicationRepository.deleteByPostIn(myPosts);
            postRepository.deleteAll(myPosts);
        }

        userRepository.delete(user);

        if (token != null && jwtProvider.validateToken(token)) {
            tokenBlacklistService.blacklist(token, jwtProvider.getExpiration(token));
        }
    }
}