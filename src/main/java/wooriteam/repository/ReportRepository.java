package wooriteam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wooriteam.entity.Report;

public interface ReportRepository extends JpaRepository<Report, Long> {
}
