package com.urlshortener.config;

import com.urlshortener.cache.LRUCache;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CacheConfig {

    @Bean
    public LRUCache<String, Object> urlCache(
            @Value("${cache.url-resolution.max-size:500}") int maxSize) {
        return new LRUCache<>(maxSize);
    }
}
