package wooriteam.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wooriteam.common.ApiResponse;
import wooriteam.dto.request.PostCreateRequest;
import wooriteam.dto.request.PostUpdateRequest;
import wooriteam.dto.response.PostDetailResponse;
import wooriteam.dto.response.PostSummaryResponse;
import wooriteam.enums.Difficulty;
import wooriteam.enums.ProjectType;
import wooriteam.enums.RoleType;
import wooriteam.security.CustomUserDetails;
import wooriteam.service.PostService;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PostSummaryResponse>>> getPosts(
            @RequestParam(required = false) RoleType role,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) ProjectType projectType,
            @RequestParam(required = false) List<String> techStack,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getPosts(role, difficulty, projectType, techStack, keyword)));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostDetailResponse>> getPost(@PathVariable Long postId) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getPost(postId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostDetailResponse>> createPost(
            @Valid @RequestBody PostCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(postService.createPost(request, userDetails.getUserId())));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostDetailResponse>> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(postService.updatePost(postId, request, userDetails.getUserId())));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        postService.deletePost(postId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{postId}/close")
    public ResponseEntity<ApiResponse<Void>> closePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        postService.closePost(postId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}