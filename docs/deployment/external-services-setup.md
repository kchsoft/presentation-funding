# 외부 서비스 연결 및 배포 가이드

- 기준일: 2026-07-15
- 대상: 선물모아 프로토타입
- 구성: Next.js 16 + Auth.js 5 + Prisma 7 + Supabase PostgreSQL + Vercel

이 문서는 현재 로컬 프로젝트를 Supabase, GitHub, Vercel, 카카오 로그인과 연결해 실제 URL에서 끝까지 테스트하기 위한 체크리스트다.

## 0. 전체 연결 구조

| 서비스 | 역할 | 이 프로젝트에서 필요한 값 |
|---|---|---|
| Supabase | PostgreSQL 데이터베이스 | `DATABASE_URL`, `DIRECT_URL` |
| GitHub | 원격 Git 저장소, Vercel 배포 소스 | 저장소 URL |
| Vercel | Next.js 빌드·호스팅 | 환경변수 5개, Production Branch |
| Kakao Developers | 카카오 OAuth 로그인 | REST API 키, Client Secret, Redirect URI |

권장 진행 순서는 다음과 같다.

1. Supabase 프로젝트와 DB 연결 문자열 준비
2. 로컬 `.env` 설정 및 DB 초기 마이그레이션
3. GitHub 저장소 생성 및 push
4. Vercel 프로젝트 생성 및 운영 도메인 확인
5. Kakao Developers 설정
6. Vercel 환경변수 완성 및 재배포
7. 배포 후 전체 사용자 흐름 점검

## 1. 사전에 알아둘 현재 프로젝트 상태

- Prisma는 Supabase PostgreSQL용 `@prisma/adapter-pg`를 사용한다.
- 기존 SQLite `dev.db`의 데이터는 Supabase로 자동 이전되지 않는다.
- PostgreSQL 마이그레이션은 운영 이력 없는 프로토타입을 전제로 초기 baseline 1개로 합쳐져 있다.
- Supabase Auth, Storage, Realtime은 사용하지 않는다. Supabase에서는 PostgreSQL만 사용한다.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`는 필요 없다.
- 현재 작업 브랜치는 `feat/og-preview`다. `main`으로 합치지 않을 경우 Vercel Production Branch를 반드시 `feat/og-preview`로 지정한다.
- 현재 Git remote는 아직 없다.

## 2. 필요한 환경변수

| 이름 | 발급처 | 사용 위치 | 비밀값 여부 |
|---|---|---|---|
| `DATABASE_URL` | Supabase Connect | 로컬, Vercel | 비밀 |
| `DIRECT_URL` | Supabase Connect | 로컬, Vercel/관리 환경 | 비밀 |
| `AUTH_SECRET` | 직접 생성 | 로컬, Vercel | 비밀 |
| `AUTH_KAKAO_ID` | Kakao REST API key | 로컬, Vercel | 공개 식별자지만 env로 관리 |
| `AUTH_KAKAO_SECRET` | Kakao Client Secret | 로컬, Vercel | 비밀 |

실제 값은 Git에 커밋하지 않는다. `.env`는 이미 `.gitignore` 대상이며, 형식만 [.env.example](../../.env.example)에 보관한다.

`NEXT_PUBLIC_` 접두사는 브라우저에 값을 노출하므로 위 변수에는 절대 붙이지 않는다.

## 3. Supabase PostgreSQL 연결

### 3.1 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트를 만든다.
2. 사용자와 가까운 리전을 선택한다.
3. Database Password를 생성해 안전한 곳에 보관한다.
4. 프로젝트 생성이 끝나면 상단의 **Connect**를 연다.

프로토타입 단계에서는 Dashboard가 제공하는 기본 DB 사용자 연결 문자열을 사용해도 된다. 운영 전에는 Supabase 공식 Prisma 가이드처럼 별도 `prisma` DB 사용자를 만드는 것을 검토한다.

### 3.2 두 연결 문자열 준비

Vercel 같은 serverless 런타임과 Prisma CLI는 서로 다른 연결을 사용한다.

| 변수 | Supabase 연결 방식 | 포트 | 용도 |
|---|---|---:|---|
| `DATABASE_URL` | Supavisor Transaction pooler | `6543` | Vercel/Next.js 런타임 쿼리 |
| `DIRECT_URL` | Supavisor Session pooler | `5432` | Prisma migration, introspection, 관리 명령 |

형식 예시는 다음과 같다. Dashboard에서 복사한 실제 문자열을 우선 사용한다.

```dotenv
DATABASE_URL="postgresql://DB_USER.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?sslmode=require"
DIRECT_URL="postgresql://DB_USER.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres?sslmode=require"
```

주의사항:

- 비밀번호에 `@`, `:`, `/`, `#`, `%` 같은 문자가 있으면 URL 인코딩해야 한다.
- migration에 `6543` Transaction URL을 사용하지 않는다.
- IPv6 direct connection 대신 IPv4를 지원하는 Session pooler `5432`를 사용하면 로컬 네트워크 호환성이 좋다.

