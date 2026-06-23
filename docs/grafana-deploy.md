# Grafana CloudWatch 연동 문서

> Grafana Cloud에서 `wooriteam-grafana` IAM 사용자(Access Key)로 CloudWatch 데이터소스를 연결하고, ECS/ALB/RDS 인프라 대시보드를 구성하는 절차.
> IAM 정책은 [`infra/iam.tf`](../infra/iam.tf)의 `aws_iam_user_policy.grafana`에서 관리한다.

---

## 1. CloudWatch 데이터소스 설정

Grafana → Connections → Data sources → Add new data source → **CloudWatch**

| 필드 | 값 | 비고 |
|---|---|---|
| Auth Provider | Access & secret key | `wooriteam-grafana` IAM 사용자의 Access Key/Secret Key |
| Default Region | `ap-northeast-2` | |
| Namespaces of Custom Metrics | `wooriteam` | (커스텀 메트릭 쓸 경우) |
| Assume Role ARN | **비워둠** | `wooriteam-grafana`는 IAM **User**이고 Role이 아니라서 AssumeRole 대상이 될 수 없음 |
| Endpoint | **비워둠** | VPC endpoint 등 커스텀 엔드포인트를 쓸 때만 채우는 필드. CloudFront 도메인 등을 넣으면 안 됨 |

### 흔한 에러와 원인

**`unsupported protocol scheme ""` / `AssumeRole ... exceeded maximum number of attempts`**

- Endpoint 필드에 CloudFront 도메인 같은 값이 들어가 있어서, 스킴(`https://`) 없는 주소로 API를 호출하려다 실패하는 경우. → Endpoint 비우기.
- Assume Role ARN에 IAM **User** ARN을 넣은 경우. AssumeRole은 IAM Role 전용이라 User ARN으로는 항상 실패. → Assume Role ARN 비우고 Access/Secret Key 인증만 사용.

**Save & Test는 성공(`Successfully queried CloudWatch metrics/logs API`)했는데 대시보드 패널이 전부 `No data`**

- IAM 정책에 `ListMetrics`/`DescribeLogGroups`는 있지만 실제 데이터 조회 권한(`GetMetricData`, `GetMetricStatistics`)이 빠진 경우 발생. `infra/iam.tf`의 `aws_iam_user_policy.grafana`에 이미 포함되어 있으니 정책이 정상 적용됐는지 확인.
- (이번에 실제로 겪은 원인) **대시보드 JSON을 import할 때, 쿼리 객체에 `queryMode` / `metricQueryType` / `metricEditorMode` 필드가 빠져 있으면** Grafana UI에서 직접 패널을 만들 때와 달리 쿼리가 완전한 형태로 인식되지 않아 데이터가 안 돌아옴. 아래 2번 JSON에는 이 필드들이 포함되어 있음.

---

## 2. ECS/ALB/RDS 인프라 대시보드 Import

### 리소스 이름 (terraform output 기준, `project_name = "wooriteam"`)

| 리소스 | 이름 |
|---|---|
| ECS Cluster | `wooriteam-cluster` |
| ECS Service | `wooriteam-service` |
| ALB | `wooriteam-alb` |
| RDS Instance | `wooriteam-db` |

이 이름들은 `var.project_name` 기반으로 고정되어 있어서, **`terraform destroy` 후 다시 `apply`해도 동일하게 재생성**된다 (랜덤 suffix 없음). 즉 아래 대시보드 JSON은 인프라를 재생성해도 다시 작성할 필요 없이 그대로 재사용 가능.

> 예외: `wooriteam-grafana` IAM 사용자의 Access Key가 destroy/재생성으로 바뀌면, Grafana **데이터소스** 설정의 Access Key/Secret만 갱신하면 됨 (대시보드 JSON과는 무관).

### Import 절차

1. Grafana → Dashboards → New → **Import dashboard**
2. `docs/grafana-dashboard.json` 업로드 (또는 내용 복사해서 붙여넣기)
3. Import 화면에서 데이터소스 선택 드롭다운 → 1번에서 만든 CloudWatch 데이터소스 선택
4. **Import**

구성된 패널:

- **ECS**: CPU Utilization, Memory Utilization (`ClusterName=wooriteam-cluster`, `ServiceName=wooriteam-service`)
- **ALB**: Request Count, Target Response Time(Average + p95), 5XX Count (계정에 ALB가 하나뿐이므로 디멘션 미지정으로 자동 매칭)
- **RDS**: CPU Utilization, Database Connections, Free Storage Space (`DBInstanceIdentifier=wooriteam-db`)

