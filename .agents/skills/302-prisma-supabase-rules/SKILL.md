---
name: 302-prisma-supabase-rules
description: Prisma 스키마 정의 / 마이그레이션 / Supabase Auth·Storage·RLS 운영 규약
---

# 302. Prisma + Supabase Rules

## 1. Prisma 스키마 (`prisma/schema.prisma`)

SRS §6.2 데이터 모델과 1:1 동기. 모델명 PascalCase, 테이블명 snake_case (`@@map`).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"             // 배포: Supabase Pooler
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")        // 마이그레이션 전용
}

model Product {
  product_id     String   @id @default(cuid())
  product_name   String
  brand_name     String
  manufacturer   String?
  category       String
  source_channel String                 // "COUPANG"
  original_url   String
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  ingredients     Ingredient[]
  price_snapshots PriceSnapshot[]
  label_archives  LabelArchive[]
  error_reports   ErrorReport[]

  @@map("products")
  @@index([category])
}

model Ingredient {
  ingredient_id      String  @id @default(cuid())
  product_id         String
  standard_name      String
  common_name        String?
  amount_per_serving Float
  unit               String                                          // mg, IU, CFU
  mfds_status        MfdsStatus
  mfds_claim         String?

  product Product @relation(fields: [product_id], references: [product_id], onDelete: Cascade)
  badges  Badge[]

  @@map("ingredients")
  @@index([standard_name])
  @@index([mfds_status])
}

model PriceSnapshot {
  snapshot_id     String   @id @default(cuid())
  product_id      String
  price_krw       Float
  shipping_fee    Float    @default(0)
  daily_cost_krw  Float
  captured_at     DateTime @default(now())

  product Product @relation(fields: [product_id], references: [product_id], onDelete: Cascade)

  @@map("price_snapshots")
  @@index([product_id, captured_at(sort: Desc)])
}

model Badge {
  badge_id        String     @id @default(cuid())
  ingredient_id   String
  badge_type      BadgeType
  badge_label     String                                              // 식약처 공전 원문만 (CON-2)
  evidence_source EvidenceSource
  evidence_url    String

  ingredient Ingredient @relation(fields: [ingredient_id], references: [ingredient_id], onDelete: Cascade)

  @@map("badges")
}

model LabelArchive {
  label_id    String   @id @default(cuid())
  product_id  String
  image_url   String                                                  // Supabase Storage URL
  uploaded_at DateTime @default(now())

  product Product @relation(fields: [product_id], references: [product_id], onDelete: Cascade)

  @@map("label_archives")
}

model ErrorReport {
  report_id       String       @id @default(cuid())
  product_id      String
  reporter_id     String
  field_name      String
  reported_value  String
  correct_value   String
  evidence_url    String?
  status          ReportStatus @default(SUBMITTED)
  reported_at     DateTime     @default(now())
  resolved_at     DateTime?

  product  Product @relation(fields: [product_id], references: [product_id])
  reporter User    @relation(fields: [reporter_id], references: [user_id])

  @@map("error_reports")
  @@index([status, reported_at])
  @@index([reporter_id, product_id, reported_at])     // 스팸 필터링 (REQ-FUNC-027)
}

model User {
  user_id      String   @id                                           // Supabase auth.users.id
  email        String   @unique
  persona_type String?                                                // C1, C2, A2, E2
  created_at   DateTime @default(now())

  error_reports ErrorReport[]

  @@map("users")
}

enum MfdsStatus { REGISTERED NOT_REGISTERED }
enum BadgeType { APPROVED CAUTION NOT_APPROVED }
enum EvidenceSource { MFDS PAPER MANUFACTURER }
enum ReportStatus { SUBMITTED REVIEWING RESOLVED REJECTED }
```

## 2. 마이그레이션 절차

```bash
pnpm prisma migrate dev --name <descriptive_name>   # 로컬 적용 + 마이그레이션 파일 생성
pnpm prisma migrate deploy                          # 프로덕션 적용 (Vercel Build Hook)
pnpm prisma generate                                # Client 재생성 (자동)
pnpm prisma studio                                  # GUI
```

- 마이그레이션 파일은 반드시 커밋. 수동 SQL 편집 금지.
- 파괴적 변경 (`DROP COLUMN`, `DROP TABLE`) 은 PR 리뷰 필수, 사전 백업 확인.

## 3. Supabase Auth (`@supabase/ssr`)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* getAll / setAll */ } }
  );
};
```

- 클라이언트용: `lib/supabase/client.ts` 의 `createBrowserClient`
- 미인증 사용자도 검색·비교 기능은 사용 가능 (이력 저장만 인증 필요)

## 4. Row Level Security (RLS) — 모든 테이블 필수

```sql
-- 예: error_reports
alter table error_reports enable row level security;

-- 본인의 제보만 조회 가능
create policy "report_owner_select" on error_reports
  for select using (auth.uid()::text = reporter_id);

-- 본인의 제보만 작성 가능
create policy "report_owner_insert" on error_reports
  for insert with check (auth.uid()::text = reporter_id);

-- 관리자만 status 변경
create policy "report_admin_update" on error_reports
  for update using (auth.jwt() ->> 'role' = 'admin');
```

체크리스트:
- [ ] `products`, `ingredients`, `price_snapshots`, `badges`, `label_archives`: 공개 읽기 + 관리자 쓰기
- [ ] `error_reports`: 본인 조회/작성, 관리자 처리
- [ ] `users`: 본인 행만 조회/수정

## 5. Supabase Storage (라벨 이미지)

- 버킷명: `label-archive`
- 정책: 공개 읽기, 인증된 관리자만 업로드
- 경로 컨벤션: `<product_id>/<timestamp>.<ext>`
- 업로드 후 `LABEL_ARCHIVE.image_url` 에 public URL 저장

## 6. 시드 데이터 (`prisma/seed.ts`)

- 상위 300~500개 제품 데이터를 사전 적재 (SRS §3.1.1 Minimum Viable Dataset)
- `pnpm prisma db seed` 실행
- CSV → seed 변환 스크립트 사용 (Coupang 직접 호출 금지, 정적 데이터셋)

## See also
- [.agents/skills/305-vercel-deploy-cron-kv-rules/SKILL.md](../305-vercel-deploy-cron-kv-rules/SKILL.md)
- [docs/05_SRS_v1.md](../../docs/05_SRS_v1.md) §6.2 Entity & Data Model
