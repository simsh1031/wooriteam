# ─── alert-notifier Lambda (SNS → Discord) ─────────────────────────────────────

data "archive_file" "alert_notifier" {
  type        = "zip"
  source_file = "${path.module}/lambda/lambda_function.py"
  output_path = "${path.module}/lambda/lambda_alert.zip"
}

resource "aws_lambda_function" "alert_notifier" {
  function_name = "${var.project_name}-alert-notifier"
  role          = aws_iam_role.lambda_alert.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"

  filename         = data.archive_file.alert_notifier.output_path
  source_code_hash = data.archive_file.alert_notifier.output_base64sha256

  environment {
    variables = {
      DISCORD_WEBHOOK_URL = var.discord_webhook_url
    }
  }

  tags = { Name = "${var.project_name}-alert-notifier" }
}

resource "aws_sns_topic_subscription" "lambda" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.alert_notifier.arn
}

resource "aws_lambda_permission" "sns" {
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_notifier.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}
