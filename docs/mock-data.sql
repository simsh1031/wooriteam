-- =============================================================
-- 우리팀 (wooriteam) 목업 데이터
-- =============================================================
-- 용도 : RDS 재생성 후 초기 데이터 삽입
-- 대상 : users, user_profiles, posts, post_roles, applications,
--        project_groups, group_members
-- 실행 : mysql -h <RDS_ENDPOINT> -u <USER> -p wooriteam < docs/mock-data.sql
--
-- [모든 테스트 계정 비밀번호] : password
-- BCrypt(10) 해시 : $2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC
--
-- 해시 검증 실패 시 아래 명령으로 새 해시를 발급해 이 파일의 password 컬럼 값을 교체하세요:
--   ./gradlew test --tests wooriteam.util.BcryptHashPrinter
--   (또는 https://bcrypt-generator.com 에서 rounds=10, plaintext=password 로 생성)
-- =============================================================

USE wooriteam;

-- 외래키 무결성 검사 임시 해제 + AUTO_INCREMENT 초기화
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE applications;
TRUNCATE TABLE post_roles;
TRUNCATE TABLE group_members;
TRUNCATE TABLE posts;
TRUNCATE TABLE project_groups;
TRUNCATE TABLE user_profiles;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- 1. users  (id 1~18)
-- =============================================================
INSERT INTO users (email, password, nickname, created_at) VALUES
  ('admin@wooriteam.com', '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '우리팀어드민', NOW() - INTERVAL 40 DAY),
  ('kim@example.com',     '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '김철수',       NOW() - INTERVAL 37 DAY),
  ('lee@example.com',     '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '이영희',       NOW() - INTERVAL 34 DAY),
  ('park@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '박민준',       NOW() - INTERVAL 31 DAY),
  ('choi@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '최지은',       NOW() - INTERVAL 28 DAY),
  ('jung@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '정수빈',       NOW() - INTERVAL 25 DAY),
  ('kang@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '강도현',       NOW() - INTERVAL 22 DAY),
  ('yoon@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '윤서아',       NOW() - INTERVAL 19 DAY),
  ('song@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '송지호',       NOW() - INTERVAL 17 DAY),
  ('han@example.com',     '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '한예진',       NOW() - INTERVAL 15 DAY),
  ('oh@example.com',      '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '오승민',       NOW() - INTERVAL 13 DAY),
  ('seo@example.com',     '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '서연우',       NOW() - INTERVAL 11 DAY),
  ('shin@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '신민서',       NOW() - INTERVAL 9  DAY),
  ('kwon@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '권태양',       NOW() - INTERVAL 7  DAY),
  ('hong@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '홍길동',       NOW() - INTERVAL 5  DAY),
  ('bae@example.com',     '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '배수지',       NOW() - INTERVAL 4  DAY),
  ('moon@example.com',    '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '문가영',       NOW() - INTERVAL 2  DAY),
  ('ryu@example.com',     '$2a$10$m.5YhM5etUUzD6JKkV/eduZz0LckLg0QFPjB8wPMTGHa4LIyfVuZC', '류현진',       NOW() - INTERVAL 1  DAY);

-- =============================================================
-- 2. user_profiles  (user_id 1~14, is_public=true 8명)
-- =============================================================
INSERT INTO user_profiles (user_id, tech_stack, career_type, experience, is_public, contact_email) VALUES
  (1,  'Java, Spring Boot, MySQL, Docker, AWS',
       'JUNIOR',
       'Spring Boot 기반 REST API 개발 1년. AWS ECS/RDS 배포 및 운영 경험.',
       true,  'admin@wooriteam.com'),
  (2,  'React, TypeScript, Tailwind CSS, Next.js',
       'MAJOR_STUDENT',
       '컴퓨터공학과 3학년. 리액트 개인 프로젝트 3개, IT 스타트업 프론트 인턴 6개월.',
       true,  'kim@example.com'),
  (3,  'Figma, Adobe XD, Illustrator, Protopie',
       'MAJOR_STUDENT',
       '시각디자인 전공. 앱·웹 UI/UX 포트폴리오 5개. 졸업 전시 출품 경험.',
       true,  'lee@example.com'),
  (4,  'Notion, Jira, Google Analytics, Figma',
       'NON_MAJOR_STUDENT',
       '경영학과 재학 중. 교내 창업 동아리 기획 팀장. 앱 기획서 2개 작성, IR 발표 경험.',
       false, 'park@example.com'),
  (5,  'Python, FastAPI, PostgreSQL, Redis',
       'BOOTCAMP',
       '백엔드 부트캠프 수료. FastAPI·Django 기반 REST API 구현, 개인 프로젝트 AWS 배포.',
       true,  'choi@example.com'),
  (6,  'Java, Spring Boot, Kafka, MySQL',
       'JOB_SEEKER',
       '백엔드 개발자 취업 준비 중. 사이드 프로젝트 3개, 카프카 기반 메시징 시스템 구축 경험.',
       false, 'jung@example.com'),
  (7,  'React, TypeScript, Next.js, GraphQL',
       'SENIOR',
       '프론트엔드 개발 5년차. 대규모 커머스 서비스 리뉴얼 리드 경험.',
       true,  'kang@example.com'),
  (8,  'Figma, Sketch, Zeplin, Principle',
       'MAJOR_STUDENT',
       '산업디자인과 재학 중. UX 리서치 기반 앱 리디자인 프로젝트 2개.',
       false, 'yoon@example.com'),
  (9,  'Notion, Miro, Google Analytics',
       'NON_MAJOR_STUDENT',
       '사회학과 재학 중. 커뮤니티 서비스 기획 동아리 운영, IR 데모데이 발표 경험.',
       true,  'song@example.com'),
  (10, 'Node.js, Express, MongoDB, Socket.io',
       'BOOTCAMP',
       '백엔드 부트캠프 수료. Node.js 기반 REST API 및 소켓 통신 프로젝트 진행.',
       false, 'han@example.com'),
  (11, 'Kotlin, Spring Boot, Redis, AWS',
       'JUNIOR',
       '스프링 기반 사이드 프로젝트 다수 런칭. 사이드프로젝트 빌더스 그룹 운영진.',
       true,  'oh@example.com'),
  (12, 'Vue, Nuxt, Pinia, TypeScript',
       'MAJOR_STUDENT',
       '정보통신공학과 재학 중. Vue 기반 웹 서비스 2개 배포.',
       false, 'seo@example.com'),
  (13, 'Figma, Framer, After Effects',
       'OTHER',
       '프리랜서 디자이너. 모션 그래픽 및 인터랙션 디자인 다수 진행.',
       true,  'shin@example.com'),
  (14, 'Notion, Jira, Confluence',
       'JOB_SEEKER',
       '서비스 기획 직무 취업 준비 중. PM 부트캠프 수료, 기획서 3건 작성.',
       false, 'kwon@example.com');

-- =============================================================
-- 3. project_groups  (id 1~6)
-- =============================================================
-- group 1 : AWS 클라우드 스터디 그룹 (owner 1)
-- group 2 : UI/UX 디자인 컬렉티브 (owner 3)
-- group 3 : 백엔드 개발자 모임 (owner 5)
-- group 4 : 프론트엔드 위클리 (owner 7)
-- group 5 : 기획자 네트워크 (owner 9)
-- group 6 : 사이드프로젝트 빌더스 (owner 11)
INSERT INTO project_groups (owner_id, name, description, created_at) VALUES
  (1,  'AWS 클라우드 스터디 그룹',
       'AWS 자격증 취득과 실전 배포 경험 공유를 목표로 하는 스터디 그룹입니다.',
       NOW() - INTERVAL 35 DAY),
  (3,  'UI/UX 디자인 컬렉티브',
       '디자인 전공·비전공 무관, 포트폴리오 합평과 협업 프로젝트를 함께하는 그룹입니다.',
       NOW() - INTERVAL 30 DAY),
  (5,  '백엔드 개발자 모임',
       'Spring/FastAPI 등 백엔드 기술을 함께 학습하고 사이드 프로젝트를 진행하는 모임입니다.',
       NOW() - INTERVAL 24 DAY),
  (7,  '프론트엔드 위클리',
       '매주 프론트엔드 신기술과 사이드 프로젝트 진행 상황을 공유하는 모임입니다.',
       NOW() - INTERVAL 18 DAY),
  (9,  '기획자 네트워크',
       '서비스 기획자·PM 지망생들이 모여 기획서를 리뷰하고 네트워킹하는 그룹입니다.',
       NOW() - INTERVAL 12 DAY),
  (11, '사이드프로젝트 빌더스',
       '아이디어부터 런칭까지, 직접 만들어보는 사람들의 사이드 프로젝트 빌더 모임입니다.',
       NOW() - INTERVAL 6 DAY);

-- =============================================================
-- 4. group_members  (project_groups id 1~6 에 종속, APPROVED 11명)
-- =============================================================
INSERT INTO group_members (group_id, user_id, status, joined_at, introduction, experience, portfolio_link, email) VALUES
  (1, 2,  'APPROVED', NOW() - INTERVAL 33 DAY, 'AWS 자격증 준비 중인 백엔드 지망생입니다.',          'Spring Boot 사이드 프로젝트 2개, EC2 배포 경험.', NULL, 'kim@example.com'),
  (1, 4,  'APPROVED', NOW() - INTERVAL 30 DAY, '클라우드 인프라에 관심 많은 기획 전공자입니다.',      '교내 창업 동아리에서 AWS 기반 서비스 기획 참여.', NULL, 'park@example.com'),
  (1, 6,  'PENDING',  NOW() - INTERVAL 2  DAY, '백엔드 취업 준비 중 AWS 실습이 필요해 신청합니다.',  'Kafka 기반 메시징 시스템 구축 경험.',            NULL, 'jung@example.com'),
  (2, 3,  'APPROVED', NOW() - INTERVAL 28 DAY, '시각디자인 전공, 포트폴리오 합평에 참여하고 싶습니다.', 'UI/UX 포트폴리오 5개 보유.',                     'https://behance.net/leeyounghee', 'lee@example.com'),
  (2, 8,  'APPROVED', NOW() - INTERVAL 17 DAY, '산업디자인 전공, 앱 리디자인 경험을 나누고 싶습니다.', 'UX 리서치 기반 리디자인 프로젝트 2개.',           NULL, 'yoon@example.com'),
  (2, 10, 'PENDING',  NOW() - INTERVAL 1  DAY, '디자인에도 관심 있는 백엔드 부트캠프 수료생입니다.',  'Node.js 기반 프로젝트 UI 일부 직접 디자인.',     NULL, 'han@example.com'),
  (3, 5,  'APPROVED', NOW() - INTERVAL 22 DAY, 'FastAPI 기반 백엔드 경험을 공유하고 싶습니다.',       '부트캠프 수료, 개인 프로젝트 AWS 배포 경험.',     NULL, 'choi@example.com'),
  (3, 12, 'APPROVED', NOW() - INTERVAL 10 DAY, '백엔드 기술도 익히고 싶은 프론트엔드 전공생입니다.', 'Vue 기반 웹 서비스 2개 배포.',                   NULL, 'seo@example.com'),
  (4, 7,  'APPROVED', NOW() - INTERVAL 16 DAY, '프론트엔드 5년차, 신기술 스터디 운영하고 있습니다.', '커머스 서비스 리뉴얼 리드 경험.',                'https://github.com/kangdohyun', 'kang@example.com'),
  (4, 14, 'APPROVED', NOW() - INTERVAL 6  DAY, '기획자지만 프론트엔드 트렌드도 함께 보고 싶습니다.', 'PM 부트캠프 수료, 기획서 3건 작성.',             NULL, 'kwon@example.com'),
  (5, 9,  'APPROVED', NOW() - INTERVAL 11 DAY, '커뮤니티 서비스 기획 동아리를 운영하고 있습니다.',   'IR 데모데이 발표 경험.',                         NULL, 'song@example.com'),
  (5, 16, 'PENDING',  NOW() - INTERVAL 3  DAY, '기획 직무로 커리어 전환을 고민 중입니다.',           '마케팅 직무 2년차, 서비스 기획 학습 중.',         NULL, 'bae@example.com'),
  (6, 11, 'APPROVED', NOW() - INTERVAL 5  DAY, '사이드 프로젝트 다수 런칭 경험을 공유합니다.',       'Spring Boot 기반 사이드 프로젝트 운영진.',       'https://github.com/ohseungmin', 'oh@example.com'),
  (6, 18, 'APPROVED', NOW() - INTERVAL 1  DAY, '직접 만들어보는 프로젝트에 참여하고 싶습니다.',      '개인 토이 프로젝트 다수 진행.',                  NULL, 'ryu@example.com');

-- =============================================================
-- 5. posts  (id 1~12)
-- =============================================================
-- post 1  : 헬스케어 앱 (user 1, 활성)
-- post 2  : 졸업작품 (user 2, 활성)
-- post 3  : 해커톤 (user 3, 활성)
-- post 4  : 알고리즘 스터디 (user 4, 활성)
-- post 5  : 에듀테크 사이드 프로젝트 (user 1, 활성, ADVANCED)
-- post 6  : 교내 공모전 웹앱 (user 5, 활성)
-- post 7  : 마감된 과거 공고 (user 2, is_closed=true)
-- post 8  : AWS 스터디 그룹 공고 (user 6, group 1, 활성)
-- post 9  : 디자인 컬렉티브 포트폴리오 챌린지 (user 8, group 2, 활성)
-- post 10 : 프론트엔드 위클리 대시보드 라이브러리 (user 7, group 4, 활성)
-- post 11 : 기획자 네트워크 커뮤니티 앱 기획 (user 9, group 5, 활성)
-- post 12 : 사이드프로젝트 빌더스 MVP 회고 스터디 (user 11, group 6, is_closed=true)
INSERT INTO posts
  (user_id, group_id, title, description, difficulty, project_type,
   is_closed, application_deadline, project_start_date, project_end_date, created_at)
VALUES
  (1, NULL,
   '헬스케어 앱 팀원 모집 — 운동 기록 & 식단 관리',
   '사용자가 운동 루틴과 식단을 기록하고, AI 추천을 받을 수 있는 헬스케어 앱을 개발합니다.\n\n'
   '주요 기능: 운동 기록/분석, 식단 입력, 주간 리포트, 친구 랭킹.\n'
   'Spring Boot(백엔드) + React Native(앱) 조합을 사용할 예정입니다.\n'
   '매주 토요일 온라인 스크럼, Notion·GitHub으로 협업.',
   'INTERMEDIATE', 'SIDE_PROJECT',
   false, '2026-07-20', '2026-08-01', '2026-12-31',
   NOW() - INTERVAL 12 DAY),

  (2, NULL,
   '졸업작품 팀원 구해요 — 지역 소상공인 매칭 플랫폼',
   '동네 소상공인과 단기 인력(대학생)을 연결하는 매칭 플랫폼 졸업작품입니다.\n\n'
   '기능: 사장님 공고 등록, 학생 프로필 매칭, 채팅, 결제 연동(KG이니시스).\n'
   'Vue 3 + Spring Boot + MySQL 스택 사용 예정.\n'
   '2학기 개시 전까지 설계·MVP 완성이 목표입니다.',
   'INTERMEDIATE', 'GRADUATION',
   false, '2026-07-10', '2026-09-01', '2027-02-28',
   NOW() - INTERVAL 9 DAY),

  (3, NULL,
   '멋쟁이사자처럼 아이디어톤 같이 나가실 분 (7/5~7/6)',
   '멋쟁이사자처럼 주관 아이디어톤에 참가할 팀을 구합니다!\n\n'
   '주제: 사회문제 해결을 위한 디지털 솔루션 (발표 당일 공개).\n'
   'PPT 기획·디자인부터 간단한 프로토타입 구현까지 이틀 내 완성.\n'
   '코딩 실력보다 아이디어와 소통이 중요합니다. 초보 환영!',
   'BEGINNER', 'HACKATHON',
   false, '2026-06-30', '2026-07-05', '2026-07-06',
   NOW() - INTERVAL 6 DAY),

  (4, NULL,
   '알고리즘 스터디 모집 — 코딩테스트 합격까지 같이 달려요',
   'LeetCode & 백준 기반으로 꾸준히 문제 풀 스터디를 구합니다.\n\n'
   '진행 방식: 매주 문제 3개 각자 풀기 → 주 1회 온라인 코드 리뷰 (60분).\n'
   '목표: 취업 코딩테스트 통과 / 대회 입상.\n'
   '언어 무관, 꾸준히 참여할 분이면 누구나 환영입니다.',
   'BEGINNER', 'STUDY',
   false, '2026-07-15', '2026-07-20', '2026-12-20',
   NOW() - INTERVAL 4 DAY),

  (1, NULL,
   '에듀테크 스타트업 사이드 프로젝트 — AI 학습 코칭 앱',
   '학습 데이터를 분석해 개인화 코칭 플랜을 제공하는 AI 앱을 만들고 싶습니다.\n\n'
   '기술 스택: Spring Boot + LangChain4j (백엔드), React + TanStack Query (웹), Flutter (앱).\n'
   'AWS 기반 배포, 모노레포 구성 예정.\n'
   '실제 서비스를 목표로 하며 지분 논의 가능합니다. 성장 욕심 있는 분 환영.',
   'ADVANCED', 'SIDE_PROJECT',
   false, '2026-08-10', '2026-09-15', '2027-03-31',
   NOW() - INTERVAL 2 DAY),

  (5, NULL,
   '교내 공모전 웹앱 팀원 모집 (8월 마감)',
   '학과 공모전(주제: 캠퍼스 생활 편의 향상) 출품 팀을 구합니다.\n\n'
   '기능: 강의실 빈자리 알림, 도서관 좌석 현황, 시간표 공유.\n'
   'React + FastAPI 스택 예정. 공모전 출품 실적이 필요하신 분 환영.',
   'BEGINNER', 'OTHER',
   false, '2026-07-05', '2026-07-10', '2026-08-31',
   NOW() - INTERVAL 1 DAY),

  (2, NULL,
   '[마감] 포트폴리오 사이트 리뉴얼 팀 프로젝트',
   '개인 포트폴리오 사이트를 함께 리뉴얼할 팀을 구했습니다. (모집 완료)',
   'BEGINNER', 'SIDE_PROJECT',
   true, '2026-05-01', '2026-05-15', '2026-08-31',
   NOW() - INTERVAL 30 DAY),

  (6, 1,
   'AWS 클라우드 스터디 그룹 — 자격증반 + 실전 배포 프로젝트',
   'AWS 클라우드 스터디 그룹에서 진행하는 실전 배포 프로젝트입니다.\n\n'
   'SAA 자격증 스터디와 함께, 실제 서비스를 ECS/RDS에 배포해보는 실습을 병행합니다.\n'
   '주 2회 온라인 모임, Notion으로 진도 관리.',
   'INTERMEDIATE', 'STUDY',
   false, '2026-07-25', '2026-08-01', '2026-10-31',
   NOW() - INTERVAL 20 DAY),

  (8, 2,
   '디자인 컬렉티브 포트폴리오 챌린지 — 가상 앱 리디자인',
   'UI/UX 디자인 컬렉티브 그룹에서 진행하는 포트폴리오 챌린지입니다.\n\n'
   '기존 서비스 하나를 골라 4주간 리디자인하고 케이스 스터디로 정리합니다.\n'
   '주 1회 온라인 합평, 최종 결과물은 Behance에 공동 업로드.',
   'INTERMEDIATE', 'SIDE_PROJECT',
   false, '2026-07-18', '2026-07-25', '2026-08-22',
   NOW() - INTERVAL 15 DAY),

  (7, 4,
   '프론트엔드 위클리 — 사내 대시보드 UI 라이브러리 제작',
   '프론트엔드 위클리 모임에서 진행하는 오픈소스 UI 라이브러리 프로젝트입니다.\n\n'
   'React + TypeScript 기반 컴포넌트 라이브러리를 만들고 Storybook으로 문서화합니다.\n'
   '실무에 바로 적용 가능한 수준의 컴포넌트 설계 경험을 쌓을 수 있습니다.',
   'INTERMEDIATE', 'SIDE_PROJECT',
   false, '2026-07-30', '2026-08-05', '2026-11-30',
   NOW() - INTERVAL 10 DAY),

  (9, 5,
   '기획자 네트워크 — 동네 커뮤니티 앱 공동 기획',
   '기획자 네트워크 그룹에서 진행하는 커뮤니티 앱 공동 기획 프로젝트입니다.\n\n'
   '동네 기반 소모임 매칭 서비스를 기획하고, 실제 개발팀에 전달할 기획서를 완성합니다.\n'
   '사용자 인터뷰, 와이어프레임, IA 설계까지 전 과정을 함께 합니다.',
   'BEGINNER', 'SIDE_PROJECT',
   false, '2026-07-12', '2026-07-20', '2026-09-30',
   NOW() - INTERVAL 8 DAY),

  (11, 6,
   '[마감] 사이드프로젝트 빌더스 — MVP 런칭 회고 스터디',
   'MVP를 런칭해본 경험을 나누는 회고 스터디였습니다. (모집 완료)',
   'BEGINNER', 'STUDY',
   true, '2026-06-01', '2026-06-10', '2026-06-30',
   NOW() - INTERVAL 25 DAY);

-- =============================================================
-- 6. post_roles  (post_id 1~12 에 종속)
-- =============================================================
-- post 1 (헬스케어 앱) → 3개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (1, 'BACKEND',  'Spring Boot REST API 개발, MySQL 스키마 설계, AWS 배포 담당.',              'Java, Spring Boot, JPA, MySQL, Docker'),
  (1, 'FRONTEND', 'React Native 앱 UI 구현, 백엔드 API 연동, 운동 기록 화면 개발.',          'React Native, TypeScript, Expo'),
  (1, 'DESIGN',   '앱 와이어프레임 및 UI 디자인, 디자인 시스템 구축, 프로토타입 제작.',       'Figma, Protopie');

-- post 2 (졸업작품) → 3개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (2, 'BACKEND',  'Spring Boot 서버 개발, 결제 API 연동(KG이니시스), 매칭 알고리즘 구현.', 'Java, Spring Boot, MySQL, Redis'),
  (2, 'FRONTEND', 'Vue 3 기반 웹 프론트엔드 구현, 채팅 UI, 대시보드 개발.',               'Vue 3, TypeScript, Pinia'),
  (2, 'PLANNING', '서비스 기획, 사용자 인터뷰, 요구사항 정의, 발표 자료 제작.',             'Notion, Figma, Google Slides');

-- post 3 (아이디어톤) → 4개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (3, 'BACKEND',  '간단한 프로토타입 서버 구현 (선택 사항, 아이디어에 따라 유동적).', 'Python, FastAPI'),
  (3, 'FRONTEND', '프로토타입 웹/앱 화면 구현 (2일 내 MVP 가능한 수준).', 'React, Vite'),
  (3, 'DESIGN',   '발표 PPT 디자인 및 UI 목업 제작. 브랜딩 아이덴티티 설정.',  'Figma, Canva'),
  (3, 'PLANNING', '아이디어 기획, 린캔버스 작성, 발표 스크립트 작성 및 발표.',  'Notion, Google Slides');

-- post 4 (알고리즘 스터디) → 2개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (4, 'BACKEND',  '백엔드·서버 직군 지향자. Python / Java / C++ 중 선택.',  'Python, Java, C++'),
  (4, 'FRONTEND', '프론트엔드 직군 지향자. JavaScript / TypeScript 위주.', 'JavaScript, TypeScript');

-- post 5 (에듀테크 사이드 프로젝트) → 3개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (5, 'BACKEND',  'Spring Boot API 서버 + LangChain4j AI 파이프라인 구현. 시스템 아키텍처 설계 참여.', 'Java, Spring Boot, LangChain4j, AWS'),
  (5, 'FRONTEND', 'React 웹 대시보드 + TanStack Query 데이터 캐싱. 학습 통계 시각화 (Chart.js).', 'React, TypeScript, TanStack Query, Chart.js'),
  (5, 'DESIGN',   'AI 코칭 UX 설계, 디자인 시스템 구축, 웹·앱 일관된 비주얼 아이덴티티 관리.', 'Figma, Storybook');

-- post 6 (교내 공모전) → 2개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (6, 'FRONTEND', '강의실·도서관 좌석 현황 웹 화면 개발. 반응형 UI 구현.', 'React, TypeScript, Tailwind CSS'),
  (6, 'DESIGN',   '서비스 UI 디자인, 공모전 발표 자료(PPT) 디자인.',       'Figma, PowerPoint');

-- post 7 (마감된 공고) → 2개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (7, 'FRONTEND', '포트폴리오 사이트 웹 구현 (모집 완료).', 'React, CSS Modules'),
  (7, 'DESIGN',   '포트폴리오 사이트 디자인 (모집 완료).',  'Figma');

-- post 8 (AWS 스터디 그룹) → 2개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (8, 'BACKEND',  'ECS/RDS 실전 배포 실습 참여, 인프라 구성 문서화.', 'AWS, Terraform, Docker'),
  (8, 'FRONTEND', '배포 대상 샘플 서비스의 간단한 웹 화면 구현.',     'React, TypeScript');

-- post 9 (디자인 컬렉티브 챌린지) → 2개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (9, 'DESIGN',   '가상 앱 리디자인 작업, 케이스 스터디 정리.', 'Figma, Adobe XD'),
  (9, 'PLANNING', '리디자인 대상 서비스 분석 및 개선 방향 기획.', 'Notion, Miro');

-- post 10 (프론트엔드 위클리 라이브러리) → 2개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (10, 'FRONTEND', 'React 컴포넌트 라이브러리 설계 및 구현, Storybook 문서화.', 'React, TypeScript, Storybook'),
  (10, 'DESIGN',   '컴포넌트 디자인 시스템 토큰 설계 및 가이드 제작.',         'Figma, Tokens Studio');

-- post 11 (기획자 네트워크 커뮤니티 앱) → 2개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (11, 'PLANNING', '사용자 인터뷰 진행, IA 설계, 기획서 작성.', 'Notion, Miro, Google Forms'),
  (11, 'BACKEND',  '기획 검증용 간단한 프로토타입 API 구현 (선택).', 'Node.js, Express');

-- post 12 (사이드프로젝트 빌더스 회고 스터디) → 2개 역할
INSERT INTO post_roles (post_id, role_type, description, tech_stack) VALUES
  (12, 'BACKEND',  'MVP 런칭 경험 공유 (모집 완료).',  'Spring Boot, AWS'),
  (12, 'FRONTEND', 'MVP 런칭 경험 공유 (모집 완료).',  'React, Vercel');

-- =============================================================
-- 7. applications
-- =============================================================
-- post_roles ID 매핑 (TRUNCATE 후 AUTO_INCREMENT 1부터 시작)
-- post 1 : role_id 1(BACKEND), 2(FRONTEND), 3(DESIGN)
-- post 2 : role_id 4(BACKEND), 5(FRONTEND), 6(PLANNING)
-- post 3 : role_id 7(BACKEND), 8(FRONTEND), 9(DESIGN), 10(PLANNING)
-- post 4 : role_id 11(BACKEND), 12(FRONTEND)
-- post 5 : role_id 13(BACKEND), 14(FRONTEND), 15(DESIGN)
-- post 6 : role_id 16(FRONTEND), 17(DESIGN)
-- post 7 : role_id 18(FRONTEND), 19(DESIGN)
-- post 8 : role_id 20(BACKEND), 21(FRONTEND)
-- post 9 : role_id 22(DESIGN), 23(PLANNING)
-- post 10: role_id 24(FRONTEND), 25(DESIGN)
-- post 11: role_id 26(PLANNING), 27(BACKEND)
-- post 12: role_id 28(BACKEND), 29(FRONTEND)

INSERT INTO applications
  (post_id, role_id, user_id, motivation, tech_stack, experience, contact, created_at, withdrawn)
VALUES
  -- post 1 헬스케어 앱 ← user 2 BACKEND 지원
  (1, 1, 2,
   'Spring Boot로 API 서버를 구축한 경험이 있고 헬스케어 도메인에 관심이 많아 지원합니다.',
   'Java, Spring Boot, JPA, MySQL',
   '대학교 팀 프로젝트에서 REST API 설계 및 EC2 배포 담당.',
   'kim@example.com',
   NOW() - INTERVAL 8 DAY, false),

  -- post 1 헬스케어 앱 ← user 3 DESIGN 지원
  (1, 3, 3,
   'UI/UX 디자인을 전공하고 있으며, 헬스 앱 디자인 포트폴리오를 보유하고 있습니다.',
   'Figma, Protopie, Illustrator',
   '헬스케어 앱 UI 리디자인 프로젝트 1회, 모바일 앱 디자인 스터디 수료.',
   'lee@example.com',
   NOW() - INTERVAL 7 DAY, false),

  -- post 2 졸업작품 ← user 4 PLANNING 지원
  (2, 6, 4,
   '소상공인 지원 정책에 관심이 많아 기획 단계부터 참여하고 싶습니다.',
   'Notion, Figma, Google Analytics',
   '교내 창업 경진대회 기획 팀장, 사용자 인터뷰 10회 이상 경험.',
   'park@example.com',
   NOW() - INTERVAL 6 DAY, false),

  -- post 2 졸업작품 ← user 5 BACKEND 지원
  (2, 4, 5,
   '결제 API 연동 경험이 있어 해당 부분에서 기여할 수 있습니다.',
   'Python, FastAPI, PostgreSQL, Redis',
   '부트캠프에서 FastAPI 서버 구현 및 Stripe 결제 연동 프로젝트 완료.',
   'choi@example.com',
   NOW() - INTERVAL 5 DAY, false),

  -- post 3 아이디어톤 ← user 1 BACKEND 지원
  (3, 7, 1,
   '해커톤 현장에서 빠르게 API 서버를 구축할 수 있습니다. 같이 입상해봐요!',
   'Java, Spring Boot, FastAPI',
   '멋쟁이사자처럼 해커톤 참가 경험 1회, 대학 내부 해커톤 수상.',
   'admin@wooriteam.com',
   NOW() - INTERVAL 4 DAY, false),

  -- post 3 아이디어톤 ← user 2 FRONTEND 지원
  (3, 8, 2,
   '2일 내에 React로 간단한 MVP 화면을 빠르게 구현하는 것에 익숙합니다.',
   'React, TypeScript, Vite',
   '이전 해커톤에서 24시간 내 프론트엔드 단독 구현 경험.',
   'kim@example.com',
   NOW() - INTERVAL 3 DAY, false),

  -- post 4 스터디 ← user 3 FRONTEND 지원 (이후 철회)
  (4, 12, 3,
   '코딩테스트를 대비해 JavaScript로 알고리즘을 꾸준히 공부 중입니다.',
   'JavaScript, TypeScript',
   '프로그래머스 레벨2 50문제 이상 풀이.',
   'lee@example.com',
   NOW() - INTERVAL 3 DAY, true),   -- withdrawn = true

  -- post 5 에듀테크 사이드 프로젝트 ← user 2 FRONTEND 지원
  (5, 14, 2,
   'TanStack Query와 Chart.js를 실제 프로젝트에서 써봐서 즉시 기여 가능합니다.',
   'React, TypeScript, TanStack Query, Chart.js',
   '대시보드 형태의 웹 서비스 프론트 2개 구현 경험. Vercel 배포.',
   'kim@example.com',
   NOW() - INTERVAL 1 DAY, false),

  -- post 5 에듀테크 사이드 프로젝트 ← user 3 DESIGN 지원
  (5, 15, 3,
   '디자인 시스템을 처음부터 구축한 경험이 있으며 Storybook 연동 방법도 알고 있습니다.',
   'Figma, Storybook, Tokens Studio',
   '스타트업 인턴에서 디자인 토큰 기반 컴포넌트 라이브러리 구축.',
   'lee@example.com',
   NOW() - INTERVAL 1 DAY, false),

  -- post 6 공모전 ← user 2 FRONTEND 지원
  (6, 16, 2,
   '교내 공모전 출품 경험을 쌓고 싶고 Tailwind CSS로 반응형 UI 구현 가능합니다.',
   'React, TypeScript, Tailwind CSS',
   '반응형 웹 사이드 프로젝트 1개 배포 경험.',
   'kim@example.com',
   NOW(), false),

  -- post 8 AWS 스터디 그룹 ← user 7 FRONTEND 지원
  (8, 21, 7,
   '인프라 배포 경험을 쌓고 싶어 그룹원으로 지원합니다.',
   'React, TypeScript',
   '커머스 서비스 리뉴얼 리드 경험, 배포 파이프라인 일부 담당.',
   'kang@example.com',
   NOW() - INTERVAL 18 DAY, false),

  -- post 9 디자인 컬렉티브 챌린지 ← user 13 DESIGN 지원
  (9, 22, 13,
   '4주 챌린지 형태가 마음에 들어 포트폴리오 보강 차원에서 지원합니다.',
   'Figma, Framer, After Effects',
   '프리랜서로 모션 그래픽·인터랙션 디자인 다수 진행.',
   'shin@example.com',
   NOW() - INTERVAL 13 DAY, false),

  -- post 10 프론트엔드 위클리 라이브러리 ← user 15 FRONTEND 지원
  (10, 24, 15,
   '오픈소스 컴포넌트 라이브러리를 직접 만들어보고 싶어 지원합니다.',
   'React, TypeScript, Storybook',
   '개인 프로젝트에서 재사용 가능한 컴포넌트 모듈화 경험.',
   'hong@example.com',
   NOW() - INTERVAL 9 DAY, false),

  -- post 11 기획자 네트워크 커뮤니티 앱 ← user 17 PLANNING 지원
  (11, 26, 17,
   '동네 커뮤니티 서비스에 관심이 많아 기획 단계부터 참여하고 싶습니다.',
   'Notion, Miro, Google Forms',
   '교내 동아리에서 커뮤니티 매칭 서비스 기획안 작성 경험.',
   'moon@example.com',
   NOW() - INTERVAL 7 DAY, false),

  -- post 12 사이드프로젝트 빌더스 회고 스터디 ← user 10 BACKEND 지원 (모집 종료 후 철회)
  (12, 28, 10,
   'MVP 런칭 경험을 나누고 회고 스터디에 참여하고 싶어 지원했었습니다.',
   'Node.js, Express, MongoDB',
   '개인 MVP 1개 런칭, Socket.io 기반 실시간 기능 구현 경험.',
   'han@example.com',
   NOW() - INTERVAL 24 DAY, true);  -- withdrawn = true (모집 종료)