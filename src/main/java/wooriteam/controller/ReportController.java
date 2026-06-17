package wooriteam.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wooriteam.common.ApiResponse;
import wooriteam.dto.request.ReportRequest;
import wooriteam.service.ReportService;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createReport(@Valid @RequestBody ReportRequest request) {
        reportService.createReport(request);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
