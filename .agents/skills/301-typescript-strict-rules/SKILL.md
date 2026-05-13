---
name: 301-typescript-strict-rules
description: TypeScript strict 모드 / Zod 런타임 검증 / Result 타입 에러 핸들링 / 타입 안전 컨벤션
---

# 301. TypeScript Strict Rules

## 1. `tsconfig.json` 필수 옵션

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 2. Zod 런타임 검증 (모든 외부 경계)

외부 입력은 반드시 Zod 로 검증한다 — Route Handler 의 `searchParams`, Server Action 의 `FormData`, 외부 API 응답.

```typescript
import { z } from 'zod';

const CompareParamsSchema = z.object({
  ingredient: z.string().min(1).max(50),
  dosage: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = CompareParamsSchema.safeParse({
    ingredient: url.searchParams.get('ingredient'),
    dosage: url.searchParams.get('dosage'),
  });
  if (!parsed.success) {
    return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }
  // 이후 parsed.data 는 강타입 보장
}
```

## 3. `Result<T, E>` 에러 핸들링 패턴

`throw` 는 예외적 경계에서만. 비즈니스 흐름은 `Result` 로 명시한다.

```typescript
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

호출부:

```typescript
const result = await fetchCoupangPrice(productId);
if (!result.ok) {
  return fallbackFromCache(productId);
}
return normalize(result.value);
```

## 4. 금지 패턴

- ❌ `any` 반환 / 인수 타입 (`unknown` 또는 제너릭 사용)
- ❌ `as` 강제 캐스팅 (Zod 검증 또는 타입 가드 사용)
- ❌ Non-null assertion `!` (Optional chaining `?.` + 기본값 사용)
- ❌ `// @ts-ignore`, `// @ts-expect-error` (불가피하면 PR 리뷰 필수 + 이슈 번호 주석)

## 5. 유용한 유틸리티 타입

```typescript
// Prisma 모델에서 일부 필드만 추출
type ProductCard = Pick<Product, 'product_id' | 'product_name' | 'brand_name'>;

// 필수/선택 변환
type Required<T> = { [K in keyof T]-?: T[K] };

// 식별 가능한 유니온 (뱃지 타입)
type Badge =
  | { type: 'APPROVED'; mfdsClaim: string; evidenceUrl: string }
  | { type: 'CAUTION'; reason: string; evidenceUrl: string }
  | { type: 'NOT_APPROVED'; reason: string }
  | { type: 'UNREGISTERED'; tooltipMessage: string };
```

## 6. 타입 가드 예시

```typescript
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

switch (badge.type) {
  case 'APPROVED': /* ... */ break;
  case 'CAUTION': /* ... */ break;
  case 'NOT_APPROVED': /* ... */ break;
  case 'UNREGISTERED': /* ... */ break;
  default: assertNever(badge);
}
```

## See also
- [.agents/skills/304-route-handler-server-action-rules/SKILL.md](../304-route-handler-server-action-rules/SKILL.md)
