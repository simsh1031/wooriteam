variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "프로젝트 이름 (리소스 이름 접두사)"
  type        = string
  default     = "wooriteam"
}

variable "vpc_cidr" {
  description = "VPC CIDR 블록"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "퍼블릭 서브넷 CIDR 목록 [2a, 2c]"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "프라이빗 서브넷 CIDR 목록 [2a, 2c]"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "db_subnet_cidrs" {
  description = "DB 서브넷 CIDR 목록 [2a, 2c]"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "availability_zones" {
  description = "사용할 AZ 목록"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

variable "ecs_task_cpu" {
  description = "ECS 태스크 CPU (단위: vCPU 단위)"
  type        = number
  default     = 512
}

variable "ecs_task_memory" {
  description = "ECS 태스크 메모리 (단위: MB)"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "ECS 서비스 원하는 태스크 수"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Auto Scaling 최소 태스크 수"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Auto Scaling 최대 태스크 수"
  type        = number
  default     = 6
}

variable "db_instance_class" {
  description = "RDS 인스턴스 클래스"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "MySQL 데이터베이스 이름"
  type        = string
  default     = "wooriteam"
}

variable "db_username" {
  description = "RDS 마스터 사용자명"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS 마스터 비밀번호"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT 서명 키 (256bit 이상)"
  type        = string
  sensitive   = true
}

variable "alert_email" {
  description = "CloudWatch 알람 수신 이메일"
  type        = string
}

variable "ecr_image_uri" {
  description = "ECS Task Definition에 사용할 ECR 이미지 URI (CD에서 교체)"
  type        = string
  default     = ""
}

variable "discord_webhook_url" {
  description = "Discord 알림 Webhook URL"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "커스텀 도메인 (구매 전이면 빈 문자열 — Alias/ACM/Route 53 리소스를 count로 비활성화)"
  type        = string
  default     = ""
}

variable "cloudfront_origin_secret" {
  description = "CloudFront → ALB 커스텀 헤더 검증용 난수 값 (ALB 직접 접근 차단)"
  type        = string
  sensitive   = true
}

# ─── 메일 알림 (지원/신고 알림용 Gmail SMTP) ────────────────────────────────────
variable "mail_enabled" {
  description = "이메일 알림 발송 여부"
  type        = bool
  default     = false
}

variable "mail_username" {
  description = "SMTP 발신용 Gmail 주소"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mail_password" {
  description = "SMTP 발신용 Gmail 앱 비밀번호 (16자리)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "admin_email" {
  description = "신고 접수 알림을 받을 관리자 이메일 (미지정 시 mail_username 사용)"
  type        = string
  default     = ""
}

variable "mail_from" {
  description = "발신 표시 이름/주소 (미지정 시 mail_username 사용)"
  type        = string
  default     = ""
}
