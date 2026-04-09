# NstepIELTS 학생관리 — 배포 가이드

> 코딩 경험이 없어도 따라할 수 있도록 작성했습니다.
> 소요 시간: 약 30~40분

---

## 전체 흐름

```
1. GitHub 계정 만들기 (코드 저장소)
2. Supabase 계정 만들기 (데이터베이스)
3. Vercel 계정 만들기 (웹사이트 호스팅)
4. 코드를 GitHub에 업로드
5. Supabase에 테이블 생성
6. Vercel에서 배포
7. 완료! → nstep-ielts.vercel.app 접속
```

---

## STEP 1: GitHub 가입 + 저장소 만들기

1. **https://github.com** 접속 → Sign up
2. 가입 완료 후, 오른쪽 상단 **+** 버튼 → **New repository**
3. 설정:
   - Repository name: `nstep-ielts`
   - Public 선택 (무료)
   - "Add a README file" 체크 ✅
4. **Create repository** 클릭

### 코드 파일 업로드

1. 만들어진 저장소 페이지에서 **Add file** → **Upload files**
2. 제가 드린 `nstep-ielts` 폴더의 모든 파일을 드래그&드롭:
   ```
   nstep-ielts/
   ├── app/
   │   ├── layout.js
   │   └── page.jsx
   ├── lib/
   │   └── supabase.js
   ├── package.json
   ├── next.config.js
   ├── .gitignore
   └── .env.local.example
   ```
3. **Commit changes** 클릭

> ⚠️ 폴더 구조가 중요합니다! `app/page.jsx`가 `app` 폴더 안에 있어야 합니다.
> GitHub에서 폴더를 만들려면 파일명에 `app/page.jsx` 처럼 `/`를 포함하면 됩니다.

---

## STEP 2: Supabase 설정 (데이터베이스)

1. **https://supabase.com** 접속 → Start your project
2. GitHub 계정으로 로그인
3. **New project** 클릭
   - Name: `nstep-ielts`
   - Database Password: 아무거나 (메모해두세요)
   - Region: `Northeast Asia (Seoul)` ← 한국 선택!
4. **Create new project** 클릭 (1~2분 대기)

### 테이블 만들기

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 내용을 복사해서 붙여넣기:

```sql
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON students
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON students
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

4. **Run** 클릭 → "Success" 확인

### API 키 복사

1. 왼쪽 메뉴 **Settings** → **API**
2. 두 가지를 메모:
   - **Project URL**: `https://xxxx.supabase.co` (복사)
   - **anon public key**: `eyJ...` 로 시작하는 긴 문자열 (복사)

---

## STEP 3: Vercel 배포

1. **https://vercel.com** 접속 → Sign Up (GitHub 계정으로)
2. **Add New...** → **Project**
3. GitHub에서 `nstep-ielts` 저장소 선택 → **Import**
4. **Environment Variables** 섹션에서 추가:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` (STEP 2에서 복사한 URL) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (STEP 2에서 복사한 키) |

5. **Deploy** 클릭
6. 2~3분 대기 → **✅ Congratulations!** 화면 나오면 성공!

### 접속 URL

배포 완료 후 주어지는 URL:
```
https://nstep-ielts.vercel.app
```
이 URL을 폰/아이패드/노트북 어디서든 접속하면 됩니다!

---

## STEP 4: 커스텀 도메인 (선택사항)

`nstepielts.com` 같은 도메인을 사용하고 싶다면:

1. Vercel 프로젝트 → **Settings** → **Domains**
2. 도메인 입력 → 안내에 따라 DNS 설정
3. 도메인은 Namecheap, GoDaddy 등에서 구매 (연 $10~15)

---

## 수정이 필요할 때

### 방법 1: Claude에게 요청

1. 이 대화에서 "이거 수정해줘" 라고 말하기
2. 수정된 파일을 받기
3. GitHub에서 해당 파일을 열고 **Edit** → 내용 교체 → **Commit**
4. Vercel이 자동으로 30초 내 재배포

### 방법 2: GitHub에서 직접 수정

1. GitHub 저장소 → 수정할 파일 클릭
2. 연필 아이콘 (✏️ Edit) 클릭
3. 수정 후 **Commit changes**
4. 자동 재배포됨

---

## 문제 해결

### "페이지가 안 나와요"
- Vercel 대시보드에서 빌드 로그 확인
- 환경변수가 제대로 입력되었는지 확인

### "데이터가 저장 안 돼요"
- Supabase URL과 Key가 맞는지 확인
- Supabase Dashboard → Table Editor에서 students 테이블이 있는지 확인

### "AI 커리큘럼이 안 돼요"
- 이 기능은 Anthropic API 키가 필요합니다
- https://console.anthropic.com 에서 API 키 발급
- Vercel 환경변수에 `NEXT_PUBLIC_ANTHROPIC_API_KEY` 추가

---

## 비용

| 서비스 | 무료 범위 | 유료 시점 |
|--------|-----------|-----------|
| GitHub | 무제한 (Public) | Private 저장소도 무료 |
| Supabase | DB 500MB, 월 5만 API | 학생 100명 이하면 무료로 충분 |
| Vercel | 월 100GB 트래픽 | 혼자 쓰면 무료로 충분 |
| **합계** | **$0/월** | 대부분의 경우 무료 |

---

## 폴더 구조 설명

```
nstep-ielts/
├── app/
│   ├── layout.js      ← 전체 레이아웃 (폰트, 메타태그)
│   └── page.jsx       ← 메인 앱 전체 코드
├── lib/
│   └── supabase.js    ← DB 연결 코드
├── public/            ← 로고 이미지 등
├── package.json       ← 프로젝트 설정
├── next.config.js     ← Next.js 설정
├── .env.local.example ← 환경변수 예시
├── .gitignore         ← Git 제외 파일
└── supabase-schema.sql ← DB 테이블 생성 SQL
```
