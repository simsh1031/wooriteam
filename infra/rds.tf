# ─── DB Subnet Group ────────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.db[*].id

  tags = { Name = "${var.project_name}-db-subnet-group" }
}

# ─── Parameter Group (MySQL 8.0) ────────────────────────────────────────────────

resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-mysql8-pg"
  family = "mysql8.0"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  parameter {
    name  = "character_set_client"
    value = "utf8mb4"
  }

  parameter {
    name  = "max_connections"
    value = "100"
  }

  parameter {
    name         = "slow_query_log"
    value        = "1"
    apply_method = "immediate"
  }

  parameter {
    name         = "long_query_time"
    value        = "2"
    apply_method = "immediate"
  }

  parameter {
    name         = "general_log"
    value        = "0"
    apply_method = "immediate"
  }

  tags = { Name = "${var.project_name}-mysql8-pg" }
}

# ─── RDS Instance (MySQL 8.0, Multi-AZ) ─────────────────────────────────────────

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db"

  engine         = "mysql"
  engine_version = "8.0.46"
  instance_class = var.db_instance_class

  storage_type          = "gp3"
  allocated_storage     = 20
  max_allocated_storage = 100

  multi_az = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  deletion_protection       = false
  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.project_name}-db-final"

  backup_retention_period = 7
  backup_window           = "04:00-05:00"
  maintenance_window      = "mon:05:00-mon:06:00"

  enabled_cloudwatch_logs_exports = ["slowquery"]

  tags = { Name = "${var.project_name}-db" }

  depends_on = [aws_cloudwatch_log_group.rds_slowquery]
}
