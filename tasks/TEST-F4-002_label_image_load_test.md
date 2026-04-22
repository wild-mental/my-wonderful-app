---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F4-002: [Unit Test] 라벨 이미지 로드 시간 ≤ 1초 검증"
labels: 'feature, test, epic:E-TEST, priority:medium, phase:3, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F4-002] 라벨 아카이브 이미지 로드 성능 단위 테스트
- 목적: F4-Q-002의 라벨 이미지 조회 로직이 REQ-FUNC-023 AC(로드 시간 ≤ 1초)를 충족하는지 검증한다. Supabase Storage에서 제공하는 라벨 이미지 URL 반환 속도와, 브라우저가 해당 URL을 로드할 때까지의 총 소요 시간을 계측한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-023
- SRS Traceability: [`/05_SRS_v1.md#5`](../05_SRS_v1.md) — TC-FUNC-023
- SRS 인프라: [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Supabase Storage Free 1GB
- 관련 구현 태스크: [`/TASKS/F4-Q-002_label_archive_query.md`](./F4-Q-002_label_archive_query.md), [`/TASKS/DATA-006_label_archive_schema.md`](./DATA-006_label_archive_schema.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#54-f4-data-trust-system-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 테스트 파일 생성 — `tests/f4/label-image-load.test.ts`
- [ ] F4-Q-002의 `getLabelImageUrls(productId)` 쿼리 성능 계측
- [ ] 쿼리 → URL 반환까지 ≤ 100ms (서버 예산)
- [ ] HEAD 요청으로 이미지 실제 로드 가능성 및 `Content-Length` 검증 (모킹된 Supabase Storage 응답 사용)
- [ ] 이미지 URL이 HTTPS + Supabase Storage 도메인인지 검증
- [ ] 존재하지 않는 제품 ID 시나리오: 빈 배열 반환 + 에러 없음
- [ ] 라벨 5종(FRONT/BACK/SIDE/NUTRITION_FACTS/OTHER) 모두 포함한 제품 1건 시나리오
- [ ] 총 로드 시간(쿼리 + 이미지 페치) p95 ≤ 1,000ms 계측

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 쿼리 응답 ≤ 100ms
- Given: LABEL_ARCHIVE가 정상 시드된 상태다.
- When: `getLabelImageUrls()`를 호출한다.
- Then: 쿼리 응답이 100ms 이하로 완료된다.

Scenario 2: HEAD 요청 성공
- Given: 반환된 이미지 URL이다.
- When: HEAD 요청으로 접근한다.
- Then: 200 응답과 유효 `Content-Type: image/*` 헤더를 반환한다.

Scenario 3: HTTPS + Supabase 도메인
- Given: 반환된 URL 목록이다.
- When: URL 포맷을 검증한다.
- Then: 모든 URL이 `https://*.supabase.co/storage/v1/object/` 패턴과 일치한다.

Scenario 4: 존재하지 않는 제품
- Given: LABEL_ARCHIVE가 없는 product_id다.
- When: 쿼리를 호출한다.
- Then: 빈 배열이 반환되고 에러가 발생하지 않는다.

Scenario 5: 5종 라벨 사이드 모두 반환
- Given: FRONT/BACK/SIDE/NUTRITION_FACTS/OTHER 5건이 등록된 제품이다.
- When: 쿼리를 호출한다.
- Then: 5건 모두 반환되며 `side` 필드가 정확히 매핑된다.

Scenario 6: 총 로드 p95 ≤ 1,000ms
- Given: 100회 반복 측정 환경이다.
- When: 쿼리 + HEAD 요청의 총 시간을 측정한다.
- Then: p95가 1,000ms 이하다.

## :gear: Technical & Non-Functional Constraints
- Supabase Storage 실제 호출 대신 HTTP 모킹 서버(MSW 또는 nock)를 사용한다.
- 이미지 실제 바이트 다운로드 시간은 CDN 특성에 좌우되므로, CI에서는 HEAD 요청 응답 시간만 계측한다.
- 응답 스키마는 F4 DTO와 일치해야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 로드 시간 ≤ 1,000ms 게이트가 CI에서 검증되는가?
- [ ] 이미지 URL HTTPS·도메인 검증이 포함되는가?
- [ ] 5종 라벨 사이드 반환 테스트가 포함되는가?
- [ ] `pnpm test TEST-F4-002` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F4-Q-002, #DATA-006
- Blocks: None