### 3.3 로컬 `.env` 설정

이미 `.env`가 있으므로 파일을 덮어쓰지 않는다.

1. 기존 `DATABASE_URL="file:./dev.db"`를 Supabase Transaction URL로 교체한다.
2. `DIRECT_URL`을 추가한다.
3. 기존 `AUTH_SECRET`은 유지한다.

새 환경 파일을 처음 만드는 경우에만 다음 명령을 사용한다.

```bash
cp .env.example .env
```

### 3.4 빈 Supabase DB에 스키마 생성

현재 baseline은 빈 DB에 한 번 적용하는 초기 마이그레이션이다.

```bash
npm run db:deploy
npm run db:status
npm run db:generate
```

성공하면 Supabase Table Editor에 다음 테이블이 보여야 한다.

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `Funding`
- `Contribution`
- `_prisma_migrations`

이어서 로컬 앱을 확인한다.

```bash
npm run dev
```

### 3.5 Supabase API 노출 관련

이 앱은 Prisma로만 DB를 사용하므로 Supabase Data API를 사용하지 않는다. 프로토타입 이후에는 다음 중 하나를 적용한다.

- Supabase API Settings에서 Data API를 비활성화한다.
- 또는 `public` 스키마를 API 노출 대상에서 제거하고 권한/RLS 정책을 별도로 정리한다.

DB 연결 문자열은 서버에서만 사용하며 브라우저 코드에 전달하지 않는다.

## 4. GitHub 연결

### 4.1 비밀값 커밋 여부 확인

push 전에 다음을 확인한다.

```bash
git status --short
git check-ignore -v .env
git grep -n "postgresql://" -- ':!*.example' ':!*.md'
```

마지막 명령은 결과가 없어야 한다.

### 4.2 GitHub CLI로 새 저장소 생성

GitHub CLI가 설치되고 로그인돼 있다면 다음처럼 현재 로컬 저장소를 바로 올릴 수 있다.

```bash
gh auth status
gh repo create funding --private --source=. --remote=origin --push
```

또는 GitHub 웹에서 빈 저장소를 만든 다음 연결한다.

```bash
git remote add origin git@github.com:GITHUB_ID/funding.git
git push -u origin feat/og-preview
```

현재 작업을 `main`에 합치지 않을 계획이면 GitHub의 기본 브랜치를 `feat/og-preview`로 설정하거나, 다음 Vercel 단계에서 해당 브랜치를 Production Branch로 명시한다.

## 5. Vercel 프로젝트 생성

### 5.1 GitHub 저장소 Import

