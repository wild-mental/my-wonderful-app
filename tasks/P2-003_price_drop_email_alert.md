---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] P2-003: 가격 하락 이메일 알림 기능 구현 (관심 등록 제품)"
labels: 'feature, backend, epic:E-F1, priority:medium, phase:post-mvp, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [P2-003] 가격 하락 이메일 알림
- 목적: REQ-FUNC-037에 따라 사용자가 관심 등록한 제품의 1일 단가가 이전 대비 하락했을 때 이메일 알림을 발송한다. 가격 비교 기능을 단발성 조회에서 재방문 유도형 기능으로 확장하고, 사용자는 가격 인하를 놓치지 않고 다시 구매 의사결정으로 돌아올 수 있어야 한다.
- Epic / Phase: E-F1 / Post-MVP (Should-Have)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.6 Should-Have 기능 요구사항`](../05_SRS_v1.md) — REQ-FUNC-037
- SRS 외부 시스템 폴백/가격 데이터: [`/05_SRS_v1.md#3.1.1 외부 시스템 비가용 시 내부 폴백 전략`](../05_SRS_v1.md) — `PRICE_SNAPSHOT`
- 관련 선행 명세: [`/TASKS/CRON-001_price_sync_cron.md`](./CRON-001_price_sync_cron.md), [`/TASKS/F4-C-004_report_email_notification.md`](./F4-C-004_report_email_notification.md), [`/TASKS/COM-C-002_auth_session_management.md`](./COM-C-002_auth_session_management.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#81-phase-2--post-mvp-scope-suggestion`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 관심 등록 데이터 모델 정의
  - 사용자-제품 구독 관계 저장
  - 중복 등록 방지 키 설계
- [ ] 관심 등록 UX/엔드포인트 정의
  - 결과/상세 페이지에서 "가격 알림 받기" 액션 제공
  - 등록/해제 동작 분리
- [ ] 가격 하락 감지 배치 구현
  - CRON-001 실행 결과와 이전 스냅샷 비교
  - 하락 여부 및 하락폭 계산
- [ ] 이메일 알림 발송 연계
  - 제품명, 새 1일 단가, 비교 시점, 딥링크 포함
  - F4-C-004의 이메일 인프라 재사용
- [ ] 중복 발송 방지 구현
  - 같은 가격 포인트 또는 같은 배치 내 중복 발송 금지
  - 최근 발송 이력 저장
- [ ] 수신 거부/등록 관리 UX 정의
  - 알림 해제 링크 또는 계정 설정 경로 제공

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 관심 등록 성공
- Given: 인증 사용자가 특정 제품에 가격 알림을 등록하려 한다.
- When: "가격 알림 받기"를 선택한다.
- Then: 해당 제품에 대한 알림 구독이 저장된다.

Scenario 2: 가격 하락 감지 후 이메일 발송
- Given: 사용자가 알림 등록한 제품의 1일 단가가 이전 스냅샷보다 낮아졌다.
- When: 가격 동기화 배치가 완료된다.
- Then: "[제품명] 1일 단가가 XX원으로 하락했습니다" 형식의 이메일이 발송된다.

Scenario 3: 가격 미하락 시 미발송
- Given: 제품 가격이 동일하거나 상승했다.
- When: 배치 비교를 수행한다.
- Then: 알림 이메일은 발송되지 않는다.

Scenario 4: 중복 발송 방지
- Given: 같은 배치에서 동일 제품이 여러 번 비교되거나 동일 가격으로 재실행된다.
- When: 알림 발송 판단을 수행한다.
- Then: 사용자당 동일 가격 하락 알림은 한 번만 발송된다.

Scenario 5: 수신 해제
- Given: 사용자가 더 이상 가격 알림을 원하지 않는다.
- When: 알림 설정 또는 이메일의 해제 경로를 통해 구독을 해제한다.
- Then: 이후 가격 하락이 발생해도 이메일이 발송되지 않는다.

## :gear: Technical & Non-Functional Constraints
- 가격 하락 판단은 실시간 compare 응답이 아니라 배치로 적재된 `PRICE_SNAPSHOT`을 기준으로 해야 한다.
- 알림 발송은 멱등해야 하며, Cron 재실행이나 부분 실패 복구 시 중복 메일이 나가면 안 된다.
- 이메일 내용에는 마케팅성 문구보다 가격 변화와 대상 제품 식별 정보가 우선되어야 한다.
- 사용자가 인증 기반으로 구독하므로 세션/이메일 매핑은 COM-C-002 규칙을 따른다.
- 알림 등록 기능이 없더라도 기존 가격 비교 기능은 정상 동작해야 하며, 구독 저장 실패가 메인 퍼널을 깨면 안 된다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 관심 등록 데이터 모델과 등록/해제 경로가 정의되었는가?
- [ ] 배치 기반 가격 하락 감지 로직이 구현되었는가?
- [ ] 이메일 템플릿과 발송 파이프라인이 연결되었는가?
- [ ] 같은 가격 포인트에 대한 중복 발송 방지 장치가 있는가?
- [ ] 수신 해제 UX와 보존 정책이 문서화되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #CRON-001, #F4-C-004, #COM-C-002
- Blocks: None