자동 새로고침 30초, 기본 시간범위 6시간.

### Import 후에도 No data일 때 확인 순서

1. Explore → CloudWatch 선택 → Namespace `AWS/RDS` → Dimensions 드롭다운에서 `DBInstanceIdentifier=wooriteam-db`가 실제로 보이는지 확인 (RDS는 항상 메트릭을 내보내므로 여기서 안 보이면 데이터소스/리전 설정 문제)
2. ECS는 `desired_count > 0`로 실제 task가 떠 있어야 `CPUUtilization`/`MemoryUtilization`이 찍힘 (`aws ecs describe-services --cluster wooriteam-cluster --services wooriteam-service`)
3. 리소스를 막 재생성한 직후라면 메트릭이 쌓이기까지 몇 분 정도 지연될 수 있음

---

## 3. 대시보드 JSON 전문 (`docs/grafana-dashboard.json`)

```json
{
  "__inputs": [
    {
      "name": "DS_CLOUDWATCH",
      "label": "CloudWatch",
      "description": "",
      "type": "datasource",
      "pluginId": "cloudwatch",
      "pluginName": "CloudWatch"
    }
  ],
  "__elements": {},
  "__requires": [
    {
      "type": "datasource",
      "id": "cloudwatch",
      "name": "CloudWatch",
      "version": "1.0.0"
    },
    {
      "type": "panel",
      "id": "timeseries",
      "name": "Time series",
      "version": ""
    }
  ],
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": { "type": "grafana", "uid": "-- Grafana --" },
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 1,
  "links": [],
  "panels": [
    {
      "title": "ECS",
      "type": "row",
      "collapsed": false,
      "gridPos": { "h": 1, "w": 24, "x": 0, "y": 0 },
      "id": 100,
      "panels": []
    },
    {
      "title": "ECS CPU Utilization",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 1 },
      "id": 1,
      "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
      "fieldConfig": { "defaults": { "unit": "percent" }, "overrides": [] },
      "targets": [
        {
          "refId": "A",
          "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
          "queryMode": "Metrics",
          "metricQueryType": 0,
          "metricEditorMode": 0,
          "namespace": "AWS/ECS",
          "metricName": "CPUUtilization",
          "statistic": "Average",
          "dimensions": { "ClusterName": "wooriteam-cluster", "ServiceName": "wooriteam-service" },
          "matchExact": true,
          "region": "default",
          "id": "",
          "expression": "",
          "label": "",
          "period": ""
        }
      ]
    },
    {
      "title": "ECS Memory Utilization",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 1 },
      "id": 2,
      "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
      "fieldConfig": { "defaults": { "unit": "percent" }, "overrides": [] },
      "targets": [
        {
          "refId": "A",
          "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
          "queryMode": "Metrics",
          "metricQueryType": 0,
          "metricEditorMode": 0,
          "namespace": "AWS/ECS",
          "metricName": "MemoryUtilization",
          "statistic": "Average",
          "dimensions": { "ClusterName": "wooriteam-cluster", "ServiceName": "wooriteam-service" },
          "matchExact": true,
          "region": "default",
          "id": "",
          "expression": "",
          "label": "",
          "period": ""
        }
      ]
    },
    {
      "title": "ALB",
      "type": "row",
      "collapsed": false,
      "gridPos": { "h": 1, "w": 24, "x": 0, "y": 9 },
      "id": 200,
      "panels": []
    },
    {
      "title": "ALB Request Count",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 8, "x": 0, "y": 10 },
      "id": 3,
      "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
      "fieldConfig": { "defaults": {}, "overrides": [] },
      "targets": [
        {
          "refId": "A",
          "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
          "queryMode": "Metrics",
          "metricQueryType": 0,
          "metricEditorMode": 0,
          "namespace": "AWS/ApplicationELB",
          "metricName": "RequestCount",
          "statistic": "Sum",
          "dimensions": {},
          "matchExact": false,
          "region": "default",
          "id": "",
          "expression": "",
          "label": "",
          "period": ""
        }
      ]
    },
    {
      "title": "ALB Target Response Time",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 8, "x": 8, "y": 10 },
      "id": 4,
      "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
      "fieldConfig": { "defaults": { "unit": "s" }, "overrides": [] },
      "targets": [
        {
          "refId": "A",
          "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
          "queryMode": "Metrics",
          "metricQueryType": 0,
          "metricEditorMode": 0,
          "namespace": "AWS/ApplicationELB",
          "metricName": "TargetResponseTime",
          "statistic": "Average",
          "dimensions": {},
          "matchExact": false,
          "region": "default",
          "id": "",
          "expression": "",
          "label": "",
          "period": ""
        },
        {
          "refId": "B",
          "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
          "queryMode": "Metrics",
          "metricQueryType": 0,
          "metricEditorMode": 0,
          "namespace": "AWS/ApplicationELB",
          "metricName": "TargetResponseTime",
          "statistic": "p95",
          "dimensions": {},
          "matchExact": false,
          "region": "default",
          "id": "",
          "expression": "",
          "label": "",
          "period": ""
        }
      ]
    },
    {
      "title": "ALB 5XX Count",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 8, "x": 16, "y": 10 },
      "id": 5,
      "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
      "fieldConfig": { "defaults": {}, "overrides": [] },
      "targets": [
        {
          "refId": "A",
          "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
          "queryMode": "Metrics",
          "metricQueryType": 0,
          "metricEditorMode": 0,
          "namespace": "AWS/ApplicationELB",
          "metricName": "HTTPCode_Target_5XX_Count",
          "statistic": "Sum",
          "dimensions": {},
          "matchExact": false,
          "region": "default",
          "id": "",
          "expression": "",
          "label": "",
          "period": ""
        }
      ]
    },
    {
      "title": "RDS",
      "type": "row",
      "collapsed": false,
      "gridPos": { "h": 1, "w": 24, "x": 0, "y": 18 },
      "id": 300,
      "panels": []
    },
    {
      "title": "RDS CPU Utilization",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 8, "x": 0, "y": 19 },
      "id": 6,
      "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
      "fieldConfig": { "defaults": { "unit": "percent" }, "overrides": [] },
      "targets": [
        {
          "refId": "A",
          "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
          "queryMode": "Metrics",
          "metricQueryType": 0,
          "metricEditorMode": 0,
          "namespace": "AWS/RDS",
          "metricName": "CPUUtilization",
          "statistic": "Average",
          "dimensions": { "DBInstanceIdentifier": "wooriteam-db" },
          "matchExact": true,
          "region": "default",
          "id": "",
          "expression": "",
          "label": "",
          "period": ""
        }
      ]
    },
    {
      "title": "RDS Database Connections",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 8, "x": 8, "y": 19 },
      "id": 7,
      "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
      "fieldConfig": { "defaults": {}, "overrides": [] },
      "targets": [
        {
          "refId": "A",
          "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
          "queryMode": "Metrics",
          "metricQueryType": 0,
          "metricEditorMode": 0,
          "namespace": "AWS/RDS",
          "metricName": "DatabaseConnections",
          "statistic": "Average",
          "dimensions": { "DBInstanceIdentifier": "wooriteam-db" },
          "matchExact": true,
          "region": "default",
          "id": "",
          "expression": "",
          "label": "",
          "period": ""
        }
      ]
    },
    {
      "title": "RDS Free Storage Space",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 8, "x": 16, "y": 19 },
      "id": 8,
      "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
      "fieldConfig": { "defaults": { "unit": "bytes" }, "overrides": [] },
      "targets": [
        {
          "refId": "A",
          "datasource": { "type": "cloudwatch", "uid": "${DS_CLOUDWATCH}" },
          "queryMode": "Metrics",
          "metricQueryType": 0,
          "metricEditorMode": 0,
          "namespace": "AWS/RDS",
          "metricName": "FreeStorageSpace",
          "statistic": "Average",
          "dimensions": { "DBInstanceIdentifier": "wooriteam-db" },
          "matchExact": true,
          "region": "default",
          "id": "",
          "expression": "",
          "label": "",
          "period": ""
        }
      ]
    }
  ],
  "refresh": "30s",
  "schemaVersion": 39,
  "tags": ["wooriteam", "infra", "cloudwatch"],
  "templating": { "list": [] },
  "time": { "from": "now-6h", "to": "now" },
  "timepicker": {},
  "timezone": "",
  "title": "wooriteam Infra (ECS/ALB/RDS)",
  "uid": "wooriteam-infra",
  "version": 1,
  "weekStart": ""
}
```