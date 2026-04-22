---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F2-C-002: 금지 표현 검증 로직 (질병 예방·치료 표현 필터링)"
labels: 'feature, backend, epic:E-F2, priority:critical, phase:2, cqrs:command, legal:critical, security'
assignees: ''
---

## :dart: Summary
- 기능명: [F2-C-002] 금지 표현 검증 Command 로직
- 목적: 뱃지 텍스트(`badge_label`)·번역(`common_language`)·사용자 제보(`ERROR_REPORT`) 등 **사용자에게 노출되는 모든 건강 관련 문자열**에 대해 건강기능식품법이 금지하는 표현(질병 예방·치료·의학적 효능 주장)을 사전에 검출·차단한다. 본 Command는 시스템 전역에서 재사용되는 **공통 Legal Guard**이다.
- Epic / Phase: E-F2 Anti-BS Dashboard / Phase 2 (CQRS 로직 계층, Legal Guard)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (제약): [`/05_SRS_v1.md#1.2.3 CON-2`](../05_SRS_v1.md) — 질병 예방·치료 표현 절대 금지, 법률 리스크 R2 (High)
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.2 REQ-FUNC-012`](../05_SRS_v1.md) — 금지 표현 **100% 필터링** (tested)
- SRS 문서 (리스크): [`/05_SRS_v1.md#1.2.4`](../05_SRS_v1.md) — R2 건강기능식품법 위반 리스크 점수 10
- 관련 태스크: [`F2-C-001_badge_decision_logic.md`](./F2-C-001_badge_decision_logic.md), [`DATA-005_badge_schema.md`](./DATA-005_badge_schema.md)
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#4.2 E-F2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-001** (프로젝트 스캐폴딩)
- 후행 태스크: F2-C-001, F2-C-003, F4-C-001(에러 제보), COM-C-003(관리자 번역 편집)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **금지 표현 사전 구축** — `src/lib/legal/prohibited-expressions.ts`:
  - **1차 금지 키워드 리스트** (완전 매칭): `["치료", "치유", "예방", "완치", "암", "당뇨", "고혈압", "관절염", "아토피", "치매", "알츠하이머", "뇌졸중", "심장병", "간염", "위염", "감염"]`
  - **2차 금지 구문 리스트** (부분 매칭): `["병을 고친다", "질환을 개선", "약을 대체", "의약품 효과", "약효가 있다", "환자에게 좋다"]`
  - **3차 의학적 주장 패턴** (정규식): 
    - `/\d+(%|퍼센트)\s*(효과|치유|개선|완치)/` (수치 기반 효과 주장)
    - `/(임상|실험).*입증/` (무분별한 임상 주장)
    - `/의사.*추천/` (전문가 인증 허위 주장)
  - **예외 허용 리스트** (허용 표현): `["비타민 D의 체내 흡수를 돕습니다", "항산화에 도움을 줄 수 있음"]` — 식약처 공전 공식 문구
  - 리스트는 **법률 전문가 검토 후 JSON으로 외부화** → `src/data/legal/prohibited-dictionary.json`에 버전 관리
- [ ] **검증 함수 `validateProhibitedExpressions()` 작성** — `src/lib/legal/validate-prohibited.ts`:
  - Signature: `(text: string, options?: ValidateOptions) => ValidationResult`
  - Input: 검증 대상 문자열 (뱃지 라벨, 번역문, 제보 내용 등)
  - Output: `{ passed: boolean; matches: ProhibitedMatch[]; severity: "INFO" | "WARN" | "CRITICAL" }`
  - `ProhibitedMatch`: `{ term: string; category: "KEYWORD" | "PHRASE" | "PATTERN"; position: [number, number]; severity }`
- [ ] **검증 파이프라인 구현** (4단계):
  1. **정규화**: NFC 유니코드 정규화, 전각→반각, 공백·특수문자 제거 버전 생성
  2. **Keyword Match**: Aho-Corasick 알고리즘 또는 Trie 기반으로 1차 키워드 스캔 (O(n))
  3. **Phrase Match**: 정규화된 문자열에서 2차 구문 부분일치
  4. **Pattern Match**: 3차 정규식 배열을 순차 매칭
  5. **예외 허용**: 허용 리스트에 정확히 포함된 경우 일치 항목 제외
- [ ] **검증 결과 등급화**:
  - `CRITICAL`: 1차 키워드 직접 매칭 (즉시 차단)
  - `WARN`: 2차 구문 또는 3차 패턴 매칭 (관리자 재확인 필요)
  - `INFO`: 경계 사례 (예: 제보자가 문맥상 사용)
