package com.urlshortener.filter;

import com.urlshortener.entity.Session;
import com.urlshortener.entity.User;
import com.urlshortener.repository.SessionRepository;
import com.urlshortener.repository.UserRepository;
import com.urlshortener.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository, SessionRepository sessionRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String token = extractTokenFromCookies(request, "token");
        if (token == null) {
            token = extractTokenFromHeader(request);
        }

        if (token == null) {
            
            attemptRefresh(request, response);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            UUID userId = jwtUtil.getUserIdFromToken(token);
            UUID sessionId = jwtUtil.getSessionIdFromToken(token);

            if (sessionId != null) {
                Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
                if (sessionOpt.isEmpty()) {
                    
                    filterChain.doFilter(request, response);
                    return;
                }
            }

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                setUserOnRequest(request, user);
            }
        } catch (Exception e) {
            
            attemptRefresh(request, response);
        }

        filterChain.doFilter(request, response);
    }

    private void attemptRefresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractTokenFromCookies(request, "refreshToken");
        if (refreshToken == null) return;

        try {
            Optional<Session> sessionOpt = sessionRepository.findByRefreshToken(refreshToken);
            if (sessionOpt.isPresent()) {
                Session session = sessionOpt.get();
                if (session.getExpiresAt().isAfter(Instant.now())) {
                    
                    String newAccessToken = jwtUtil.generateAccessToken(
                            session.getUserId(), session.getId());

                    Cookie tokenCookie = new Cookie("token", newAccessToken);
                    tokenCookie.setHttpOnly(true);
                    tokenCookie.setPath("/");
                    tokenCookie.setMaxAge(15 * 60); 
                    response.addCookie(tokenCookie);

                    Optional<User> userOpt = userRepository.findById(session.getUserId());
                    userOpt.ifPresent(user -> setUserOnRequest(request, user));
                }
            }
        } catch (Exception e) {
            
        }
    }

    private void setUserOnRequest(HttpServletRequest request, User user) {
        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("id", user.getId().toString());
        userMap.put("name", user.getName());
        userMap.put("email", user.getEmail());
        userMap.put("created_at", user.getCreatedAt().toString());
        request.setAttribute("user", userMap);
        request.setAttribute("userId", user.getId());

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user, null, Collections.emptyList());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String extractTokenFromCookies(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        return Arrays.stream(cookies)
                .filter(c -> cookieName.equals(c.getName()))
                .map(Cookie::getValue)
                .filter(v -> v != null && !"none".equals(v) && !v.isBlank())
                .findFirst()
                .orElse(null);
    }

    private String extractTokenFromHeader(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
