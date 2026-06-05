package wooriteam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wooriteam.dto.request.PostCreateRequest;
import wooriteam.dto.request.PostUpdateRequest;
import wooriteam.dto.response.PostDetailResponse;
import wooriteam.dto.response.PostSummaryResponse;
import wooriteam.entity.Post;
import wooriteam.entity.PostRole;
import wooriteam.entity.User;
import wooriteam.enums.RoleType;
import wooriteam.exception.CustomException;
import wooriteam.exception.ErrorCode;
import wooriteam.repository.PostRepository;
import wooriteam.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostDetailResponse createPost(PostCreateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        Post post = Post.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .projectType(request.getProjectType())
                .build();
        request.getRoles().forEach(roleReq -> {
            PostRole role = PostRole.builder()
                    .post(post)
                    .roleType(roleReq.getRoleType())
                    .description(roleReq.getDescription())
                    .techStack(roleReq.getTechStack())
                    .build();
            post.getRoles().add(role);
        });
        return new PostDetailResponse(postRepository.save(post));
    }

    @Transactional(readOnly = true)
    public List<PostSummaryResponse> getPosts(RoleType roleType) {
        List<Post> posts = (roleType != null)
                ? postRepository.findByRoleType(roleType)
                : postRepository.findAllWithRoles();
        return posts.stream().map(PostSummaryResponse::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PostDetailResponse getPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        return new PostDetailResponse(post);
    }

    public PostDetailResponse updatePost(Long postId, PostUpdateRequest request, Long userId) {
        Post post = getPostOwnedBy(postId, userId);
        post.update(request.getTitle(), request.getDescription(), request.getDifficulty(), request.getProjectType());
        post.getRoles().clear();
        request.getRoles().forEach(roleReq -> {
            PostRole role = PostRole.builder()
                    .post(post)
                    .roleType(roleReq.getRoleType())
                    .description(roleReq.getDescription())
                    .techStack(roleReq.getTechStack())
                    .build();
            post.getRoles().add(role);
        });
        return new PostDetailResponse(post);
    }

    public void deletePost(Long postId, Long userId) {
        Post post = getPostOwnedBy(postId, userId);
        postRepository.delete(post);
    }

    public void closePost(Long postId, Long userId) {
        Post post = getPostOwnedBy(postId, userId);
        if (post.isClosed()) {
            throw new CustomException(ErrorCode.POST_ALREADY_CLOSED);
        }
        post.close();
    }

    private Post getPostOwnedBy(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        if (!post.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.POST_ACCESS_DENIED);
        }
        return post;
    }
}