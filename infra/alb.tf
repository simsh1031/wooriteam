# ─── Application Load Balancer ─────────────────────────────────────────────────

resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  ip_address_type    = "ipv4"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "${var.project_name}-alb"
    enabled = true
  }

  tags = { Name = "${var.project_name}-alb" }

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

# ─── 타겟 그룹 ───────────────────────────────────────────────────────────────────

resource "aws_lb_target_group" "main" {
  name        = "${var.project_name}-tg"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    path                = "/actuator/health"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = { Name = "${var.project_name}-tg" }
}

# ─── HTTP 리스너 (80) ────────────────────────────────────────────────────────────
# 기본 동작: CloudFront를 경유하지 않은 직접 접근은 403으로 차단
# MVP 단계에서는 ALB ↔ CloudFront 구간이 HTTP(80)로 통신 (infra.md 7-1 참고)

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Forbidden"
      status_code  = "403"
    }
  }

  tags = { Name = "${var.project_name}-http-listener" }
}

# ─── ALB 직접 접근 차단 — CloudFront 경유 트래픽만 wooriteam-tg로 forward ─────────

resource "aws_lb_listener_rule" "cloudfront_only" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  condition {
    http_header {
      http_header_name = "X-From-CloudFront"
      values           = [var.cloudfront_origin_secret]
    }
  }
}
