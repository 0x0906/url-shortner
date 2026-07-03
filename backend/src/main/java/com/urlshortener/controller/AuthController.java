package com.urlshortener.controller;

import com.urlshortener.dto.request.ChangePasswordRequest;
import com.urlshortener.dto.request.ForgotPasswordRequest;
import com.urlshortener.dto.request.LoginRequest;
import com.urlshortener.dto.request.RegisterRequest;
import com.urlshortener.dto.request.ResetPasswordRequest;
import com.urlshortener.entity.User;
import com.urlshortener.exception.ApiException;
import com.urlshortener.repository.SessionRepository;
import com.urlshortener.repository.UserRepository;
import com.urlshortener.service.AuthService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${client.url}")
    private String clientUrl;

    private Cookie createCookie(String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setSecure(false); 
        cookie.setMaxAge(maxAge);
        return cookie;
    }

    private void setTokenCookie(HttpServletResponse response, String accessToken) {
        response.addCookie(createCookie("token", accessToken, 15 * 60)); 
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        response.addCookie(createCookie("refreshToken", refreshToken, 7 * 24 * 60 * 60)); 
    }

    private void clearCookies(HttpServletResponse response) {
        response.addCookie(createCookie("token", "none", 10));
        response.addCookie(createCookie("refreshToken", "none", 10));
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals(name)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        Map<String, Object> userInfo = authService.registerUser(
                request.getName(), request.getEmail(), request.getPassword());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Registration successful! Please check your email to verify your account.");
        response.put("user", userInfo);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   HttpServletRequest httpRequest,
                                   HttpServletResponse httpResponse) {
        String userAgent = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        Map<String, Object> result = authService.loginUser(
                request.getEmail(), request.getPassword(), userAgent, ipAddress);

        setTokenCookie(httpResponse, (String) result.get("accessToken"));
        setRefreshTokenCookie(httpResponse, (String) result.get("refreshToken"));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("user", result.get("user"));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, "refreshToken");

        if (refreshToken != null && !"none".equals(refreshToken)) {
            
            sessionRepository.findByRefreshToken(refreshToken)
                    .ifPresent(session -> sessionRepository.delete(session));
        }

        clearCookies(response);

        Map<String, Object> responseBody = new LinkedHashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "Logged out successfully.");

        return ResponseEntity.ok(responseBody);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(HttpServletRequest request) {
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) request.getAttribute("user");
        UUID userId = (UUID) request.getAttribute("userId");

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("user", user);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token,
                                          HttpServletResponse response) {
        try {
            Optional<User> userOpt = userRepository.findByVerificationToken(token);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(clientUrl + "/login?error=invalid_token"))
                        .build();
            }

            User user = userOpt.get();
            user.setVerified(true);
            user.setVerificationToken(null);
            userRepository.save(user);

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(clientUrl + "/login?verified=true"))
                    .build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(clientUrl + "/login?error=invalid_token"))
                    .build();
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request,
                                           HttpServletResponse httpResponse) {
        String refreshToken = getCookieValue(request, "refreshToken");

        if (refreshToken == null || "none".equals(refreshToken)) {
            throw new ApiException("No refresh token provided.", 401);
        }

        Map<String, Object> result = authService.refreshAccessToken(refreshToken);

        setTokenCookie(httpResponse, (String) result.get("accessToken"));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(HttpServletRequest request) {
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) request.getAttribute("user");
        UUID userId = (UUID) request.getAttribute("userId");

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }

        String currentRefreshToken = getCookieValue(request, "refreshToken");
        List<Map<String, Object>> sessions = authService.getActiveSessions(userId);

        List<Map<String, Object>> sessionsWithCurrent = sessions.stream().map(session -> {
            Map<String, Object> sessionCopy = new LinkedHashMap<>(session);
            String sessionRefreshToken = (String) session.get("refresh_token");
            sessionCopy.put("is_current", sessionRefreshToken != null &&
                    sessionRefreshToken.equals(currentRefreshToken));
            sessionCopy.remove("refresh_token"); 
            return sessionCopy;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("sessions", sessionsWithCurrent);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> terminateSession(@PathVariable("id") String id,
                                               HttpServletRequest request) {
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) request.getAttribute("user");
        UUID userId = (UUID) request.getAttribute("userId");

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }

        authService.terminateSession(userId, id);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Session terminated successfully.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll(HttpServletRequest request,
                                        HttpServletResponse httpResponse) {
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) request.getAttribute("user");
        UUID userId = (UUID) request.getAttribute("userId");

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }

        authService.terminateAllSessions(userId);
        clearCookies(httpResponse);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Logged out from all devices successfully.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());
        } catch (ApiException e) {

        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "If an account with that email exists, a password reset link has been sent.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
                                            HttpServletResponse httpResponse) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        clearCookies(httpResponse);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Password has been successfully reset. You can now log in with your new password.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                             HttpServletRequest httpRequest) {
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) httpRequest.getAttribute("user");
        UUID userId = (UUID) httpRequest.getAttribute("userId");

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }

        authService.changePassword(userId, request.getOldPassword(), request.getNewPassword());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Password changed successfully.");

        return ResponseEntity.ok(response);
    }
}
