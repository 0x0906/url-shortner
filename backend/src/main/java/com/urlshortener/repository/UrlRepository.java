package com.urlshortener.repository;

import com.urlshortener.entity.Url;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UrlRepository extends JpaRepository<Url, UUID> {

    Optional<Url> findByShortCode(String shortCode);

    Optional<Url> findByCustomAlias(String customAlias);

    Optional<Url> findByShortCodeOrCustomAlias(String shortCode, String customAlias);

    List<Url> findByUserId(UUID userId);

    long countByUserId(UUID userId);

    boolean existsByShortCodeOrCustomAlias(String shortCode, String customAlias);

    @Query("SELECT u FROM Url u WHERE u.userId = :userId " +
           "AND (:search IS NULL OR LOWER(u.originalUrl) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.shortCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.customAlias) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:isActive IS NULL OR u.isActive = :isActive) " +
           "ORDER BY u.createdAt DESC")
    Page<Url> findByUserIdWithFilters(@Param("userId") UUID userId,
                                      @Param("search") String search,
                                      @Param("isActive") Boolean isActive,
                                      Pageable pageable);
}