- [ ] **Express/Next.js Middleware 모드** (옵션) — `src/lib/legal/middleware.ts`:
  - 관리자 화면에서 임의 텍스트 입력 시 자동 검증 훅으로 사용
- [ ] **사전 버전 관리** — `prohibited-dictionary.json` 상단에 `version`, `last_reviewed_at`, `reviewed_by` 메타데이터 기록. 변경 시 **법률 검토자 승인 + PR 라벨 `legal:reviewed` 필수**
- [ ] **로깅 및 알림 연계**:
  - `CRITICAL` 검출 시 `event="prohibited_expression_detected"` 구조화 로그 + Sentry `severity=critical` + Slack `#legal-alert` Webhook
  - 검출 원문은 **일부 해시 + 앞 50자**만 로깅 (PII 보호 + 디버깅 가용성)
- [ ] **성능 최적화**:
  - 사전은 서버 부트 시 1회 로드 후 메모리 Trie로 빌드 (`src/lib/legal/trie.ts`)
  - 검증 함수 자체는 동기 순수 함수 (`async` 없음)
  - p95 ≤ 1ms per call (200자 기준)
- [ ] **Unit Test 작성** — `tests/lib/legal/validate-prohibited.test.ts` 25건 이상:
  - 1차 키워드 매칭 10건 (치료/치유/예방/완치/암/당뇨 등)
  - 2차 구문 매칭 5건
  - 3차 패턴 매칭 5건
  - 예외 허용 리스트 2건
  - 정규화 경계 테스트 3건 (전각/반각, 공백)
- [ ] **Integration Test** — F2-C-001 호출 경로에서 오염된 뱃지 라벨이 차단되는 E2E 시나리오
- [ ] **Red Team Test** — `tests/security/prohibited-redteam.test.ts`:
  - 관리자 권한으로 악의적 입력 50건 시도 → 100% 차단 검증
  - 회피 시도: 띄어쓰기("치 료"), 한자 병기("治療"), 이모지 삽입, 동의어 ("고친다") 등

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 1차 키워드 매칭 — 암**
- **Given**: 입력 `text = "암을 예방하는 효과"`
- **When**: `validateProhibitedExpressions(text)` 호출
- **Then**: `{ passed: false, severity: "CRITICAL", matches: [{ term: "암", category: "KEYWORD" }, { term: "예방", category: "KEYWORD" }] }` 반환.

**Scenario 2: 2차 구문 매칭**
- **Given**: 입력 `text = "이 제품은 약을 대체할 수 있습니다"`
- **When**: 검증 호출
- **Then**: `{ passed: false, severity: "CRITICAL", matches: [{ term: "약을 대체", category: "PHRASE" }] }` 반환.

**Scenario 3: 3차 패턴 매칭 — 수치 기반 효과 주장**
- **Given**: 입력 `text = "30% 개선 효과 입증"`
- **When**: 검증 호출
- **Then**: `{ passed: false, severity: "WARN", matches: [{ category: "PATTERN" }] }` 반환.

**Scenario 4: 예외 허용 리스트 — 식약처 공전 원문**
- **Given**: 입력 `text = "비타민 D의 체내 흡수를 돕습니다"` (공전 원문)
- **When**: 검증 호출
- **Then**: `{ passed: true, matches: [] }` 반환. 1차 키워드가 미매칭이며, 허용 리스트에 존재.

**Scenario 5: 회피 시도 — 공백 삽입**
- **Given**: 입력 `text = "치 료 효과 우수"` (의도적 공백)
- **When**: 검증 호출
- **Then**: 정규화 후 `"치료 효과 우수"`로 처리되어 `{ passed: false, severity: "CRITICAL" }` 반환.

**Scenario 6: 회피 시도 — 한자 병기**
- **Given**: 입력 `text = "治療 효과"` (한자 치료)
- **When**: 검증 호출 (한자 유니코드 정규화 포함)
- **Then**: 한자 → 한글 매핑 테이블을 통해 "치료"로 인식, 차단됨.

**Scenario 7: CRITICAL 검출 시 알림 발송**
- **Given**: 프로덕션 환경, Slack Webhook 설정됨
- **When**: `CRITICAL` 등급 검출 이벤트 발생
- **Then**: Slack `#legal-alert` 채널에 알림 발송 + Sentry 이벤트 기록 (5초 이내).

**Scenario 8: Red Team 회피 시도 — 100% 차단**
- **Given**: 50건의 악의적 입력 (한자, 공백, 이모지, 동의어, 오타 변형)
- **When**: 일괄 검증
- **Then**: 100% 차단. 통과율 0%.

**Scenario 9: 정상 입력 — 통과**
- **Given**: 입력 `text = "항산화에 도움을 줄 수 있음"` (허용 표현)
- **When**: 검증 호출
- **Then**: `{ passed: true }` 반환.

