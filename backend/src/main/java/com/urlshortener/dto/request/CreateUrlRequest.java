package com.urlshortener.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateUrlRequest {

    @NotBlank
    @JsonProperty("original_url")
    private String originalUrl;

    @Pattern(regexp = "^[a-zA-Z0-9_-]+$")
    @Size(min = 3, max = 30)
    @JsonProperty("custom_alias")
    private String customAlias;

    @JsonProperty("expires_at")
    private String expiresAt;

    private String password;

    @JsonProperty("is_one_time")
    private Boolean isOneTime;

    public CreateUrlRequest() {}

    public String getOriginalUrl() {
        return originalUrl;
    }

    public void setOriginalUrl(String originalUrl) {
        this.originalUrl = originalUrl;
    }

    public String getCustomAlias() {
        return customAlias;
    }

    public void setCustomAlias(String customAlias) {
        this.customAlias = customAlias;
    }

    public String getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(String expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getIsOneTime() {
        return isOneTime;
    }

    public void setIsOneTime(Boolean isOneTime) {
        this.isOneTime = isOneTime;
    }
}
