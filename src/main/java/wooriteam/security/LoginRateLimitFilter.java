package wooriteam.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Deque;
import java.util.LinkedList;
import java.util.concurrent.ConcurrentHashMap;

public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60_000;
    private static final String LOGIN_PATH = "/api/auth/login";

    private final ConcurrentHashMap<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if ("POST".equals(request.getMethod()) && LOGIN_PATH.equals(request.getServletPath())) {
            String ip = resolveClientIp(request);
            if (isRateLimited(ip)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private boolean isRateLimited(String ip) {
        long now = System.currentTimeMillis();
        Deque<Long> window = attempts.compute(ip, (k, v) -> {
            Deque<Long> deque = (v != null) ? v : new LinkedList<>();
            while (!deque.isEmpty() && now - deque.peekFirst() > WINDOW_MS) {
                deque.pollFirst();
            }
            deque.addLast(now);
            return deque;
        });
        return window.size() > MAX_ATTEMPTS;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}