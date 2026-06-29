# ─── Secrets Manager ────────────────────────────────────────────────────────────
# DB 자격증명, JWT 서명 키, CloudFront→ALB 직접 접근 차단용 난수 값

resource "aws_secretsmanager_secret" "db_username" {
  name = "${var.project_name}/prod/db-username"

  tags = { Name = "${var.project_name}-db-username" }
}

resource "aws_secretsmanager_secret_version" "db_username" {
  secret_id     = aws_secretsmanager_secret.db_username.id
  secret_string = jsonencode({ username = var.db_username })
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project_name}/prod/db-password"

  tags = { Name = "${var.project_name}-db-password" }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({ password = var.db_password })
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${var.project_name}/prod/jwt-secret"

  tags = { Name = "${var.project_name}-jwt-secret" }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({ secret = var.jwt_secret })
}

resource "aws_secretsmanager_secret" "cloudfront_origin_secret" {
  name = "${var.project_name}/prod/cloudfront-origin-secret"

  tags = { Name = "${var.project_name}-cloudfront-origin-secret" }
}

resource "aws_secretsmanager_secret_version" "cloudfront_origin_secret" {
  secret_id     = aws_secretsmanager_secret.cloudfront_origin_secret.id
  secret_string = jsonencode({ secret = var.cloudfront_origin_secret })
}

resource "aws_secretsmanager_secret" "mail_username" {
  name = "${var.project_name}/prod/mail-username"

  tags = { Name = "${var.project_name}-mail-username" }
}

resource "aws_secretsmanager_secret_version" "mail_username" {
  secret_id     = aws_secretsmanager_secret.mail_username.id
  secret_string = jsonencode({ username = var.mail_username })
}

resource "aws_secretsmanager_secret" "mail_password" {
  name = "${var.project_name}/prod/mail-password"

  tags = { Name = "${var.project_name}-mail-password" }
}

resource "aws_secretsmanager_secret_version" "mail_password" {
  secret_id     = aws_secretsmanager_secret.mail_password.id
  secret_string = jsonencode({ password = var.mail_password })
}
