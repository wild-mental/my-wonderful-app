# UX_FLOW.md — Super-Calc 핵심 UX 시나리오

> 본 문서는 Super-Calc 프로토타입의 주요 사용자 경험 흐름을 정의합니다.
> 각 시나리오는 사용자 목표 → 진입점 → 인터랙션 흐름 → 결과 순으로 기술합니다.

---

## 시나리오 1. 영양제 성분 검색 → 비교 결과 확인

**사용자 목표**: 특정 성분의 가장 저렴한 영양제를 1일 단가 기준으로 파악한다.

```mermaid
flowchart TD
    A([홈 화면 진입\n/]) --> B[검색창에 성분명 입력\n예: NMN]
    B --> C{자동완성 표시 여부}
    C -- 200ms 이내 입력 중 --> B
    C -- 입력 완료 --> D[자동완성 Dropdown 표시\nMOCK_AUTOCOMPLETE 기준]
    D --> E{사용자 선택}
    E -- 자동완성 항목 클릭 --> F[비교 결과 이동\n/compare/:searchTerm]
    E -- Enter 직접 입력 --> F
    E -- 인기 검색어 칩 클릭 --> F
    F --> G[CompareResults 화면\n제품 카드 목록 렌더링]
    G --> H[제품 카드 클릭]
    H --> I[제품 상세 화면\n/product/:productId]
```

**주요 인터랙션**
- `useDebounce(200ms)` 적용으로 타이핑 중 불필요한 API 호출 방지
- 인기 검색어 칩(Quick Search Chip)을 통해 탐색 진입점을 낮춤
- 검색창 포커스 해제 시 자동완성 Dropdown 자동 닫힘

---

## 시나리오 2. 미등록 제품 등록 요청

**사용자 목표**: 찾는 성분이 없을 때 직접 등록 요청을 제출한다.

```mermaid
flowchart TD
    A([홈 화면 검색]) --> B[자동완성 Dropdown 하단\n미등록 CTA 버튼 노출]
    B --> C[제품 등록 요청하기 클릭]
    C --> D[ProductRegistrationSheet 모달 열림\nregistrationSheet.open 호출]
    D --> E[성분명 사전 입력\nprefilledIngredient props]
    E --> F{이메일 입력 여부}
    F -- 선택사항 입력 --> G[요청 제출]
    F -- 미입력 --> G
    G --> H[어드민 AdminRegistrationRequests\n대기 목록에 노출]
```

**주요 인터랙션**
- 사용자가 검색한 쿼리가 `prefilledIngredient`로 모달에 자동 주입됨
- 이메일은 선택 사항 (미제공 → 어드민 화면에서 "미제공" 표시)

---

## 시나리오 3. 제품 상세 확인 → 오류 신고

**사용자 목표**: 제품 정보의 오류를 발견하고 신고한다.

```mermaid
flowchart TD
    A([제품 상세 화면\n/product/:productId]) --> B[하단 오류 신고 버튼 클릭]
    B --> C[ErrorReportModal 열림\nerrorReportModal.open 호출]
    C --> D[오류 유형 선택\n가격/성분/배지/제품정보/기타]
    D --> E[설명 입력 및 이메일 선택 입력]
    E --> F[신고 제출]
    F --> G[어드민 AdminErrorReports\n미처리 신고 목록에 노출]
    G --> H{어드민 처리}
    H -- 처리 완료 클릭 --> I[status: resolved 변경]
```

**주요 인터랙션**
- `ErrorReportModal`은 `productName`, `productId`를 props로 받아 신고 맥락 자동 완성
- 신고 유형은 `ERROR_TYPE_MAP` 상수(constants/index.ts)로 중앙 관리

---

## 시나리오 4. 제품 상세 → 공유

**사용자 목표**: 특정 제품 정보를 지인에게 공유한다.

```mermaid
flowchart TD
    A([제품 상세 화면]) --> B[공유하기 버튼 클릭]
    B --> C[ShareModal 열림\nshareModal.open 호출]
    C --> D[공유 URL 자동 생성\n/share/:productId]
    D --> E{공유 방법 선택}
    E -- URL 복사 --> F[클립보드에 복사\n토스트 알림]
    E -- 외부 공유 --> G[ShareLanding 화면\n/share/:shareId]
```

---

## 시나리오 5. 어드민 — 등록 요청 처리

**사용자 목표**: 사용자가 요청한 미등록 제품을 검토하고 승인 또는 거부한다.

```mermaid
flowchart TD
    A([어드민 로그인\n/admin/login]) --> B[AdminDashboard\n/admin/dashboard]
    B --> C[제품 등록 요청 관리 카드 클릭]
    C --> D[AdminRegistrationRequests\n/admin/registration-requests]
    D --> E{대기 중인 요청}
    E -- 승인 클릭 --> F[handleApprove 호출\nstatus: approved]
    E -- 거부 클릭 --> G[handleReject 호출\nstatus: rejected]
    F --> H[토스트 알림 표시\n처리 완료 목록 이동]
    G --> H
```

---

## 모달 상태 관리 공통 패턴

모든 모달은 `useModal` 훅의 반환값(`isOpen`, `open`, `close`)을 통해 제어됩니다.

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant useModal
    participant Modal

    User->>Component: 버튼 클릭 (예: 공유하기)
    Component->>useModal: shareModal.open()
    useModal-->>Component: isOpen = true
    Component->>Modal: isOpen={true} props 전달
    Modal-->>User: 모달 화면 표시
    User->>Modal: 닫기 클릭
    Modal->>Component: onClose() 호출
    Component->>useModal: shareModal.close()
    useModal-->>Component: isOpen = false
    Modal-->>User: 모달 닫힘
```
