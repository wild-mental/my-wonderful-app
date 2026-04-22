---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F4-Q-002: 라벨 아카이브 이미지 조회 로직 (Supabase Storage → 이미지 URL 반환)"
labels: 'feature, backend, epic:E-F4, priority:high, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [F4-Q-002] 라벨 아카이브 이미지 조회 로직
- 목적: 제조사 원본 라벨 이미지를 Supabase Storage에서 조회하여, 제품 상세 페이지의 출처 확인 아코디언 내에서 열람 가능하도록 서명된 이미지 URL을 반환한다.
- Epic / Phase: E-F4 (Data Trust System) / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4`](../05_SRS_v1.md) — REQ-FUNC-023 (라벨 이미지 열람)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.5 LABEL_ARCHIVE`](../05_SRS_v1.md)
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Supabase Storage (라벨 이미지 저장)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.4 E-F4`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-006** (LABEL_ARCHIVE 스키마), **NFR-003** (Supabase Storage 버킷)
- 후행 태스크: UI-025 (라벨 이미지 뷰어), TEST-F4-002

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **이미지 조회 함수** — `src/lib/trust/get-label-images.ts`
  - 입력: `productId: string`
  - 출력: `LabelImage[]` 타입 (이미지 URL 배열)
- [ ] **Supabase Storage 연동** — 이미지 URL 생성
  - LABEL_ARCHIVE 테이블에서 `image_url` 조회
  - Supabase Storage의 public URL 또는 signed URL 반환
  - signed URL 사용 시 TTL 1시간 설정
- [ ] **이미지 최적화 고려** — Next.js Image 컴포넌트 호환
  - `width`, `height` 힌트 제공 (CLS 방지)
  - Supabase Storage 도메인을 `next.config.js`의 `images.remotePatterns`에 등록
- [ ] **에러 처리** — 이미지 미존재, Storage 접근 실패
  - 이미지 미등록: 빈 배열 반환 (에러 아님)
  - Storage 장애: 에러 로깅 + 빈 배열 반환 (서비스 연속성 보장)
- [ ] **단위 테스트** — 정상 조회, 미존재 product_id, Storage 장애 시뮬레이션

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 라벨 이미지 정상 조회**
- **Given**: LABEL_ARCHIVE에 이미지가 등록된 제품
- **When**: `getLabelImages(productId)`를 호출한다
- **Then**: 1개 이상의 유효한 이미지 URL이 반환되며, URL 접근 시 이미지가 로드된다.

**Scenario 2: 이미지 로드 시간 ≤ 1초 (REQ-FUNC-023)**
- **Given**: 라벨 이미지가 등록된 제품
- **When**: 출처 확인 아코디언을 펼치고 이미지를 로드한다
- **Then**: 이미지 로드 시간이 1초 이내이다.

**Scenario 3: 이미지 미등록 제품 처리**
- **Given**: LABEL_ARCHIVE에 이미지가 없는 제품
- **When**: `getLabelImages(productId)`를 호출한다
- **Then**: 빈 배열이 반환되고 에러는 발생하지 않는다.

## :gear: Technical & Non-Functional Constraints
- **이미지 로드 시간 (REQ-FUNC-023)**: ≤ 1초. Supabase Storage CDN 활용.
- **Storage 용량 (§3.6)**: Supabase Free 1GB 한도 내에서 운영. 이미지 압축(WebP/AVIF) 권장.
- **CQRS Query**: 순수 Read. Storage 업로드(Write)는 관리자 백오피스(별도 태스크)에서 수행.
- **보안**: signed URL 사용 시 비인가 접근 방지. public 버킷인 경우 URL 추측 공격 방지 고려.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] Supabase Storage 연동이 동작하는가?
- [ ] `next.config.js`에 Supabase Storage 도메인이 등록되었는가?
- [ ] 이미지 로드 시간 ≤ 1초가 간이 검증되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-006 (LABEL_ARCHIVE 스키마), #NFR-003 (Supabase Storage 버킷)
- **Blocks**:
  - #UI-025 (라벨 이미지 뷰어 컴포넌트)
  - #TEST-F4-002 (라벨 이미지 로드 ≤ 1초 검증)