1. [Vercel Dashboard](https://vercel.com/new)에서 **New Project**를 연다.
2. GitHub 계정을 연결하고 위 저장소를 Import한다.
3. Framework Preset이 `Next.js`인지 확인한다.
4. Root Directory는 저장소 루트 `.`을 사용한다.
5. Install Command와 Build Command는 기본값을 사용한다.
   - Install: `npm install`
   - Build: `npm run build`

`postinstall`에서 `prisma generate`가 자동 실행된다. Vercel Build Command에 `prisma migrate deploy`를 합치지 않는다. DB migration은 로컬 또는 별도 CI 단계에서 명시적으로 실행한다.

### 5.2 Production Branch 설정

현재 브랜치를 그대로 배포한다면 다음을 설정한다.

```text
Vercel Project → Settings → Environments → Production → Branch Tracking
Production Branch = feat/og-preview
```

나중에 코드를 `main`에 합치면 Production Branch도 `main`으로 되돌릴 수 있다.

### 5.3 1차 환경변수 등록

Vercel Project → Settings → Environment Variables에 먼저 다음 값을 넣는다.

```text
DATABASE_URL
DIRECT_URL
AUTH_SECRET
```

프로토타입에서는 Production과 Preview 모두 같은 Supabase DB를 사용해도 되지만, Preview에서 생성·삭제한 데이터가 Production에도 반영된다는 점을 인지해야 한다.

`AUTH_SECRET`은 기존 로컬 값과 동일하게 쓰거나 다음 명령으로 새로 만들 수 있다.

```bash
openssl rand -base64 32
```

이미 사용자 세션이 있는 상태에서 `AUTH_SECRET`을 바꾸면 기존 세션이 무효화될 수 있다.

Vercel에서는 `VERCEL` 시스템 환경변수로 Auth.js의 trusted host가 자동 처리되므로 일반적으로 `AUTH_TRUST_HOST`와 `AUTH_URL`을 추가하지 않는다.

### 5.4 운영 URL 확인

프로젝트를 한 번 배포하거나 Vercel Project Domains 화면에서 고정 Production URL을 확인한다.

```text
https://PROJECT_NAME.vercel.app
```

이 고정 주소를 다음 카카오 Redirect URI에 사용한다. 랜덤 Preview URL은 매 배포마다 달라질 수 있어 기본 카카오 콜백 주소로 적합하지 않다.

## 6. Kakao Developers 설정

이 프로젝트의 Auth.js Kakao Provider는 Kakao REST API OAuth를 사용한다. JavaScript SDK는 사용하지 않는다.

### 6.1 앱 생성과 키 확인

1. [Kakao Developers Console](https://developers.kakao.com/console/app)에서 애플리케이션을 만든다.
2. 앱 관리의 **앱 → 플랫폼 키 → REST API 키**를 연다.
3. REST API 키 값을 복사한다.
4. 같은 REST API 키 설정에서 Client Secret을 생성·활성화하고 값을 복사한다.

환경변수 매핑은 다음과 같다.

| 프로젝트 환경변수 | Kakao Developers 값 |
|---|---|
| `AUTH_KAKAO_ID` | REST API 키 |
| `AUTH_KAKAO_SECRET` | Client Secret |

### 6.2 Kakao Login 활성화

앱 관리에서 다음을 설정한다.

```text
카카오 로그인 → 사용 설정 → 상태 ON
```

상태가 OFF면 `KOE004` 오류가 발생한다.

### 6.3 Redirect URI 등록

REST API 키의 Redirect URI 설정에 다음 주소를 정확히 등록한다.

```text
https://PROJECT_NAME.vercel.app/api/auth/callback/kakao
```

로컬에서도 실제 카카오 로그인을 테스트하려면 함께 등록한다.

```text
http://localhost:3000/api/auth/callback/kakao
```

프로토콜, 도메인, 포트, 경로, 마지막 슬래시까지 요청값과 등록값이 정확히 같아야 한다. 불일치하면 `KOE006` 오류가 발생한다.

커스텀 도메인을 나중에 붙이면 해당 도메인의 콜백도 추가한다.

```text
https://CUSTOM_DOMAIN/api/auth/callback/kakao
```

Vercel Preview URL에서 카카오 로그인을 테스트하려면 각 Preview URL의 콜백을 별도로 등록해야 한다. 와일드카드 Redirect URI에 의존하지 않는다.

### 6.4 동의항목

현재 Auth.js Kakao Provider가 사용하는 사용자 정보는 다음과 같다.

- Kakao 사용자 ID: 필수 식별자
- 닉네임: `User.name`
- 프로필 이미지: `User.image`
- 이메일: `User.email`, 없어도 동작 가능

카카오 로그인 동의항목에서 프로필 닉네임과 프로필 이미지 사용 상태를 확인한다. 이메일은 프로토타입에서 필수로 요구하지 않아도 된다. 이메일이나 프로필 제공에 동의하지 않은 경우에도 앱 코드가 `null`을 허용한다.

테스트 앱에서 다른 사람에게 `KOE005`가 발생하면 해당 카카오 계정을 앱 멤버로 초대한다.

### 6.5 JavaScript 도메인 설정 여부

이 앱은 Kakao JavaScript SDK가 아니라 서버의 REST API OAuth를 사용한다. 따라서 현재 구현에는 JavaScript 키의 SDK 도메인 등록이 필요하지 않다. 핵심은 REST API 키와 정확한 Redirect URI다.

## 7. Vercel 환경변수 완성 및 재배포

Kakao 설정이 끝나면 Vercel에 나머지 값을 추가한다.

```text
AUTH_KAKAO_ID=<Kakao REST API key>
AUTH_KAKAO_SECRET=<Kakao Client Secret>
```

최종 환경변수 목록은 다음 5개다.

```text
DATABASE_URL
DIRECT_URL
AUTH_SECRET
AUTH_KAKAO_ID
AUTH_KAKAO_SECRET
```

환경변수를 변경한 뒤에는 기존 배포에 자동 반영되지 않으므로 Vercel에서 Redeploy하거나 새 commit을 push한다.

로컬 `.env`에도 Kakao 값을 넣으면 개발용 Credentials 로그인이 사라지고 실제 Kakao 로그인만 표시된다.

## 8. 배포 후 점검 체크리스트

### 인프라

- [ ] `npm run db:status`가 모든 migration 적용 완료로 표시된다.
- [ ] Vercel Build가 성공한다.
- [ ] Vercel Function 로그에 DB 연결 오류가 없다.
- [ ] GitHub push 시 Vercel 배포가 자동 실행된다.
- [ ] `.env`와 DB 비밀번호가 GitHub에 올라가지 않았다.

### 인증

- [ ] Production URL에서 카카오 로그인 화면으로 이동한다.
- [ ] 로그인 후 `/me`에 접근할 수 있다.
- [ ] Supabase `User`, `Account` 테이블에 레코드가 생성된다.
- [ ] 로그아웃 후 다시 로그인할 수 있다.

### 서비스 기능

- [ ] 로그인 사용자가 펀딩을 생성한다.
- [ ] 비로그인/시크릿 창에서 공유 링크로 참여한다.
- [ ] 참여 금액은 펀딩 소유자에게만 보인다.
- [ ] 롤링페이퍼에는 금액이 표시되지 않는다.
- [ ] 참여 메시지 수정·삭제가 같은 브라우저에서 동작한다.
- [ ] 소유자의 카드 숨김·복구가 동작한다.

## 9. 자주 발생하는 오류

### DB에 연결할 수 없음

- `DATABASE_URL`이 `6543`, `DIRECT_URL`이 `5432`인지 확인한다.
- 비밀번호의 특수문자가 URL 인코딩됐는지 확인한다.
- Supabase 프로젝트가 일시 정지 상태인지 확인한다.
- migration 명령은 `DIRECT_URL`을 사용해야 한다.

### `DATABASE_URL에 Supabase PostgreSQL 연결 문자열을 설정해주세요`

현재 `.env`에 SQLite의 `file:./dev.db`가 남아 있거나 값이 빠진 상태다. Supabase PostgreSQL URL로 교체한다.

### Auth.js `UntrustedHost`

- Vercel에서는 보통 자동 처리된다.
- 로컬 `next start` 테스트에서만 발생하면 `.env`에 `AUTH_TRUST_HOST="true"`를 임시로 추가한다.

### Kakao `KOE004`

Kakao Login 사용 설정이 OFF다. 상태를 ON으로 바꾼다.

### Kakao `KOE005`

테스트 권한이 없는 계정이다. Kakao Developers 앱 멤버로 초대한다.

### Kakao `KOE006`

실제 요청의 Redirect URI와 Kakao Developers 등록값이 다르다. 다음 전체 주소를 비교한다.

```text
https://PROJECT_NAME.vercel.app/api/auth/callback/kakao
```

### Vercel에는 배포됐지만 오래된 코드가 보임

Vercel Production Branch가 `main`으로 되어 있고 최신 코드는 `feat/og-preview`에 있을 가능성이 높다. Branch Tracking 설정을 확인한다.

## 10. 공식 참고 문서

- [Supabase: Prisma 연결](https://supabase.com/docs/guides/database/prisma)
- [Supabase: Postgres 연결 방식](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Vercel: Git 저장소 배포](https://vercel.com/docs/git)
- [Vercel: 환경변수](https://vercel.com/docs/environment-variables)
- [GitHub: 로컬 저장소를 GitHub에 추가](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [Kakao Login: 설정하기](https://developers.kakao.com/docs/ko/kakaologin/prerequisite)
- [Kakao Login: REST API](https://developers.kakao.com/docs/ko/kakaologin/rest-api)
- [Kakao Login: 오류 코드](https://developers.kakao.com/docs/ko/kakaologin/trouble-shooting)
