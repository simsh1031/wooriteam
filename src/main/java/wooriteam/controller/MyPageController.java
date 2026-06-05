package wooriteam.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wooriteam.common.ApiResponse;
import wooriteam.dto.response.MyApplicationResponse;
import wooriteam.dto.response.PostSummaryResponse;
import wooriteam.security.CustomUserDetails;
import wooriteam.service.MyPageService;

import java.util.List;

@RestController
@RequestMapping("/api/my")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;

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
}