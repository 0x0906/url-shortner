package com.urlshortener.repository;

import com.urlshortener.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    Optional<Session> findByRefreshToken(String refreshToken);

    List<Session> findByUserIdOrderByCreatedAtDesc(UUID userId);

    void deleteByUserId(UUID userId);

    void deleteByUserIdAndExpiresAtBefore(UUID userId, Instant now);

    Optional<Session> findByUserIdAndDeviceNameAndIpAddress(UUID userId, String deviceName, String ipAddress);
}
