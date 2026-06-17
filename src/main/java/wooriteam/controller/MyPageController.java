package wooriteam.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wooriteam.common.ApiResponse;
import wooriteam.dto.request.PasswordChangeRequest;
import wooriteam.dto.request.UserProfileRequest;
import wooriteam.dto.response.MyApplicationResponse;
import wooriteam.dto.response.PostSummaryResponse;
import wooriteam.dto.response.UserProfileResponse;
import wooriteam.security.CustomUserDetails;
import wooriteam.service.BookmarkService;
import wooriteam.service.MyPageService;

import java.util.List;

@RestController
@RequestMapping("/api/my")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;
    private final BookmarkService bookmarkService;

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<List<PostSummaryResponse>>> getMyPosts(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(myPageService.getMyPosts(userDetails.getUserId())));
    }

    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<List<MyApplicationResponse>>> getMyApplications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(myPageService.getMyApplications(userDetails.getUserId())));
    }

    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PasswordChangeRequest request) {
        myPageService.changePassword(userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(myPageService.getMyProfile(userDetails.getUserId())));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(myPageService.updateMyProfile(userDetails.getUserId(), request)));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<ApiResponse<List<PostSummaryResponse>>> getMyBookmarks(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(bookmarkService.getMyBookmarks(userDetails.getUserId())));
    }
}