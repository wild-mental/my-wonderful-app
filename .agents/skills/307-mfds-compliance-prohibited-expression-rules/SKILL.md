---
name: 307-mfds-compliance-prohibited-expression-rules
description: 식약처 건강기능식품공전 1:1 매칭 강제 / 질병 예방·치료 금지 표현 빌드 시 검수 / 일상어 번역 화이트리스트
---

# 307. MFDS Compliance & Prohibited Expression Rules

## 1. 컨텍스트

- 본 스킬은 뱃지(`BADGE`) / 성분(`INGREDIENT`) / 제품 카피 텍스트 작업 시 의무 적용.
- 위반 시 건강기능식품법 위반 (R2: 점수 10, High) — **빌드 차단** lint 게이트로 동작.
- 관련 룰: [.cursor/rules/004-mfds-compliance.mdc](../../.cursor/rules/004-mfds-compliance.mdc)

## 2. 식약처 공전 1:1 매칭 강제 (REQ-FUNC-011)

- `Badge.badge_label` 은 식약처 건강기능식품공전 **원문**만 래핑.
- 매칭 검증:
  - `INGREDIENT.standard_name` ↔ 식약처 공전 원료명 정확 일치
  - `INGREDIENT.mfds_claim` ↔ 공전 기능성 인정 문구 그대로
  - `Badge.evidence_url` 은 식약처 공식 URL 또는 검증된 논문 DOI 만
- 불일치율 < 0.5% 보장 (월 1회 무작위 50건 샘플 검수)

```typescript
// lib/badge/mfds-matcher.ts
export async function verifyBadgeMatchesMfds(badge: Badge): Promise<Result<void, MismatchError>> {
  const mfdsRecord = await prisma.mfdsClaim.findFirst({
    where: { standard_name: badge.ingredient.standard_name },
  });
  if (!mfdsRecord) return err({ type: 'NOT_REGISTERED', ingredient: badge.ingredient.standard_name });
  if (mfdsRecord.claim_text !== badge.badge_label) return err({ type: 'LABEL_MISMATCH' });
  return ok(undefined);
}
```

## 3. 금지 표현 빌드 lint (CON-2, REQ-NF-017)

### 금지 패턴 목록 (`lib/badge/prohibited-expressions.ts`)

```typescript
export const PROHIBITED_PATTERNS: ReadonlyArray<{ pattern: RegExp; category: string; reason: string }> = [
  // 질병 예방·치료 표현
  { pattern: /예방(에|이|을|는)?\s*(효과|도움)/, category: 'DISEASE_PREVENTION', reason: '질병 예방 표현' },
  { pattern: /치료(에|이|을|는)?\s*(효과|도움)/, category: 'DISEASE_TREATMENT', reason: '질병 치료 표현' },
  { pattern: /완치|낫게\s?(해|함)/, category: 'CURE_CLAIM', reason: '완치·치유 표현' },
  { pattern: /(암|당뇨|고혈압|치매|관절염)(에|이|을)?\s*(좋|효과)/, category: 'DISEASE_SPECIFIC', reason: '특정 질환 효능 시사' },

  // 의약품 효능 시사
  { pattern: /임상[적]?으?로?\s*(증명|입증)/, category: 'CLINICAL_CLAIM', reason: '임상 증명 단정' },
  { pattern: /특허\s?받[은이]?\s*효능/, category: 'PATENT_EFFICACY', reason: '특허 효능 단정' },

  // 비교 우위 단정 (객관 출처 명시 시에만 허용)
  { pattern: /국내?\s*최고/, category: 'SUPERLATIVE', reason: '최상급 표현' },
  { pattern: /유일한\s*(제품|성분)/, category: 'SUPERLATIVE', reason: '독점 표현' },
];
```

### lint 스크립트 (`scripts/lint-mfds.ts`)

```bash
pnpm lint:mfds                    # CI 게이트
```

