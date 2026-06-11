package wooriteam.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wooriteam.common.ApiResponse;
import wooriteam.dto.request.ApplicationRequest;
import wooriteam.dto.response.ApplicationResponse;
import wooriteam.security.CustomUserDetails;
import wooriteam.service.ApplicationService;

import java.util.List;

@RestController
@RequestMapping("/api/posts/{postId}/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<ApiResponse<ApplicationResponse>> apply(
            @PathVariable Long postId,
            @Valid @RequestBody ApplicationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.apply(postId, request, userDetails.getUserId())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getApplications(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.getApplicationsByPost(postId, userDetails.getUserId())));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getMyApplication(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.getMyApplication(postId, userDetails.getUserId())));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateMyApplication(
            @PathVariable Long postId,
            @Valid @RequestBody ApplicationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.updateMyApplication(postId, request, userDetails.getUserId())));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> withdrawMyApplication(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        applicationService.withdrawMyApplication(postId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}