package com.urlshortener.controller;

import com.urlshortener.dto.request.CreateUrlRequest;
import com.urlshortener.dto.request.ResolveUrlRequest;
import com.urlshortener.dto.request.UpdateUrlRequest;
import com.urlshortener.entity.Url;
import com.urlshortener.service.UrlService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/urls")
public class UrlController {

    @Autowired
    private UrlService urlService;

    @PostMapping
    public ResponseEntity<?> createShortUrl(@Valid @RequestBody CreateUrlRequest request,
                                             HttpServletRequest httpRequest) {
        
        UUID userId = (UUID) httpRequest.getAttribute("userId");

        Url url = urlService.createShortUrl(request, userId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("data", url);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<?> getUrls(HttpServletRequest request,
                                      @RequestParam(value = "search", required = false) String search,
                                      @RequestParam(value = "is_active", required = false) Boolean isActive,
                                      @RequestParam(value = "page", defaultValue = "1") int page,
                                      @RequestParam(value = "limit", defaultValue = "10") int limit) {
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) request.getAttribute("user");
        UUID userId = (UUID) request.getAttribute("userId");

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }

        Map<String, Object> result = urlService.getUrls(userId, search, isActive, page, limit);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("urls", result.get("urls"));
        response.put("pagination", result.get("pagination"));

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUrl(@PathVariable("id") UUID id,
                                        @RequestBody UpdateUrlRequest request,
                                        HttpServletRequest httpRequest) {
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) httpRequest.getAttribute("user");
        UUID userId = (UUID) httpRequest.getAttribute("userId");

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }

        Url url = urlService.updateUrl(id, userId, request);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("data", url);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUrl(@PathVariable("id") UUID id,
                                        HttpServletRequest httpRequest) {
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) httpRequest.getAttribute("user");
        UUID userId = (UUID) httpRequest.getAttribute("userId");

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }

        urlService.deleteUrl(id, userId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "URL successfully deleted.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/resolve/{shortCode}")
    public ResponseEntity<?> resolveUrl(@PathVariable("shortCode") String shortCode,
                                         @RequestBody(required = false) ResolveUrlRequest request,
                                         HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        String password = (request != null) ? request.getPassword() : null;

        Map<String, Object> result = urlService.resolveUrlAndTrackVisit(shortCode, ip, userAgent, password);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("data", result);

        return ResponseEntity.ok(response);
    }
}
