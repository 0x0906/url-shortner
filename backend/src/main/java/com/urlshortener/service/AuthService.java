package com.urlshortener.service;

import com.urlshortener.entity.Session;
import com.urlshortener.entity.User;
import com.urlshortener.exception.ApiException;
import com.urlshortener.repository.SessionRepository;
import com.urlshortener.repository.UserRepository;
import com.urlshortener.util.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public Map<String, Object> registerUser(String name, String email, String password) {
        
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            throw new ApiException("Email address is already registered.", 400);
        }

        String hashedPassword = passwordEncoder.encode(password);

        String verificationToken = UUID.randomUUID().toString();

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(hashedPassword);
        user.setVerified(false);
        user.setVerificationToken(verificationToken);
        user.setCreatedAt(Instant.now());

        user = userRepository.save(user);

        System.out.println("Verification link: http://localhost:5000/api/auth/verify?token=" + verificationToken);

        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("name", user.getName());
        userInfo.put("email", user.getEmail());
        userInfo.put("created_at", user.getCreatedAt());

        return userInfo;
    }

    @Transactional
    public Map<String, Object> loginUser(String email, String password, String userAgent, String ipAddress) {
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("Invalid email or password.", 401));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException("Invalid email or password.", 401);
        }

        if (!user.isVerified()) {
            throw new ApiException("Please verify your email before logging in. Check your inbox for the verification link.", 401);
        }

        Map<String, String> tokens = generateTokens(user.getId(), userAgent, ipAddress);

        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("name", user.getName());
        userInfo.put("email", user.getEmail());
        userInfo.put("created_at", user.getCreatedAt());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("user", userInfo);
        result.put("accessToken", tokens.get("accessToken"));
        result.put("refreshToken", tokens.get("refreshToken"));

        return result;
    }

    @Transactional
    private Map<String, String> generateTokens(UUID userId, String userAgent, String ipAddress) {
        
        byte[] randomBytes = new byte[40];
        secureRandom.nextBytes(randomBytes);
        String refreshToken = bytesToHex(randomBytes);

        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        String deviceName = getDeviceName(userAgent);

        sessionRepository.deleteByUserIdAndExpiresAtBefore(userId, Instant.now());

        Optional<Session> existingSession = sessionRepository.findByUserIdAndDeviceNameAndIpAddress(userId, deviceName, ipAddress);

        Session session;
        if (existingSession.isPresent()) {
            
            session = existingSession.get();
            session.setRefreshToken(refreshToken);
            session.setExpiresAt(expiresAt);
            session.setCreatedAt(Instant.now());
            session = sessionRepository.save(session);
        } else {
            
            session = new Session();
            session.setUserId(userId);
            session.setRefreshToken(refreshToken);
            session.setDeviceName(deviceName);
            session.setIpAddress(ipAddress);
            session.setExpiresAt(expiresAt);
            session.setCreatedAt(Instant.now());
            session = sessionRepository.save(session);
        }

        String accessToken = jwtUtil.generateAccessToken(userId, session.getId());

        Map<String, String> tokens = new LinkedHashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);

        return tokens;
    }

    private String getDeviceName(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return "Unknown OS (Unknown Browser)";
        }

        String os;
        if (userAgent.contains("Windows")) {
            os = "Windows";
        } else if (userAgent.contains("iPhone")) {
            os = "iPhone";
        } else if (userAgent.contains("iPad")) {
            os = "iPad";
        } else if (userAgent.contains("Macintosh") || userAgent.contains("Mac OS")) {
            os = "macOS";
        } else if (userAgent.contains("Android")) {
            os = "Android";
        } else if (userAgent.contains("Linux")) {
            os = "Linux";
        } else {
            os = "Unknown OS";
        }

        String browser;
        if (userAgent.contains("Firefox")) {
            browser = "Firefox";
        } else if (userAgent.contains("Edg")) {
            browser = "Edge";
        } else if (userAgent.contains("Chrome") || userAgent.contains("Chromium")) {
            browser = "Chrome";
        } else if (userAgent.contains("Safari")) {
            browser = "Safari";
        } else {
            browser = "Unknown Browser";
        }

        return os + " (" + browser + ")";
    }

    @Transactional
    public Map<String, Object> refreshAccessToken(String refreshToken) {
        
        Session session = sessionRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new ApiException("Invalid or expired session. Please log in again.", 401));

        if (session.getExpiresAt().isBefore(Instant.now())) {
            sessionRepository.delete(session);
            throw new ApiException("Invalid or expired session. Please log in again.", 401);
        }

        String accessToken = jwtUtil.generateAccessToken(session.getUserId(), session.getId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accessToken", accessToken);

        return result;
    }

    public List<Map<String, Object>> getActiveSessions(UUID userId) {
        List<Session> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return sessions.stream().map(session -> {
            Map<String, Object> sessionMap = new LinkedHashMap<>();
            sessionMap.put("id", session.getId());
            sessionMap.put("device_name", session.getDeviceName());
            sessionMap.put("ip_address", session.getIpAddress());
            sessionMap.put("created_at", session.getCreatedAt());
            sessionMap.put("refresh_token", session.getRefreshToken());
            return sessionMap;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void terminateSession(UUID userId, String sessionId) {
        UUID sessionUUID;
        try {
            sessionUUID = UUID.fromString(sessionId);
        } catch (IllegalArgumentException e) {
            throw new ApiException("Session not found.", 404);
        }

        Session session = sessionRepository.findById(sessionUUID)
                .orElseThrow(() -> new ApiException("Session not found.", 404));

        if (!session.getUserId().equals(userId)) {
            throw new ApiException("Session not found.", 404);
        }

        sessionRepository.delete(session);
    }

    @Transactional
    public void terminateAllSessions(UUID userId) {
        sessionRepository.deleteByUserId(userId);
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("No account found with that email.", 404));

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = bytesToHex(randomBytes);

        String hashedToken = sha256Hash(rawToken);

        user.setResetToken(hashedToken);
        user.setResetTokenExpires(Instant.now().plus(1, ChronoUnit.HOURS));
        userRepository.save(user);

        System.out.println("Password reset link: http://localhost:5173/reset-password?token=" + rawToken);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        
        String hashedToken = sha256Hash(token);

        User user = userRepository.findByResetToken(hashedToken)
                .orElseThrow(() -> new ApiException("Invalid or expired password reset token.", 400));

        if (user.getResetTokenExpires() == null || user.getResetTokenExpires().isBefore(Instant.now())) {
            throw new ApiException("Invalid or expired password reset token.", 400);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpires(null);
        userRepository.save(user);

        terminateAllSessions(user.getId());
    }

    @Transactional
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found.", 404));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new ApiException("Incorrect current password.", 401);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String sha256Hash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
