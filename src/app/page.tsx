import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          DATA-001 · Scaffolding
        </p>
        <h1 className="text-3xl font-bold tracking-tight">건기식 성분·가격 비교 플랫폼</h1>
        <p className="text-base text-muted-foreground">
          Next.js App Router + Prisma + Tailwind + shadcn/ui 초기 스캐폴딩이 완료되었습니다.
        </p>
      </header>

      <ul className="grid w-full gap-2 text-sm text-muted-foreground">
        <li>
          <code className="rounded bg-muted px-1.5 py-0.5">/api/health</code> — 헬스체크
        </li>
        <li>
          <code className="rounded bg-muted px-1.5 py-0.5">prisma/schema.prisma</code> — 빈 스키마
          스켈레톤
        </li>
        <li>
          <code className="rounded bg-muted px-1.5 py-0.5">src/lib/db.ts</code> — Prisma Client
          Singleton
        </li>
      </ul>

      <Button variant="default">Hello shadcn/ui</Button>
    </main>
  );
}
