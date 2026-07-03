package com.urlshortener.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {

    private boolean success;
    private String message;
    private String error;
    private Object data;
    private Object user;
    private Object sessions;
    private Object urls;
    private Object pagination;

    public ApiResponse() {}

    private ApiResponse(boolean success) {
        this.success = success;
    }

    public static ApiResponse success(String message) {
        ApiResponse response = new ApiResponse(true);
        response.message = message;
        return response;
    }

    public static ApiResponse successWithData(Object data) {
        ApiResponse response = new ApiResponse(true);
        response.data = data;
        return response;
    }

    public static ApiResponse successWithData(String message, Object data) {
        ApiResponse response = new ApiResponse(true);
        response.message = message;
        response.data = data;
        return response;
    }

    public static ApiResponse successWithUser(Object user) {
        ApiResponse response = new ApiResponse(true);
        response.user = user;
        return response;
    }

    public static ApiResponse successWithUser(String message, Object user) {
        ApiResponse response = new ApiResponse(true);
        response.message = message;
        response.user = user;
        return response;
    }

    public static ApiResponse successWithSessions(Object sessions) {
        ApiResponse response = new ApiResponse(true);
        response.sessions = sessions;
        return response;
    }

    public static ApiResponse successWithUrls(Object urls, Object pagination) {
        ApiResponse response = new ApiResponse(true);
        response.urls = urls;
        response.pagination = pagination;
        return response;
    }

    public static ApiResponse error(String error) {
        ApiResponse response = new ApiResponse(false);
        response.error = error;
        return response;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public Object getUser() {
        return user;
    }

    public void setUser(Object user) {
        this.user = user;
    }

    public Object getSessions() {
        return sessions;
    }

    public void setSessions(Object sessions) {
        this.sessions = sessions;
    }

    public Object getUrls() {
        return urls;
    }

    public void setUrls(Object urls) {
        this.urls = urls;
    }

    public Object getPagination() {
        return pagination;
    }

    public void setPagination(Object pagination) {
        this.pagination = pagination;
    }
}
