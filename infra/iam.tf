# ─── ECS Task Execution Role ───────────────────────────────────────────────────
# ECS가 ECR pull, CloudWatch 로그 작성, Secrets Manager 조회를 수행하는 역할

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = { Name = "${var.project_name}-task-execution-role" }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_managed" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.project_name}-task-execution-secrets-policy"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = ["arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/prod/*"]
    }]
  })
}

# ─── CI/CD IAM User (GitHub Actions) ───────────────────────────────────────────
# Console 접근 불가 (access key만 사용)

resource "aws_iam_user" "cicd" {
  name = "${var.project_name}-cicd"

  tags = { Name = "${var.project_name}-cicd" }
}

resource "aws_iam_user_policy" "cicd" {
  name = "${var.project_name}-cicd-policy"
  user = aws_iam_user.cicd.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECR"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:DescribeRepositories",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Sid    = "ECS"
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService"
        ]
        Resource = "*"
      },
      {
        Sid      = "PassRole"
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = aws_iam_role.ecs_task_execution.arn
      },
      {
        Sid    = "FrontendDeploy"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.frontend.arn,
          "${aws_s3_bucket.frontend.arn}/*"
        ]
      },
      {
        Sid      = "CloudFrontInvalidation"
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.main.id}"
      }
    ]
  })
}

# ─── Grafana Cloud IAM User ────────────────────────────────────────────────────
# Grafana Cloud의 CloudWatch 데이터소스 연동용 (Access Key 방식)

resource "aws_iam_user" "grafana" {
  name = "${var.project_name}-grafana"

  tags = { Name = "${var.project_name}-grafana" }
}

resource "aws_iam_user_policy" "grafana" {
  name = "${var.project_name}-grafana-policy"
  user = aws_iam_user.grafana.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:DescribeAlarms",
          "logs:DescribeLogGroups",
          "logs:GetLogEvents",
          "logs:StartQuery",
          "logs:GetQueryResults",
          "ec2:DescribeRegions",
          "tag:GetResources"
        ]
        Resource = "*"
      }
    ]
  })
}

# ─── Lambda IAM Role (alert-notifier) ──────────────────────────────────────────

resource "aws_iam_role" "lambda_alert" {
  name = "${var.project_name}-lambda-alert-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = { Name = "${var.project_name}-lambda-alert-role" }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_alert.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
