---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-025: 라벨 아카이브 이미지 뷰어 컴포넌트 (아코디언 내부)"
labels: 'feature, frontend, epic:E-UI, priority:medium, phase:5, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-025] 라벨 아카이브 이미지 뷰어 컴포넌트
- 목적: UI-024 출처 확인 아코디언의 "제조사 라벨 원본" 섹션에서 썸네일을 탭했을 때 풀사이즈 라벨 이미지를 표시하는 라이트박스형 뷰어를 구현한다. REQ-FUNC-023(이미지 로드 ≤ 1초)를 충족하고, 모바일 핀치 줌·스와이프 멀티 이미지 전환·키보드 접근성을 모두 지원하여 사용자가 라벨의 성분표·영양정보를 직접 확인할 수 있도록 한다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-023 (라벨 이미지 1초 이내 로드)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 UC-09`](../05_SRS_v1.md) — 데이터 원본 출처 확인
- 관련 구현 태스크: [`/TASKS/F4-Q-002_label_archive_query.md`](./F4-Q-002_label_archive_query.md), [`/TASKS/DATA-006_label_archive_schema.md`](./DATA-006_label_archive_schema.md), [`/TASKS/UI-024_evidence_accordion.md`](./UI-024_evidence_accordion.md)
- 선행 태스크: **UI-024** (출처 아코디언 — 뷰어 진입점), **F4-Q-002** (이미지 URL 조회), **NFR-003** (Supabase Storage)
- 후행 태스크: TEST-F4-002 (라벨 이미지 로드 ≤ 1초)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **LabelImageViewer 컴포넌트** — `src/components/trust/label-image-viewer.tsx` (Client Component)
  - Props: `{ images: LabelImage[]; initialIndex?: number; onClose: () => void; open: boolean }`
  - shadcn/ui `Dialog` 기반, `size="full"` 모바일 전체 화면 모드
- [ ] **썸네일 그리드 (UI-024 내부)**
  - 2열 그리드, `aspect-ratio: 4/5` 유지
  - Next.js `<Image>` 컴포넌트로 lazy-load + 자동 포맷(WebP/AVIF) + `sizes="(max-width: 640px) 50vw, 240px"`
  - side 레이블 오버레이: "앞면" / "뒷면" / "측면" / "영양정보" / "기타"
- [ ] **풀사이즈 뷰어 다이얼로그**
  - 배경 반투명 검정(`bg-black/90`)
  - 중앙 이미지 + 좌/우 네비게이션 버튼(이미지 2개 이상일 때만)
  - 상단 우측 [X] 닫기 버튼, 하단 인디케이터 "2 / 5"
  - 이미지 로딩 중 `<Skeleton>` 또는 blur placeholder 표시
- [ ] **Pinch-to-Zoom & Pan**
  - `react-zoom-pan-pinch` 또는 Radix ScrollArea 기반 자체 구현
  - 모바일 두 손가락 핀치 줌, 한 손가락 드래그 pan
  - 데스크탑: 마우스 휠 줌, 드래그 pan
  - 최대 3배 줌 제한, 더블탭으로 원복
- [ ] **스와이프 네비게이션**
  - 좌/우 스와이프로 이미지 전환(이미지 2개 이상)
  - 데스크탑: ArrowLeft/ArrowRight 키
- [ ] **키보드 접근성**
  - Esc 닫기, Arrow 키 이동, Tab으로 버튼 포커스 순환
  - 포커스 트랩(Radix Dialog 내장)
- [ ] **다운로드/확대 보기 액션(선택)**
  - 풀스크린 이미지 링크 탭 시 새 탭에서 원본 오픈(`target="_blank"`)
- [ ] **로딩·에러 상태**
  - 로드 실패: "이미지를 불러올 수 없습니다" + [다시 시도] 버튼
  - LABEL_ARCHIVE 부재: 뷰어 자체를 열지 않고 UI-024에서 "라벨 이미지가 아직 등록되지 않았습니다" 안내
- [ ] **접근성**
  - `<Dialog>` `aria-label="라벨 이미지 뷰어"`, 이미지 `alt="{제품명} {side} 라벨"`
  - `aria-live="polite"` 인디케이터
- [ ] **prefers-reduced-motion**
  - 전환 애니메이션 감소, 페이드만 유지
- [ ] **Mixpanel 이벤트**
  - `label_image_view`(product_id, side, index), `label_image_zoom`(product_id)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-023 로드 ≤ 1초**
- **Given**: 라벨 이미지가 등록된 제품에서 썸네일을 탭
- **When**: 뷰어가 열리고 풀사이즈 이미지를 로드
- **Then**: 이미지가 1초 이내에 표시된다(Supabase CDN + WebP + lazy-load).

**Scenario 2: 다중 이미지 스와이프**
- **Given**: 5장의 라벨 이미지가 존재, 뷰어가 index=0으로 열린 상태
- **When**: 우측 스와이프 또는 ArrowRight 키 입력
- **Then**: index가 1로 이동하고 인디케이터가 "2 / 5"로 갱신된다.

**Scenario 3: Pinch 줌**
- **Given**: 모바일에서 뷰어가 열린 상태
- **When**: 두 손가락 핀치 제스처
- **Then**: 이미지가 최대 3배까지 확대되고, 더블탭으로 원복된다.

**Scenario 4: Esc 닫기**
- **Given**: 뷰어가 열린 상태
- **When**: Esc 키 또는 [X] 탭
- **Then**: 뷰어가 닫히고 포커스가 썸네일로 복귀한다.

**Scenario 5: 로드 실패 재시도**
- **Given**: Supabase Storage가 일시적으로 404를 반환
- **When**: 뷰어가 열림
- **Then**: "이미지를 불러올 수 없습니다" + [다시 시도] 버튼이 표시된다.

**Scenario 6: 접근성 — 스크린리더**
- **Given**: 뷰어가 열린 상태에서 스크린리더 활성화
- **When**: 이미지 영역에 도달
- **Then**: `alt="{제품명} 앞면 라벨"` 문구가 읽히고 인디케이터가 polite로 갱신된다.

**Scenario 7: Mixpanel 이벤트**
- **Given**: 사용자가 썸네일을 탭하여 뷰어를 연 상태
- **When**: 이미지가 표시됨
- **Then**: `label_image_view`(product_id, side, index=0)이 1회 발송된다.

## :gear: Technical & Non-Functional Constraints
- **REQ-FUNC-023 로드 ≤ 1초**: Next.js `<Image>` + Supabase Storage CDN + WebP 자동 변환 + `priority={false}` (뷰어가 열릴 때만 로드).
- **이미지 최적화**: 원본 2~5MB JPG를 Supabase Storage transform으로 WebP ≤ 300KB(화면 해상도 기준)로 압축 요청.
- **모바일 UX**: 전체 화면 `fixed inset-0`, safe-area 대응, 원터치 닫기(배경 탭) 허용.
- **접근성(WAI-ARIA Dialog)**: 포커스 트랩, Esc, aria-label, aria-live 인디케이터.
- **prefers-reduced-motion**: 트랜지션·줌 애니메이션 최소화.
- **개인정보 주의**: 라벨 이미지에 제조사 로트번호·제조일 등이 노출될 수 있음. 업로드 가이드에서 마스킹 정책 운영(F4 업로드 측 책임).
- **번들 크기**: 줌 라이브러리는 ~15KB 이하의 경량 선택.
- **보안**: Supabase Storage Signed URL은 최대 1시간 유효. 만료 시 자동 재요청(F4-Q-002 책임).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~7)를 충족하는가?
- [ ] 이미지 로드 ≤ 1초가 관찰되는가?
- [ ] 스와이프 / ArrowKey 네비게이션이 동작하는가?
- [ ] Pinch 줌(모바일) + 휠 줌(데스크탑)이 동작하는가?
- [ ] 로드 실패 시 재시도 UI가 동작하는가?
- [ ] WAI-ARIA Dialog + Esc + 포커스 트랩이 적용되는가?
- [ ] Mixpanel `label_image_view`, `label_image_zoom` 이벤트 발송?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?
- [ ] TEST-F4-002가 GREEN인가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-024 (진입점), #F4-Q-002 (이미지 URL), #NFR-003 (Supabase Storage)
- **Blocks**:
  - #TEST-F4-002 (라벨 이미지 로드 ≤ 1초 검증)

## :bookmark_tabs: Notes
- 라벨 이미지는 E2 페르소나가 "직접 눈으로 검증"하는 마지막 신뢰 단계다. 흐릿하거나 읽히지 않으면 신뢰도를 크게 훼손하므로, 해상도·압축 품질을 보수적으로 설정.
- Phase 2에서 OCR로 라벨 성분 자동 추출(REQ-FUNC-022 확장)을 고려 중. 본 태스크에서는 뷰어만 구현하고, OCR 진입점은 추후 추가.
- 공유 카드 랜딩 페이지(UI-042)에서도 라벨 이미지 1장 미리보기를 재사용할 수 있도록 컴포넌트를 props 기반으로 재사용 가능하게 유지.