```typescript
import { PROHIBITED_PATTERNS } from '@/lib/badge/prohibited-expressions';

const violations: Array<{ file: string; line: number; pattern: string }> = [];
// AST 또는 정규식 스캔으로 .tsx / .ts / .md / DB seed 데이터 검사
if (violations.length > 0) {
  console.error(JSON.stringify(violations, null, 2));
  process.exit(1);
}
```

CI / pre-commit 훅에서 강제 실행. 위반 = 빌드 실패.

## 4. 미등재 원료 처리 (REQ-FUNC-014)

```tsx
function BadgeRenderer({ ingredient, badge }: Props) {
  if (ingredient.mfds_status === 'NOT_REGISTERED') {
    return (
      <Tooltip content="식약처 건강기능식품공전에 등재되지 않은 원료입니다. 기능성 인정 정보가 없어 뱃지를 부여하지 않습니다.">
        <span className="text-slate-400 text-sm">식약처 미등재 원료 — 기능성 인정 정보 없음</span>
      </Tooltip>
    );
  }
  return <Badge variant={badge.type}>{badge.label}</Badge>;
}
```

- 미등재 원료 식별 정확도 ≥ 99%
- 뱃지 오발급률 = 0%

## 5. 일상어 번역 (REQ-FUNC-013)

### 단일 화이트리스트 (`lib/badge/translations.ts`)

```typescript
export const COMMON_NAME_MAP: ReadonlyMap<string, string> = new Map([
  ['콜레칼시페롤', '몸에 잘 흡수되는 비타민 D3'],
  ['시아노코발라민', '비타민 B12'],
  ['아스코르브산', '비타민 C'],
  ['피리독신 염산염', '비타민 B6'],
  ['리보플라빈', '비타민 B2'],
  // ... 식약처 등록 기능성 원료 기준 ≥ 95% 커버리지
]);

export function translateToCommonLanguage(standardName: string): string | null {
  return COMMON_NAME_MAP.get(standardName) ?? null;
}
```

- 커버리지 ≥ 95% (식약처 등록 기능성 원료 기준)
- 번역 정확도 ≥ 98% — 분기 1회 외부 검수
- 번역 표시 형식: `"콜레칼시페롤 (몸에 잘 흡수되는 비타민 D3)"`

## 6. 출처 투명 공개 (REQ-FUNC-022)

뱃지 / 성분 데이터마다 `"[출처 확인]"` 버튼 노출, 클릭 시 다음 정보가 아코디언으로 펼쳐진다:
- 식약처 DB 직접 링크 (`evidence_url`)
- 제조사 라벨 이미지 (`LABEL_ARCHIVE.image_url`)
- 논문 DOI (선택)

출처 도달 ≤ 2클릭, 아코디언 렌더 ≤ 500ms (REQ-NF-004) 보장.

## 7. 검증 체크리스트 (PR 머지 전)

- [ ] `pnpm lint:mfds` 통과 (0 violations)
- [ ] 신규 뱃지 텍스트가 공전 원문과 100% 일치 (수동 spot-check)
- [ ] 미등재 원료에 뱃지 부여되지 않았는지 SQL 점검
- [ ] 번역 매핑 추가분이 화이트리스트에 등록됨

## 8. 금지 사항

- ❌ AI / LLM 으로 뱃지 텍스트 자동 생성 (공전 원문 외 일체 금지)
- ❌ 일상어 번역 동적 LLM 호출 (반드시 정적 화이트리스트)
- ❌ Lint 게이트 우회 (`// mfds-lint-ignore` 등)

## See also
- [.cursor/rules/004-mfds-compliance.mdc](../../.cursor/rules/004-mfds-compliance.mdc)
- [.agents/skills/302-prisma-supabase-rules/SKILL.md](../302-prisma-supabase-rules/SKILL.md)
- [docs/05_SRS_v1.md](../../docs/05_SRS_v1.md) §4.1.2 F2 Anti-BS Dashboard
