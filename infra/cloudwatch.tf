# ─── 로그 그룹 ───────────────────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 30

  tags = { Name = "${var.project_name}-app-logs" }
}

resource "aws_cloudwatch_log_group" "alb_access" {
  name              = "/ecs/${var.project_name}/access"
  retention_in_days = 14

  tags = { Name = "${var.project_name}-alb-access-logs" }
}

resource "aws_cloudwatch_log_group" "rds_slowquery" {
  name              = "/aws/rds/instance/${var.project_name}-db/slowquery"
  retention_in_days = 7

  tags = { Name = "${var.project_name}-rds-slowquery-logs" }
}

# ─── SNS Topic (알람 통지) ──────────────────────────────────────────────────────

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"

  tags = { Name = "${var.project_name}-alerts" }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ─── CloudWatch 알람 ─────────────────────────────────────────────────────────────

# ECS CPU > 70% (3분) → Auto Scaling 스케일 아웃
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 70

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  alarm_actions = [aws_appautoscaling_policy.scale_out.arn]

  tags = { Name = "${var.project_name}-ecs-cpu-high" }
}

# ECS CPU > 90% (2분) → SNS
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_critical" {
  alarm_name          = "${var.project_name}-ecs-cpu-critical"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 90

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = { Name = "${var.project_name}-ecs-cpu-critical" }
}

# ECS Memory > 80% (5분) → SNS
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = { Name = "${var.project_name}-ecs-memory-high" }
}

# ECS RunningTaskCount < 2 (1분) → SNS
resource "aws_cloudwatch_metric_alarm" "ecs_task_count_low" {
  alarm_name          = "${var.project_name}-ecs-task-count-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "Average"
  threshold           = 2

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = { Name = "${var.project_name}-ecs-task-count-low" }
}

# ALB 5xx > 5건 (1분) → SNS
resource "aws_cloudwatch_metric_alarm" "alb_5xx_high" {
  alarm_name          = "${var.project_name}-alb-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"

  tags = { Name = "${var.project_name}-alb-5xx-high" }
}

# ALB 4xx > 50건 (5분) → SNS
resource "aws_cloudwatch_metric_alarm" "alb_4xx_high" {
  alarm_name          = "${var.project_name}-alb-4xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "HTTPCode_Target_4XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 50

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"

  tags = { Name = "${var.project_name}-alb-4xx-high" }
}

# ALB TargetResponseTime p95 > 2초 (5분) → SNS
resource "aws_cloudwatch_metric_alarm" "alb_latency_high" {
  alarm_name          = "${var.project_name}-alb-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  extended_statistic  = "p95"
  threshold           = 2

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"

  tags = { Name = "${var.project_name}-alb-latency-high" }
}

# RDS DatabaseConnections > 50개 (1분) → SNS
resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${var.project_name}-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 50

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = { Name = "${var.project_name}-rds-connections-high" }
}

# RDS CPU > 80% (5분) → SNS
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = { Name = "${var.project_name}-rds-cpu-high" }
}

# RDS FreeStorageSpace < 5GB (5분) → SNS
resource "aws_cloudwatch_metric_alarm" "rds_freestorage_low" {
  alarm_name          = "${var.project_name}-rds-freestorage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 5
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 5 * 1024 * 1024 * 1024 # 5GB (bytes)

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = { Name = "${var.project_name}-rds-freestorage-low" }
}

# RDS ReplicaLag(Multi-AZ failover 지연) > 30초 (1분) → SNS
resource "aws_cloudwatch_metric_alarm" "rds_replica_lag" {
  alarm_name          = "${var.project_name}-rds-replica-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 30

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"

  tags = { Name = "${var.project_name}-rds-replica-lag" }
}

# ─── CloudWatch Dashboard ───────────────────────────────────────────────────────

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title = "ECS CPU Utilization"
          metrics = [["AWS/ECS", "CPUUtilization",
            "ClusterName", aws_ecs_cluster.main.name,
          "ServiceName", aws_ecs_service.main.name]]
          period = 60, stat = "Average", view = "timeSeries", region = var.aws_region
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title = "ECS Memory Utilization"
          metrics = [["AWS/ECS", "MemoryUtilization",
            "ClusterName", aws_ecs_cluster.main.name,
          "ServiceName", aws_ecs_service.main.name]]
          period = 60, stat = "Average", view = "timeSeries", region = var.aws_region
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title = "ALB 5xx Count"
          metrics = [["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count",
          "LoadBalancer", aws_lb.main.arn_suffix]]
          period = 60, stat = "Sum", view = "timeSeries", region = var.aws_region
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title = "ALB Response Time (p95)"
          metrics = [["AWS/ApplicationELB", "TargetResponseTime",
          "LoadBalancer", aws_lb.main.arn_suffix]]
          period = 60, stat = "p95", view = "timeSeries", region = var.aws_region
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title = "RDS CPU Utilization"
          metrics = [["AWS/RDS", "CPUUtilization",
          "DBInstanceIdentifier", aws_db_instance.main.identifier]]
          period = 60, stat = "Average", view = "timeSeries", region = var.aws_region
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title = "RDS Database Connections"
          metrics = [["AWS/RDS", "DatabaseConnections",
          "DBInstanceIdentifier", aws_db_instance.main.identifier]]
          period = 60, stat = "Average", view = "timeSeries", region = var.aws_region
        }
      }
    ]
  })
}
