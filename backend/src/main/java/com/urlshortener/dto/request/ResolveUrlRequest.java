package com.urlshortener.dto.request;

public class ResolveUrlRequest {

    private String password;

    public ResolveUrlRequest() {}

    public ResolveUrlRequest(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
