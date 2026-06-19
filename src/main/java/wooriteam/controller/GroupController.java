package wooriteam.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wooriteam.common.ApiResponse;
import wooriteam.dto.request.GroupCreateRequest;
import wooriteam.dto.request.GroupJoinRequest;
import wooriteam.dto.response.GroupDetailResponse;
import wooriteam.dto.response.GroupSummaryResponse;
import wooriteam.dto.response.PostSummaryResponse;
import wooriteam.security.CustomUserDetails;
import wooriteam.service.GroupService;
import wooriteam.service.PostService;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final PostService postService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GroupSummaryResponse>>> getGroups() {
        return ResponseEntity.ok(ApiResponse.ok(groupService.getGroups()));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupDetailResponse>> getGroup(
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(groupService.getGroupDetail(groupId, userDetails.getUserId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GroupDetailResponse>> createGroup(
            @Valid @RequestBody GroupCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(groupService.createGroup(request, userDetails.getUserId())));
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<ApiResponse<Void>> joinGroup(
            @PathVariable Long groupId,
            @Valid @RequestBody GroupJoinRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        groupService.joinGroup(groupId, userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{groupId}/members/{memberId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        groupService.approveMember(groupId, memberId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        groupService.removeMember(groupId, memberId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/{groupId}/posts")
    public ResponseEntity<ApiResponse<List<PostSummaryResponse>>> getGroupPosts(@PathVariable Long groupId) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getPostsByGroup(groupId)));
    }
}