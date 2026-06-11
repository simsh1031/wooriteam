# ─── 2단계 (vpc.tf) ────────────────────────────────────────────────────────────

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "퍼블릭 서브넷 ID 목록 [2a, 2c]"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "프라이빗 서브넷 ID 목록 [2a, 2c] (ECS Fargate)"
  value       = aws_subnet.private[*].id
}

output "db_subnet_ids" {
  description = "DB 서브넷 ID 목록 [2a, 2c]"
  value       = aws_subnet.db[*].id
}

output "nat_gateway_eips" {
  description = "NAT Gateway 고정 IP 목록 [2a, 2c] (아웃바운드 IP)"
  value       = aws_eip.nat[*].public_ip
}

# ─── 4단계 (ecr.tf) ────────────────────────────────────────────────────────────

output "ecr_repository_url" {
  description = "ECR 레포지토리 URL (이미지 push 주소)"
  value       = aws_ecr_repository.main.repository_url
}

output "ecr_repository_name" {
  description = "ECR 레포지토리 이름"
  value       = aws_ecr_repository.main.name
}

# ─── 5단계 (alb.tf, ecs.tf, rds.tf) ───────────────────────────────────────────

# output "alb_dns_name" {
#   description = "ALB DNS 이름 (서비스 접속 주소)"
#   value       = aws_lb.main.dns_name
# }

# output "rds_endpoint" {
#   description = "RDS 엔드포인트 (DB_HOST 환경변수 값)"
#   value       = aws_db_instance.main.address
#   sensitive   = true
# }

# output "ecs_cluster_name" {
#   description = "ECS 클러스터 이름"
#   value       = aws_ecs_cluster.main.name
# }

# output "ecs_service_name" {
#   description = "ECS 서비스 이름"
#   value       = aws_ecs_service.main.name
# }

# output "ecs_task_definition_arn" {
#   description = "현재 등록된 Task Definition ARN"
#   value       = aws_ecs_task_definition.main.arn
# }

# ─── 6단계 (cloudfront.tf, route53.tf) ────────────────────────────────────────

# output "cloudfront_domain_name" {
#   description = "CloudFront 배포 도메인 — 커스텀 도메인 연결 전까지의 서비스 접속 주소이자 CORS_ALLOWED_ORIGINS 값"
#   value       = aws_cloudfront_distribution.main.domain_name
# }

# output "cloudfront_distribution_id" {
#   description = "CloudFront 배포 ID (CD에서 캐시 무효화 시 사용)"
#   value       = aws_cloudfront_distribution.main.id
# }

# output "frontend_bucket_name" {
#   description = "프론트엔드 빌드 산출물(dist) 업로드 대상 S3 버킷"
#   value       = aws_s3_bucket.frontend.bucket
# }