**Scenario 10: 성능 — p95 ≤ 1ms**
- **Given**: 200자 입력 1,000회 반복
- **When**: 검증 함수 호출
- **Then**: p95 ≤ 1ms, p99 ≤ 3ms.

## :gear: Technical & Non-Functional Constraints
- **법률 준수 (R2 High Risk, CON-2)**: 본 검증이 **최후의 방어선**. 우회 허용 시 건강기능식품법 위반으로 **사업 존속 위기**.
- **100% 차단 요건 (REQ-FUNC-012)**: Red Team 테스트에서 통과율 0%가 **CI 필수 게이트**. 회피 패턴이 신규 발견될 때마다 사전 업데이트 + 테스트 추가.
- **사전 버전 관리**: 
  - JSON 외부화 → Git 이력 추적
  - 변경 PR은 **법률 검토자 1인 + 백엔드 리드 1인 이중 승인** 필수 (Branch Protection Rule)
  - 변경 시 `version++`, `last_reviewed_at` 갱신
- **성능 예산**: 
  - 본 검증이 F2-C-001(뱃지 판정) 파이프라인에 포함되므로 p95 ≤ 1ms 필수
  - 사전은 서버 부트 시 Trie로 빌드되며 메모리 상주
- **순수 함수**: `validateProhibitedExpressions()`는 I/O 없이 결정적. 테스트 격리 용이.
- **PII 보호**: 검증 실패 시 원문 전체 로깅 금지. `hash(text).slice(0,8) + text.slice(0,50)`만 기록.
- **알림 Rate Limit**: 동일 원문 검출 반복 시 Slack 알림은 **5분 dedup** (Sentry fingerprint 활용).
- **사전 확장성**: JSON 기반이므로 운영 중 사전 교체 가능하나, 교체는 **코드 배포와 함께**만 (런타임 hot-reload 금지 — 오염된 사전 주입 방지).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] 1차 키워드, 2차 구문, 3차 정규식 패턴이 `prohibited-dictionary.json`에 정의되었는가?
- [ ] 허용 리스트(식약처 공전 공식 문구)가 예외 처리되는가?
- [ ] Aho-Corasick 또는 Trie 기반 고속 매칭 엔진이 구현되었는가?
- [ ] 정규화 단계(유니코드 NFC, 전/반각, 공백, 한자 매핑)가 적용되는가?
- [ ] Red Team 테스트 50건에서 100% 차단이 CI에서 검증되는가?
- [ ] `CRITICAL` 검출 시 Slack 알림 + Sentry 이벤트가 발송되는가?
- [ ] 성능 p95 ≤ 1ms가 벤치마크로 검증되는가?
- [ ] 사전 변경 PR에 법률 검토자 승인이 필수화되었는가 (`legal:reviewed` 라벨)?
- [ ] 사전 JSON에 `version`, `last_reviewed_at` 메타데이터가 포함되었는가?
- [ ] 로깅에 원문 전체가 기록되지 않고 해시+prefix만 남는가?

## :construction: Dependencies & Blockers
- **Depends on**:
  - #DATA-001 (프로젝트 스캐폴딩)
- **Blocks**:
  - #F2-C-001 (뱃지 판정 시 내부 호출)
  - #F2-C-003 (번역 매핑 시 출력 검증)
  - #F4-C-001 (에러 제보 검증)
  - #COM-C-003 (관리자 번역 편집 저장 시 검증)
  - #TEST-F2-003 (금지 표현 차단 Red Team 테스트)
  - #NFR-SEC-003 (CON-2 법률 리스크 차단)

## :bookmark_tabs: Notes
- 본 모듈은 **법률 R2 리스크의 단일 방어선**이 아닌, **다층 방어(defense-in-depth)의 한 축**이다. 추가 레이어:
  - DB 레벨: DATA-005의 `prohibited_check_passed` guard
  - UI 레벨: UI-020의 뱃지 렌더링 시 최종 검증 (런타임 sanity check)
  - 관리자 워크플로: COM-C-003에서 편집 저장 시 재검증
- 사전 업데이트는 **분기당 1회 정기 리뷰**를 권장. 법률 자문 1회/분기 비용을 REQ-NF-020(월 8만원) 예산에 포함 검토.
- 본 Command는 의도적으로 **Epic E-F2** 소속이지만, 실제 소비처는 F2/F4/COM에 걸쳐 있다. 모듈 위치는 `src/lib/legal/`에 두어 도메인 중립성을 유지한다.
- 회피 패턴 신규 발견 시 이슈 라벨 `legal:prohibited-bypass`로 긴급 트리아지 대상.
