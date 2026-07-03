package com.urlshortener.service;

import com.urlshortener.cache.LRUCache;
import com.urlshortener.dto.request.CreateUrlRequest;
import com.urlshortener.dto.request.UpdateUrlRequest;
import com.urlshortener.entity.Url;
import com.urlshortener.entity.Visit;
import com.urlshortener.exception.ApiException;
import com.urlshortener.repository.UrlRepository;
import com.urlshortener.repository.VisitRepository;
import com.urlshortener.util.ShortCodeGenerator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class UrlService {

    @Autowired
    private UrlRepository urlRepository;

    @Autowired
    private VisitRepository visitRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private LRUCache<String, Object> urlCache;

    @Value("${client.url}")
    private String clientUrl;

    @Transactional
    public Url createShortUrl(CreateUrlRequest request, UUID userId) {
        String customAlias = request.getCustomAlias();
        Instant expiresAt = parseExpiresAt(request.getExpiresAt());
        String password = request.getPassword();
        Boolean isOneTime = request.getIsOneTime();

        if (userId == null) {
            customAlias = null;
            expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);
        }

        String shortCode;

        if (customAlias != null && !customAlias.trim().isEmpty()) {
            
            Optional<Url> conflict = urlRepository.findByShortCodeOrCustomAlias(customAlias, customAlias);
            if (conflict.isPresent()) {
                throw new ApiException("This custom alias is already taken.", 400);
            }
            shortCode = customAlias;
        } else {
            
            shortCode = generateUniqueShortCode();
            customAlias = null;
        }

        String passwordHash = null;
        if (password != null && !password.trim().isEmpty()) {
            passwordHash = passwordEncoder.encode(password);
        }

        Url url = new Url();
        url.setOriginalUrl(request.getOriginalUrl());
        url.setShortCode(shortCode);
        url.setCustomAlias(customAlias);
        url.setClickCount(0);
        url.setExpiresAt(expiresAt);
        url.setPasswordHash(passwordHash);
        url.setOneTime(isOneTime != null && isOneTime);
        url.setActive(true);
        url.setUserId(userId);
        url.setCreatedAt(Instant.now());

        url = urlRepository.save(url);

        return url;
    }

    private String generateUniqueShortCode() {
        for (int i = 0; i < 10; i++) {
            String code = ShortCodeGenerator.generate(6);
            if (urlRepository.findByShortCode(code).isEmpty()) {
                return code;
            }
        }
        throw new ApiException("Failed to generate a unique short code. Please try again.", 500);
    }

    public Map<String, Object> getUrls(UUID userId, String search, Boolean isActive, int page, int limit) {
        Page<Url> urlPage = urlRepository.findByUserIdWithFilters(
                userId, search, isActive, PageRequest.of(page - 1, limit));

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("total", urlPage.getTotalElements());
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("pages", urlPage.getTotalPages());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("urls", urlPage.getContent());
        result.put("pagination", pagination);

        return result;
    }

    @Transactional
    public Url updateUrl(UUID urlId, UUID userId, UpdateUrlRequest request) {
        Url url = urlRepository.findById(urlId)
                .orElseThrow(() -> new ApiException("URL not found.", 404));

        if (!url.getUserId().equals(userId)) {
            throw new ApiException("You do not have permission to modify this URL.", 403);
        }

        String oldShortCode = url.getShortCode();
        String oldCustomAlias = url.getCustomAlias();

        if (request.getOriginalUrl() != null) {
            url.setOriginalUrl(request.getOriginalUrl());
        }

        if (request.getCustomAlias() != null) {
            String newAlias = request.getCustomAlias().trim();
            if (!newAlias.isEmpty()) {
                
                if (!newAlias.equals(url.getCustomAlias())) {
                    
                    Optional<Url> conflict = urlRepository.findByShortCodeOrCustomAlias(newAlias, newAlias);
                    if (conflict.isPresent() && !conflict.get().getId().equals(url.getId())) {
                        throw new ApiException("This custom alias is already taken.", 400);
                    }
                    url.setCustomAlias(newAlias);
                    url.setShortCode(newAlias);
                }
            } else {
                
                url.setCustomAlias(null);
                url.setShortCode(generateUniqueShortCode());
            }
        }

        if (request.getExpiresAt() != null) {
            url.setExpiresAt(parseExpiresAt(request.getExpiresAt()));
        }

        if (request.getPassword() != null) {
            if (request.getPassword().trim().isEmpty()) {
                
                url.setPasswordHash(null);
            } else {
                url.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            }
        }

        if (request.getIsOneTime() != null) {
            url.setOneTime(request.getIsOneTime());
        }

        if (request.getIsActive() != null) {
            url.setActive(request.getIsActive());
        }

        urlCache.remove(oldShortCode);
        if (oldCustomAlias != null) {
            urlCache.remove(oldCustomAlias);
        }
        
        if (url.getShortCode() != null && !url.getShortCode().equals(oldShortCode)) {
            urlCache.remove(url.getShortCode());
        }
        if (url.getCustomAlias() != null && !url.getCustomAlias().equals(oldCustomAlias)) {
            urlCache.remove(url.getCustomAlias());
        }

        url = urlRepository.save(url);
        return url;
    }

    @Transactional
    public void deleteUrl(UUID urlId, UUID userId) {
        Url url = urlRepository.findById(urlId)
                .orElseThrow(() -> new ApiException("URL not found.", 404));

        if (!url.getUserId().equals(userId)) {
            throw new ApiException("You do not have permission to delete this URL.", 403);
        }

        urlCache.remove(url.getShortCode());
        if (url.getCustomAlias() != null) {
            urlCache.remove(url.getCustomAlias());
        }

        urlRepository.delete(url);
    }

    @Transactional
    public Map<String, Object> resolveUrlAndTrackVisit(String shortCode, String ip, String userAgent, String password) {
        
        Url url = (Url) urlCache.get(shortCode);

        if (url == null) {
            
            url = urlRepository.findByShortCodeOrCustomAlias(shortCode, shortCode)
                    .orElseThrow(() -> new ApiException("Short URL not found.", 404));

            urlCache.put(url.getShortCode(), url);
            if (url.getCustomAlias() != null) {
                urlCache.put(url.getCustomAlias(), url);
            }
        }

        if (!url.isActive()) {
            throw new ApiException("This short URL has been deactivated.", 400);
        }

        if (url.getExpiresAt() != null && url.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("This short URL has expired.", 410);
        }

        if (url.getPasswordHash() != null) {
            if (password == null || password.trim().isEmpty()) {
                throw new ApiException("PASSWORD_REQUIRED", 403);
            }
            if (!passwordEncoder.matches(password, url.getPasswordHash())) {
                throw new ApiException("Invalid password.", 403);
            }
        }

        int currentClickCount = url.getClickCount();
        trackVisitAsync(url, ip, userAgent);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("original_url", url.getOriginalUrl());
        result.put("click_count", currentClickCount + 1);

        return result;
    }

    private void trackVisitAsync(Url url, String ip, String userAgent) {
        try {
            
            url.setClickCount(url.getClickCount() + 1);

            if (url.isOneTime()) {
                url.setActive(false);
                
                urlCache.remove(url.getShortCode());
                if (url.getCustomAlias() != null) {
                    urlCache.remove(url.getCustomAlias());
                }
            }

            urlRepository.save(url);

            Visit visit = new Visit();
            visit.setUrlId(url.getId());
            visit.setIpAddress(ip);
            visit.setUserAgent(userAgent);
            visit.setVisitedAt(Instant.now());
            visitRepository.save(visit);
        } catch (Exception e) {
            
            System.err.println("Error tracking visit: " + e.getMessage());
        }
    }

    private Instant parseExpiresAt(String expiresAtStr) {
        if (expiresAtStr == null || expiresAtStr.trim().isEmpty() || "null".equalsIgnoreCase(expiresAtStr.trim())) {
            return null;
        }
        try {
            return Instant.parse(expiresAtStr);
        } catch (Exception e) {
            try {
                return java.time.OffsetDateTime.parse(expiresAtStr).toInstant();
            } catch (Exception e2) {
                throw new ApiException("Invalid expiration date format.", 400);
            }
        }
    }
}
