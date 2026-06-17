#!/usr/bin/env bash
# =============================================================
# RDS 목업 데이터 삽입 스크립트
# =============================================================
# 사용법 (프로젝트 루트에서):
#   bash scripts/seed-rds.sh
#
# 전제 조건:
#   - terraform apply 완료 (ECS 서비스 구동 상태)
#   - aws cli, python3 설치
#   - AWS 자격증명 설정 (aws configure 또는 환경변수)
#
# 동작 방식:
#   docs/mock-data.sql → S3 임시 업로드 → 사전 서명 URL 생성
#   → alpine:3.19 Fargate 태스크에서 mysql-client로 RDS 직접 삽입
#   → 완료 후 임시 태스크 정의·S3 파일 자동 삭제
# =============================================================
set -euo pipefail

REGION="ap-northeast-2"
PROJECT="wooriteam"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_FILE="$SCRIPT_DIR/../docs/mock-data.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "오류: $SQL_FILE 파일이 없습니다." >&2
  exit 1
fi

echo "=== [1/6] Terraform output 수집 ==="
cd "$SCRIPT_DIR/../infra"

CLUSTER=$(terraform output -raw ecs_cluster_name)
RDS_HOST=$(terraform output -raw rds_endpoint)
BUCKET=$(terraform output -raw frontend_bucket_name)
SUBNET=$(terraform output -json private_subnet_ids | \
  python3 -c "import sys,json; print(json.load(sys.stdin)[0])")

echo "  클러스터 : $CLUSTER"
echo "  RDS 호스트: $RDS_HOST"

echo "=== [2/6] DB 자격증명 조회 (Secrets Manager) ==="
DB_USER=$(aws secretsmanager get-secret-value \
  --secret-id "${PROJECT}/prod/db-username" --region "$REGION" \
  --query SecretString --output text | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['username'])")

DB_PASS=$(aws secretsmanager get-secret-value \
  --secret-id "${PROJECT}/prod/db-password" --region "$REGION" \
  --query SecretString --output text | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['password'])")

echo "  DB_USER : $DB_USER"

echo "=== [3/6] SQL 파일 S3 업로드 + 사전 서명 URL 생성 (유효 1시간) ==="
SQL_S3_KEY="tmp/mock-data.sql"
aws s3 cp "$SQL_FILE" "s3://${BUCKET}/${SQL_S3_KEY}" --region "$REGION"
SQL_URL=$(aws s3 presign "s3://${BUCKET}/${SQL_S3_KEY}" --expires-in 3600 --region "$REGION")
echo "  업로드 완료"

echo "=== [4/6] 네트워크·IAM 정보 수집 ==="
ECS_SG=$(aws ec2 describe-security-groups \
  --region "$REGION" \
  --filters "Name=group-name,Values=${PROJECT}-ecs-sg" \
  --query "SecurityGroups[0].GroupId" --output text)

EXEC_ROLE=$(aws iam get-role \
  --role-name "${PROJECT}-task-execution-role" \
  --query Role.Arn --output text)

echo "  ECS SG  : $ECS_SG"
echo "  서브넷  : $SUBNET"

echo "=== [5/6] 임시 Fargate 태스크 실행 (alpine + mysql-client) ==="

# Python으로 JSON 안전하게 생성 (사전 서명 URL의 특수문자 이스케이프)
CONTAINER_DEFS=$(python3 - "$RDS_HOST" "$DB_USER" "$DB_PASS" "$SQL_URL" <<'PYEOF'
import json, sys
_, rds_host, db_user, db_pass, sql_url = sys.argv
defs = [{
    "name": "db-seed",
    "image": "alpine:3.19",
    "essential": True,
    "environment": [
        {"name": "RDS_HOST", "value": rds_host},
        {"name": "DB_USER",  "value": db_user},
        {"name": "DB_PASS",  "value": db_pass},
        {"name": "SQL_URL",  "value": sql_url},
    ],
    "command": [
        "sh", "-c",
        'apk add --no-cache mysql-client wget 2>&1 | tail -1 && '
        'wget -qO /tmp/seed.sql "$SQL_URL" && '
        'mysql -h "$RDS_HOST" -u "$DB_USER" -p"$DB_PASS" wooriteam < /tmp/seed.sql && '
        'echo "SEED OK"'
    ],
    "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
            "awslogs-group":         "/ecs/wooriteam",
            "awslogs-region":        "ap-northeast-2",
            "awslogs-stream-prefix": "db-seed"
        }
    }
}]
print(json.dumps(defs))
PYEOF
)

TASK_DEF_ARN=$(aws ecs register-task-definition \
  --region "$REGION" \
  --family "${PROJECT}-db-seed" \
  --requires-compatibilities FARGATE \
  --network-mode awsvpc \
  --cpu 256 --memory 512 \
  --execution-role-arn "$EXEC_ROLE" \
  --container-definitions "$CONTAINER_DEFS" \
  --query "taskDefinition.taskDefinitionArn" --output text)

echo "  태스크 정의 등록: $TASK_DEF_ARN"

TASK_ARN=$(aws ecs run-task \
  --region "$REGION" \
  --cluster "$CLUSTER" \
  --task-definition "$TASK_DEF_ARN" \
  --launch-type FARGATE \
  --network-configuration \
    "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}" \
  --query "tasks[0].taskArn" --output text)

echo "  태스크 실행 중: $TASK_ARN"
echo "  완료까지 대기 중 (최대 10분)..."
aws ecs wait tasks-stopped --region "$REGION" --cluster "$CLUSTER" --tasks "$TASK_ARN"

EXIT_CODE=$(aws ecs describe-tasks \
  --region "$REGION" --cluster "$CLUSTER" --tasks "$TASK_ARN" \
  --query "tasks[0].containers[0].exitCode" --output text)

echo "=== [6/6] 임시 리소스 정리 ==="
aws ecs deregister-task-definition --region "$REGION" \
  --task-definition "$TASK_DEF_ARN" > /dev/null
aws s3 rm "s3://${BUCKET}/${SQL_S3_KEY}" --region "$REGION"
echo "  임시 태스크 정의·S3 파일 삭제 완료"

echo ""
if [ "$EXIT_CODE" = "0" ]; then
    echo "✓ 목업 데이터 삽입 성공"
    echo "  테스트 계정: admin@wooriteam.com / kim@example.com / lee@example.com 외"
    echo "  초기 비밀번호: password"
else
    echo "✗ 실패 (exit code: $EXIT_CODE)"
    echo "  CloudWatch 로그 확인:"
    echo "    그룹: /ecs/wooriteam   스트림 prefix: db-seed"
    exit 1
fi