---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-003: Supabase Storage 버킷 설정 (라벨 이미지 저장, Free 1GB)"
labels: 'feature, infra, epic:E-NFR, priority:medium, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-003] Supabase Storage 버킷 설정
- 목적: 제조사 원본 라벨 이미지를 저장·관리할 Supabase Storage 버킷을 설정하여, F4-Q-002(라벨 아카이브 이미지 조회)의 인프라 기반을 확보한다.
- Epic / Phase: E-NFR / Phase 1
- 복잡도: L

## :link: References (Spec & Context)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.5 LABEL_ARCHIVE`](../05_SRS_v1.md)
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Supabase Storage
- 선행 태스크: **NFR-002** (Supabase 프로젝트 생성)
- 후행 태스크: F4-Q-002 (라벨 이미지 조회)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Storage 버킷 생성** — `label-archives` 버킷
  - Public 또는 Private 설정 (Public 권장, 이미지 직접 접근 허용)
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
  - File size limit: 5MB
- [ ] **RLS 정책 설정** — 읽기: 모든 사용자 허용 / 쓰기: 관리자만 허용
- [ ] **이미지 경로 규칙 정의** — `{product_id}/{label_id}.{ext}` 형식
- [ ] **Next.js Image 도메인 등록** — `next.config.js`의 `images.remotePatterns`에 Supabase Storage URL 추가
- [ ] **Supabase JS 클라이언트 설정** — `src/lib/supabase.ts` (Storage 접근용)
- [ ] **환경변수 추가** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`.env.example` 업데이트)
- [ ] **테스트 이미지 업로드** — 샘플 라벨 이미지 1개 업로드하여 접근 검증

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 이미지 업로드 및 접근**
- **Given**: `label-archives` 버킷이 생성된 상태
- **When**: 샘플 이미지를 업로드한다
- **Then**: Public URL로 이미지에 접근 가능하며 HTTP 200이 반환된다.

**Scenario 2: 용량 제한 확인**
- **Given**: Free 플랜 Storage 1GB
- **When**: 예상 라벨 이미지(500개 × 평균 500KB)를 적재한다
- **Then**: 총 250MB로 1GB 한도의 25%를 사용한다.

## :gear: Technical & Non-Functional Constraints
- **Free 티어**: Supabase Storage 1GB 한도. 이미지 압축(WebP) 적극 활용.
- **CDN**: Supabase Storage는 자체 CDN 지원. 이미지 로드 시간 ≤ 1초 (REQ-FUNC-023).

## :checkered_flag: Definition of Done (DoD)
- [ ] `label-archives` 버킷이 생성되었는가?
- [ ] RLS 정책(읽기: 공개, 쓰기: 관리자)이 적용되었는가?
- [ ] `next.config.js`에 Storage 도메인이 등록되었는가?
- [ ] 환경변수가 `.env.example`에 추가되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #NFR-002 (Supabase 프로젝트)
- **Blocks**: #F4-Q-002 (라벨 이미지 조회), #DATA-006 (LABEL_ARCHIVE 데이터 관리)
