package com.urlshortener.util;

import java.util.HashMap;
import java.util.Map;

public class UserAgentParser {

    private UserAgentParser() {
        
    }

    public static Map<String, String> parse(String userAgent) {
        Map<String, String> result = new HashMap<>();

        if (userAgent == null || userAgent.isBlank()) {
            result.put("browser", "Unknown");
            result.put("os", "Unknown");
            result.put("device", "Unknown");
            return result;
        }

        result.put("browser", parseBrowser(userAgent));

        result.put("os", parseOS(userAgent));

        result.put("device", parseDevice(userAgent));

        return result;
    }

    private static String parseBrowser(String ua) {
        if (ua.contains("Edg/") || ua.contains("Edge/")) {
            return "Edge";
        } else if (ua.contains("OPR/") || ua.contains("Opera/")) {
            return "Opera";
        } else if (ua.contains("Firefox/")) {
            return "Firefox";
        } else if (ua.contains("Chrome/")) {
            return "Chrome";
        } else if (ua.contains("Safari/") && !ua.contains("Chrome/")) {
            return "Safari";
        }
        return "Unknown";
    }

    private static String parseOS(String ua) {
        if (ua.contains("Windows")) {
            return "Windows";
        } else if (ua.contains("Macintosh") || ua.contains("Mac OS")) {
            return "macOS";
        } else if (ua.contains("iPhone") || ua.contains("iPad") || ua.contains("iPod")) {
            return "iOS";
        } else if (ua.contains("Android")) {
            return "Android";
        } else if (ua.contains("Linux")) {
            return "Linux";
        }
        return "Unknown";
    }

    private static String parseDevice(String ua) {
        if (ua.contains("Mobile") || ua.contains("iPhone") || ua.contains("Android") && !ua.contains("Tablet")) {
            return "Mobile";
        } else if (ua.contains("Tablet") || ua.contains("iPad")) {
            return "Tablet";
        }
        return "Desktop";
    }
}
