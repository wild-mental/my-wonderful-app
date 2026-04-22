# 📊 SRS → Task Extraction Report

**기반 문서:** SRS-001 v1.4 | **출력 파일:** [TASK_LIST_v1.md](file:///Users/kidsnote/Workspace/SRS-from-PRD-HealthProdInfo/TASKS/TASK_LIST_v1.md)

---

## 추출 결과 요약

| 구분 | 태스크 수 |
|---|---|
| **Step 1: 계약·데이터 (DATA/API/MOCK)** | 25 |
| **Step 2: 로직 (Query/Command/RH/Cron/Admin)** | 31 |
| **Step 3: 테스트 (TEST)** | 22 |
| **Step 4: 비기능 (NFR)** | 17 |
| **Step 5: UI/UX (UI)** | 26 |
| **MVP 총계** | **121** |
| **Phase 2 (Should/Could)** | 7 |
| **전체 합계** | **128** |

## 13개 Epic 도메인

| Epic | 태스크 수 | 핵심 SRS 영역 |
|---|---|---|
| E-INFRA | 1 | 프로젝트 초기화 |
| E-DATA | 10 | DB 스키마, Seed |
| E-API | 8 | DTO, 에러코드 |
| E-MOCK | 6 | Mock/Stub 서비스 |
| E-F1 (Super-Calc) | 8 | 단가 비교 엔진 |
| E-F2 (Anti-BS) | 8 | 뱃지 판정 |
| E-F3 (Viral) | 4 | 카카오 공유 |
| E-F4 (Data Trust) | 7 | 제보·보상 |
| E-COMMON | 8 | 인증, 검색, 추적 |
| E-ADMIN | 4 | 관리자 백오피스 |
| E-NFR | 17 | 인프라·보안·모니터링 |
| E-UI | 22 | 프론트엔드 |
| E-TEST | 22 | 테스트 자동화 |

## 적용된 5대 추출 원칙

1. **P1 — 데이터 우선(SSOT):** DB 스키마 11개 + API DTO 8개 + Mock 6개를 Phase 1로 최우선 배치
2. **P2 — CQRS 분리:** 모든 Feature를 `[Query]` / `[Command]` / `[Route Handler]` 3계층으로 격리
3. **P3 — AC → 테스트 코드:** SRS의 인수 조건 22건을 GWT 기반 Unit/Integration Test 태스크로 변환
4. **P4 — 닫힌 문맥:** 태스크 1건 = 단일 Write 또는 단일 Read 목적
5. **P5 — UI/백엔드 분리:** 프론트엔드 UI 26건을 백엔드 로직과 완전 독립 추출

## SRS 요구사항 커버리지

> [!IMPORTANT]
> 삭제된 REQ-FUNC-003, REQ-FUNC-007을 제외한 **유효 기능 요구사항 35건 전건 커버**, 비기능 요구사항 23건 전건 커버

| SRS 범위 | 커버 여부 |
|---|---|
| REQ-FUNC-001~039 (삭제 2건 제외 35건) | ✅ 전건 |
| REQ-NF-001~024 (삭제 1건 제외 23건) | ✅ 전건 |
| CON-1~13 (제약사항) | ✅ 기술 제약 반영 |
| CP-1, CP-2 (비상대응) | ✅ 폴백 태스크 포함 |

## 의존성 Critical Path

```
DATA-001 → DATA-002~009 → DATA-010 → DATA-011
                ↓
         API-001~008 → MOCK-001~006
                ↓
    F1-RH-001 / F2-RH-001 / COM-RH-001
                ↓
        UI-001~062 + TEST-* + NFR-*
```

> [!TIP]
> **병렬화 가능 포인트:** Step 1 완료 후 F1(Super-Calc), F2(Anti-BS), F4(Data Trust), COM(공통) 로직은 모두 병렬 개발 가능. UI 태스크는 Mock 데이터 기반으로 백엔드와 동시 착수 가능.
