package com.urlshortener.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, RateBucket> apiBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RateBucket> authBuckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int API_MAX = 150;
    private static final int AUTH_MAX = 30;
    private static final long WINDOW_MS = 15 * 60 * 1000L; 

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        boolean isAuthPath = path.startsWith("/api/auth/") || 
                           (path.equals("/api/urls") && "POST".equalsIgnoreCase(request.getMethod()));
        
        if (isAuthPath) {
            if (!checkRateLimit(authBuckets, clientIp + ":auth", AUTH_MAX)) {
                sendRateLimitResponse(response, "Too many authentication or creation attempts. Please try again after 15 minutes");
                return;
            }
        }

        if (!checkRateLimit(apiBuckets, clientIp + ":api", API_MAX)) {
            sendRateLimitResponse(response, "Too many requests from this IP, please try again after 15 minutes");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkRateLimit(ConcurrentHashMap<String, RateBucket> buckets, String key, int maxRequests) {
        long now = System.currentTimeMillis();
        RateBucket bucket = buckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart > WINDOW_MS) {
                return new RateBucket(now, 1);
            }
            existing.count++;
            return existing;
        });
        return bucket.count <= maxRequests;
    }

    private void sendRateLimitResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(), Map.of(
            "success", false,
            "error", message
        ));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateBucket {
        long windowStart;
        int count;
        RateBucket(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
