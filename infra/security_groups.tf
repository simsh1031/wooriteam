# ─── ALB Security Group ────────────────────────────────────────────────────────
# 인터넷 → ALB: HTTP(80), HTTPS(443) 허용

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "ALB inbound HTTP/HTTPS from internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-alb-sg" }
}

# ─── ECS Security Group ────────────────────────────────────────────────────────
# ALB → ECS: 8080 허용 (ALB SG에서만)

resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-ecs-sg"
  description = "ECS Fargate inbound 8080 from ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-ecs-sg" }
}

# ─── RDS Security Group ────────────────────────────────────────────────────────
# ECS → RDS: 3306 허용 (ECS SG에서만)

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "RDS MySQL inbound 3306 from ECS only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-rds-sg" }
}
