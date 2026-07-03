package com.urlshortener.service;

import com.urlshortener.entity.Url;
import com.urlshortener.entity.Visit;
import com.urlshortener.exception.ApiException;
import com.urlshortener.repository.UrlRepository;
import com.urlshortener.repository.VisitRepository;
import com.urlshortener.util.UserAgentParser;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private UrlRepository urlRepository;

    @Autowired
    private VisitRepository visitRepository;

    public Map<String, Object> getUserDashboardAnalytics(UUID userId) {
        
        List<Url> urls = urlRepository.findByUserId(userId);

        long totalUrls = urls.size();
        long totalClicks = urls.stream().mapToLong(Url::getClickCount).sum();
        long activeUrls = urls.stream()
                .filter(url -> url.isActive() &&
                        (url.getExpiresAt() == null || url.getExpiresAt().isAfter(Instant.now())))
                .count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalUrls", totalUrls);
        summary.put("totalClicks", totalClicks);
        summary.put("activeUrls", activeUrls);

        List<Map<String, Object>> topUrls = urls.stream()
                .sorted(Comparator.comparingInt(Url::getClickCount).reversed())
                .limit(5)
                .map(url -> {
                    Map<String, Object> urlMap = new LinkedHashMap<>();
                    urlMap.put("id", url.getId());
                    urlMap.put("short_code", url.getShortCode());
                    urlMap.put("custom_alias", url.getCustomAlias());
                    urlMap.put("original_url", url.getOriginalUrl());
                    urlMap.put("click_count", url.getClickCount());
                    return urlMap;
                })
                .collect(Collectors.toList());

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<Visit> recentVisits = visitRepository.findByUserUrlsAfterDate(userId, thirtyDaysAgo);

        List<Map<String, Object>> dailyClicks = buildDailyClicks(recentVisits, 7);

        List<Visit> visitsForBreakdown = visitRepository.findByUserUrlsOrderByVisitedAtDesc(
                userId, PageRequest.of(0, 1000));

        Map<String, Object> breakdowns = buildBreakdowns(visitsForBreakdown);

        List<Visit> recentActivityVisits = visitRepository.findTop5ByUserUrls(
                userId, PageRequest.of(0, 5));

        List<Map<String, Object>> recentActivity = recentActivityVisits.stream()
                .map(visit -> {
                    Map<String, Object> activityMap = new LinkedHashMap<>();
                    activityMap.put("id", visit.getId());
                    activityMap.put("ip_address", visit.getIpAddress());
                    activityMap.put("user_agent", visit.getUserAgent());
                    activityMap.put("visited_at", visit.getVisitedAt());

                    Map<String, String> parsed = UserAgentParser.parse(visit.getUserAgent());
                    activityMap.put("browser", parsed.get("browser"));
                    activityMap.put("os", parsed.get("os"));
                    activityMap.put("device", parsed.get("device"));

                    if (visit.getUrl() != null) {
                        Map<String, Object> urlInfo = new LinkedHashMap<>();
                        urlInfo.put("id", visit.getUrl().getId());
                        urlInfo.put("short_code", visit.getUrl().getShortCode());
                        urlInfo.put("custom_alias", visit.getUrl().getCustomAlias());
                        urlInfo.put("original_url", visit.getUrl().getOriginalUrl());
                        activityMap.put("url", urlInfo);
                    }

                    return activityMap;
                })
                .collect(Collectors.toList());

        Map<String, Object> breakdownsMap = new LinkedHashMap<>();
        breakdownsMap.put("browser", breakdowns.get("browsers"));
        breakdownsMap.put("os", breakdowns.get("os"));
        breakdownsMap.put("device", breakdowns.get("devices"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", summary);
        result.put("topUrls", topUrls);
        result.put("dailyClicks", dailyClicks);
        result.put("recentActivity", recentActivity);
        result.put("breakdowns", breakdownsMap);

        return result;
    }

    public Map<String, Object> getUrlAnalytics(UUID urlId, UUID userId) {
        
        Url url = urlRepository.findById(urlId)
                .orElseThrow(() -> new ApiException("URL not found.", 404));

        if (!url.getUserId().equals(userId)) {
            throw new ApiException("You do not have permission to view analytics for this URL.", 403);
        }

        Optional<Visit> lastVisitOpt = visitRepository.findFirstByUrlIdOrderByVisitedAtDesc(urlId);

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<Visit> recentVisits = visitRepository.findByUrlIdAndVisitedAtAfterOrderByVisitedAtAsc(
                urlId, thirtyDaysAgo);

        List<Map<String, Object>> dailyClicks = buildDailyClicks(recentVisits, 15);

        List<Visit> visitsForBreakdown = visitRepository.findTop500ByUrlIdOrderByVisitedAtDesc(urlId);
        Map<String, Object> breakdowns = buildBreakdowns(visitsForBreakdown);

        List<Visit> clickHistoryVisits = visitRepository.findTop50ByUrlIdOrderByVisitedAtDesc(urlId);
        List<Map<String, Object>> clickHistory = clickHistoryVisits.stream()
                .map(visit -> {
                    Map<String, Object> visitMap = new LinkedHashMap<>();
                    visitMap.put("id", visit.getId());
                    visitMap.put("ip_address", visit.getIpAddress());
                    visitMap.put("user_agent", visit.getUserAgent());
                    visitMap.put("visited_at", visit.getVisitedAt());

                    Map<String, String> parsed = UserAgentParser.parse(visit.getUserAgent());
                    visitMap.put("browser", parsed.get("browser"));
                    visitMap.put("os", parsed.get("os"));
                    visitMap.put("device", parsed.get("device"));

                    return visitMap;
                })
                .collect(Collectors.toList());

        Map<String, Object> urlInfo = new LinkedHashMap<>();
        urlInfo.put("id", url.getId());
        urlInfo.put("short_code", url.getShortCode());
        urlInfo.put("custom_alias", url.getCustomAlias());
        urlInfo.put("original_url", url.getOriginalUrl());
        urlInfo.put("click_count", url.getClickCount());
        urlInfo.put("is_active", url.isActive());
        urlInfo.put("is_one_time", url.isOneTime());
        urlInfo.put("expires_at", url.getExpiresAt());
        urlInfo.put("created_at", url.getCreatedAt());
        urlInfo.put("has_password", url.getPasswordHash() != null);

        Map<String, Object> breakdownsMap = new LinkedHashMap<>();
        breakdownsMap.put("browser", breakdowns.get("browsers"));
        breakdownsMap.put("os", breakdowns.get("os"));
        breakdownsMap.put("device", breakdowns.get("devices"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("url", urlInfo);
        result.put("totalClicks", url.getClickCount());
        result.put("lastVisited", lastVisitOpt.map(Visit::getVisitedAt).orElse(null));
        result.put("dailyClicks", dailyClicks);
        result.put("clickHistory", clickHistory);
        result.put("breakdowns", breakdownsMap);

        return result;
    }

    private List<Map<String, Object>> buildDailyClicks(List<Visit> visits, int days) {
        
        Map<String, Long> clicksByDate = new LinkedHashMap<>();

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            clicksByDate.put(date.format(formatter), 0L);
        }

        for (Visit visit : visits) {
            if (visit.getVisitedAt() != null) {
                String dateStr = visit.getVisitedAt()
                        .atZone(ZoneOffset.UTC)
                        .toLocalDate()
                        .format(formatter);
                clicksByDate.computeIfPresent(dateStr, (key, count) -> count + 1);
            }
        }

        return clicksByDate.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> dayData = new LinkedHashMap<>();
                    dayData.put("date", entry.getKey());
                    dayData.put("clicks", entry.getValue());
                    return dayData;
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildBreakdowns(List<Visit> visits) {
        Map<String, Integer> browserCounts = new LinkedHashMap<>();
        Map<String, Integer> osCounts = new LinkedHashMap<>();
        Map<String, Integer> deviceCounts = new LinkedHashMap<>();

        for (Visit visit : visits) {
            Map<String, String> parsed = UserAgentParser.parse(visit.getUserAgent());

            String browser = parsed.getOrDefault("browser", "Unknown");
            String os = parsed.getOrDefault("os", "Unknown");
            String device = parsed.getOrDefault("device", "Unknown");

            browserCounts.merge(browser, 1, Integer::sum);
            osCounts.merge(os, 1, Integer::sum);
            deviceCounts.merge(device, 1, Integer::sum);
        }

        Map<String, Object> breakdowns = new LinkedHashMap<>();
        breakdowns.put("browsers", convertToBreakdownList(browserCounts, visits.size()));
        breakdowns.put("os", convertToBreakdownList(osCounts, visits.size()));
        breakdowns.put("devices", convertToBreakdownList(deviceCounts, visits.size()));

        return breakdowns;
    }

    private List<Map<String, Object>> convertToBreakdownList(Map<String, Integer> counts, int total) {
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(entry -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", entry.getKey());
                    item.put("value", entry.getValue());
                    item.put("percentage", total > 0
                            ? Math.round((double) entry.getValue() / total * 100 * 10) / 10.0
                            : 0);
                    return item;
                })
                .collect(Collectors.toList());
    }
}
