package wooriteam.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wooriteam.common.ApiResponse;
import wooriteam.dto.response.PublicProfileDetailResponse;
import wooriteam.dto.response.PublicProfileSummaryResponse;
import wooriteam.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PublicProfileSummaryResponse>>> getPublicProfiles() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getPublicProfiles()));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<PublicProfileDetailResponse>> getPublicProfileDetail(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getPublicProfileDetail(userId)));
    }
}