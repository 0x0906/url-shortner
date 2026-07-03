package com.urlshortener.repository;

import com.urlshortener.entity.Visit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VisitRepository extends JpaRepository<Visit, UUID> {

    List<Visit> findByUrlIdOrderByVisitedAtDesc(UUID urlId);

    List<Visit> findByUrlIdAndVisitedAtAfterOrderByVisitedAtAsc(UUID urlId, Instant after);

    List<Visit> findTop50ByUrlIdOrderByVisitedAtDesc(UUID urlId);

    List<Visit> findTop500ByUrlIdOrderByVisitedAtDesc(UUID urlId);

    Optional<Visit> findFirstByUrlIdOrderByVisitedAtDesc(UUID urlId);

    @Query("SELECT v FROM Visit v JOIN v.url u WHERE u.userId = :userId AND v.visitedAt >= :after ORDER BY v.visitedAt ASC")
    List<Visit> findByUserUrlsAfterDate(@Param("userId") UUID userId, @Param("after") Instant after);

    @Query("SELECT v FROM Visit v JOIN v.url u WHERE u.userId = :userId ORDER BY v.visitedAt DESC")
    List<Visit> findByUserUrlsOrderByVisitedAtDesc(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT v FROM Visit v JOIN v.url u WHERE u.userId = :userId ORDER BY v.visitedAt DESC")
    List<Visit> findTop5ByUserUrls(@Param("userId") UUID userId, Pageable pageable);
}
