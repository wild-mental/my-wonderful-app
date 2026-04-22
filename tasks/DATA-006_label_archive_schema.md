---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-006: LABEL_ARCHIVE 테이블 Prisma 스키마 정의 및 마이그레이션 생성 (FK → PRODUCT)"
labels: 'feature, data, epic:E-DATA, priority:high, phase:1'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-006] LABEL_ARCHIVE 엔티티 Prisma 모델 정의 및 마이그레이션
- 목적: F4 Data Trust System의 **원본 라벨 이미지 아카이브**를 구축한다. Supabase Storage에 저장된 제조사 원본 라벨 이미지 URL을 관리하여, REQ-FUNC-023(라벨 이미지 1초 이내 로드)과 REQ-FUNC-022(출처 아코디언 2클릭 이내 도달)의 기반 데이터를 제공한다. CP-1(대안 데이터 소스) OCR 파이프라인의 입력 소스이기도 하다.
- Epic / Phase: E-DATA / Phase 1
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.5 LABEL_ARCHIVE`](../05_SRS_v1.md) — 4개 필드 원천 명세
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.4 REQ-FUNC-022~023`](../05_SRS_v1.md)
- SRS 문서 (비상 대응): [`/05_SRS_v1.md#1.2.5 CP-1`](../05_SRS_v1.md) — 라벨 OCR 파이프라인 입력
- SRS 문서 (Storage 제약): [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Supabase Storage Free 1GB
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#3.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-002** (PRODUCT FK)
- 후행 태스크: DATA-010, F4-Q-001 (출처 조회), F4-Q-002 (이미지 조회), NFR-003 (Storage 버킷), TEST-F4-002, UI-024, UI-025

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Prisma 모델 작성** — `prisma/schema.prisma`에 `model LabelArchive` 블록 추가
- [ ] **필드 매핑 (SRS §6.2.5 + 운영 필드 확장)**:
  - `label_id: String @id @default(cuid())`
  - `product_id: String` + `product Product @relation(fields: [product_id], references: [product_id], onDelete: Cascade)`
  - `image_url: String` (Supabase Storage signed URL 또는 public URL)
  - `storage_key: String` (Supabase Storage 내부 경로, 예: `labels/P1/front.jpg`. URL 재발급 시 필요)
  - `file_size_bytes: Int` (1GB Free 용량 모니터링용, NFR-003 정합)
  - `content_type: String` (예: `image/jpeg`, `image/png`, `image/webp`)
  - `side: LabelSide` (Enum: `FRONT` / `BACK` / `SIDE` / `NUTRITION_FACTS` / `OTHER`)
  - `uploaded_by: String?` (관리자 ID 또는 사용자 ID, FK → USER. 본 태스크에서는 컬럼만, USER FK는 DATA-009 이후 연결)
  - `verified: Boolean @default(false)` (관리자 검수 완료 여부)
  - `uploaded_at: DateTime @default(now())`
- [ ] **Enum 정의** — `enum LabelSide { FRONT BACK SIDE NUTRITION_FACTS OTHER }`
- [ ] **인덱스 설계**:
  - `@@index([product_id])` — F4-Q-002 핵심 조회 경로 (p95 ≤ 1초 이미지 로드 전제)
  - `@@index([verified])` — 관리자 백오피스 미검수 필터
  - `@@index([uploaded_at(sort: Desc)])` — 최근 업로드 순 정렬
- [ ] **유니크 제약** — 동일 제품·동일 면(side) 중복 업로드 방지: `@@unique([product_id, side])` (교체 시 update, 신규 등록 시 insert)
- [ ] **Reverse Relation** — `model Product`에 `label_archives LabelArchive[]` 추가
- [ ] **마이그레이션 생성** — `pnpm prisma migrate dev --name add_label_archive_table --create-only` → 리뷰 → 적용
- [ ] **Zod 스키마** — `src/lib/schemas/label-archive.ts`에 `CreateLabelArchiveSchema`: 
  - `image_url.url()` + `file_size_bytes <= 5_242_880` (5MB 상한)
  - `content_type`은 허용 리스트(`image/jpeg`, `image/png`, `image/webp`)
  - `storage_key`는 `/^labels\/[a-zA-Z0-9_-]+\/(front|back|side|nutrition_facts|other)\.(jpe?g|png|webp)$/i` 패턴
- [ ] **Storage URL 리프레시 헬퍼** — `src/lib/storage/label-url.ts`에 `refreshLabelUrl(storageKey: string, expiresInSec: number): Promise<string>` 스켈레톤 (실제 Supabase Storage 연동은 NFR-003에서)
- [ ] **용량 모니터링 쿼리 예제** — `prisma.labelArchive.aggregate({ _sum: { file_size_bytes: true } })`로 총 용량 계산 예제를 docstring에 포함
- [ ] **Unit Test 작성** — 5건 이상: URL 유효성, 파일 크기 상한, content_type 허용 리스트, side 유니크, FK Cascade

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 라벨 이미지 등록**
- **Given**: PRODUCT `P1`이 존재, Supabase Storage에 `labels/P1/front.jpg` 업로드 완료된 상태
- **When**: `{ product_id: "P1", image_url: "https://xxx.supabase.co/.../labels/P1/front.jpg", storage_key: "labels/P1/front.jpg", file_size_bytes: 243512, content_type: "image/jpeg", side: "FRONT", verified: false }`로 저장한다
- **Then**: 레코드가 저장되고 `uploaded_at`이 주입된다.

**Scenario 2: 동일 면 중복 업로드 차단**
- **Given**: `(product_id=P1, side=FRONT)` 레코드가 존재
- **When**: 동일 조합으로 신규 insert 시도
- **Then**: `P2002` 에러가 발생. (교체는 `update` 또는 `upsert`로 처리해야 함을 강제)

**Scenario 3: 파일 크기 상한 초과 차단**
- **Given**: `file_size_bytes: 6_000_000` (6MB) 입력
- **When**: `CreateLabelArchiveSchema`로 파싱
- **Then**: ZodError가 발생하며 "5MB 이하 요구" 메시지가 반환된다.

**Scenario 4: 제품 삭제 시 Cascade**
- **Given**: PRODUCT 1건과 LABEL_ARCHIVE 3건(FRONT/BACK/NUTRITION_FACTS)이 존재
- **When**: PRODUCT 삭제
- **Then**: LABEL_ARCHIVE 3건이 자동 삭제된다. (물리 파일 삭제는 별도 cleanup 훅 — NFR-003에서 처리)

**Scenario 5: 총 용량 집계**
- **Given**: 500건의 LABEL_ARCHIVE가 저장된 상태
- **When**: `prisma.labelArchive.aggregate({ _sum: { file_size_bytes: true } })`를 실행
- **Then**: 총합이 1GB(1,073,741,824 bytes) 이하임을 검증 쿼리로 확인할 수 있다 (NFR-003 Free 제한).

**Scenario 6: 허용 MIME 외 차단**
- **Given**: `content_type: "image/gif"` 입력
- **When**: Zod 파싱
- **Then**: ZodError 발생, `image/jpeg|png|webp`만 허용됨이 메시지에 명시된다.

## :gear: Technical & Non-Functional Constraints
- **성능 (REQ-FUNC-023, REQ-NF-004)**: 이미지 로드 p95 ≤ 1초 요구 → Supabase Storage CDN 활용 전제. `image_url`은 가급적 public URL 또는 장기 signed URL 사용. Next.js `<Image>`의 `sizes`·`priority` 최적화는 UI 레이어(UI-025) 책임.
- **용량 제한 (NFR-003)**: Supabase Storage Free 1GB 상한. 파일당 5MB 제한 시 이론상 최대 200장, 실제 평균 300KB 가정 시 약 3,000장 수용 가능. MVP 500개 제품 × 최대 5면(FRONT/BACK/SIDE/NUTRITION_FACTS/OTHER) = 2,500장 이내로 설계.
- **FK 순서**: `uploaded_by`의 USER FK는 본 태스크에서는 **컬럼만 선언**(nullable String). 실제 FK 관계는 DATA-009(USER) 완료 후 DATA-010(ERD 통합)에서 연결. 이는 DATA-009 선행 대기를 없애기 위한 설계.
- **CQRS 분리 (P2)**: 본 태스크는 스키마·검증·URL 헬퍼 인터페이스에 한정. 실제 업로드 파이프라인은 F4-Q-002(이미지 조회), NFR-003(버킷 설정)에서 담당.
- **개인정보 (CON-4)**: LABEL_ARCHIVE는 개인정보 미포함. 업로더 ID는 감사 목적의 **선택 필드**.
- **CP-1 연계**: 대안 데이터 소스에서 라벨 OCR 파이프라인이 이 테이블을 입력으로 사용한다. `verified=false` 레코드는 OCR 자동 실행 파이프라인의 큐로 활용.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `model LabelArchive` + `LabelSide` Enum이 정의되고 `prisma validate` 통과하는가?
- [ ] 3개 인덱스와 `@@unique([product_id, side])`가 적용되는가?
- [ ] Zod 스키마가 파일 크기 / MIME / storage_key 패턴을 모두 검증하는가?
- [ ] `Product.label_archives` 역방향 관계가 작동하는가?
- [ ] 단위 테스트 5건 이상이 통과하는가?
- [ ] 마이그레이션 SQL이 리뷰되고 Cascade 동작이 검증되는가?
- [ ] 용량 집계 예제 쿼리가 문서화되어 NFR-COST-001·NFR-003 연계가 명확한가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-001 (Prisma 초기화)
  - #DATA-002 (PRODUCT FK)
- **Blocks**: 
  - #DATA-010 (ERD 통합 검증)
  - #F4-Q-001 (출처 조회)
  - #F4-Q-002 (라벨 이미지 조회)
  - #NFR-003 (Supabase Storage 버킷 연결)
  - #TEST-F4-002 (이미지 로드 ≤ 1초)
  - #UI-024, #UI-025 (출처 아코디언 / 라벨 이미지 뷰어)

## :bookmark_tabs: Notes
- SRS §6.2.5 원문은 `label_id`, `product_id`, `image_url`, `uploaded_at` 4개 필드만 명시했으나, 운영 실효성 확보를 위해 `storage_key`, `file_size_bytes`, `content_type`, `side`, `uploaded_by`, `verified`를 추가한다. 이는 ERD 검증(DATA-010)에 반영되며, 각 필드의 목적은:
  - `storage_key`: Supabase signed URL 만료 시 재발급 필요
  - `file_size_bytes`: Free 1GB 모니터링
  - `content_type`: 허용 포맷 강제
  - `side`: 제품별 다면 라벨 관리
  - `uploaded_by`: 감사/책임 추적
  - `verified`: 관리자 검수 워크플로 연동 (ADM 태스크)
- 실제 Supabase Storage 버킷 생성, 액세스 정책 설정, CORS 등은 NFR-003에서 처리한다.
