# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**우리팀 (wooriteam)** — 대학생·비전공자를 위한 역할 중심 팀 프로젝트 구인 플랫폼.
역할(백엔드/프론트엔드/디자인/기획)별 탭으로 모집공고를 게시하고 지원할 수 있다.

상세 기획: `docs/PLAN.md` 참고

## Tech Stack

- **Backend**: Spring Boot 3.5.14 / Java 17 / Gradle
- **Security**: Spring Security + JWT (jjwt 0.12.3)
- **DB**: MySQL + Spring Data JPA (Hibernate)
- **Infra**: AWS ECS Fargate, ALB, RDS, ECR, Secrets Manager
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Etc**: Lombok, spring-dotenv

## Domain Model (ERD 요약)

| Entity | Key Columns | 설명 |
|---|---|---|
| User | id, email, password, nickname, created_at | 회원 |
| UserProfile | user_id, tech_stack, experience, is_public | 프로필 공개 (Should) |
| Post | id, user_id, title, description, difficulty, project_type, is_closed, created_at | 모집공고 |
| PostRole | id, post_id, role_type, description, tech_stack | 공고별 모집 역할 (Post 1:N) |
| Application | id, post_id, role_id, user_id, motivation, tech_stack, experience, contact, created_at | 지원 정보 |

- `role_type` ENUM: `BACKEND`, `FRONTEND`, `DESIGN`, `PLANNING`
- 하나의 Post가 여러 PostRole을 가질 수 있고, 각 역할 탭에 동시 노출됨

## MVP 범위 (Must)

- 역할 탭 분류 (백엔드/프론트엔드/디자인/기획)
- 모집공고 CRUD + 마감 처리
- 역할별 지원 폼 제출 (비회원도 열람 가능, 지원자 목록은 게시자만 조회)
- 회원 가입/로그인/로그아웃/탈퇴, 내 공고 목록, 내 지원 목록

Should/Could 범위는 `docs/plan.md` 6번 항목 참고

## Build & Run Commands

```bash
./gradlew build
./gradlew bootRun
./gradlew test
./gradlew test --tests wooriteam.ClassName
./gradlew test --tests wooriteam.ClassName.methodName
./gradlew clean build
```

## Project Structure

```
src/main/java/wooriteam/     # 메인 애플리케이션 코드
src/main/resources/
  application.yaml           # Spring Boot 설정
src/test/java/wooriteam/     # 테스트 코드
docs/
  plan.md                    # 기획안 전문
```

## Development Notes

- Java 17 필수 (Gradle toolchain 설정됨)
- 항상 `./gradlew` 사용 (시스템 Gradle 사용 금지)
- Group ID: `com.wooriteam`, Version: `0.0.1-SNAPSHOT`
- JWT secret 등 민감 설정은 환경변수로 관리 (spring-dotenv 사용)
- DB 설정은 `application.yaml` 또는 환경변수