-- =============================================
-- NstepIELTS 학생관리 - Supabase Schema
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- =============================================

-- 학생 테이블 (각 학생의 전체 데이터를 JSONB로 저장)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업데이트 시 자동 시간 갱신
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

-- Row Level Security 활성화
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 CRUD 가능 (간단한 설정)
-- 나중에 instructor_id 컬럼 추가하여 강사별 분리 가능
CREATE POLICY "Allow all for authenticated" ON students
  FOR ALL USING (true) WITH CHECK (true);

-- 익명 사용자도 접근 허용 (초기 테스트용 - 나중에 제거 가능)
CREATE POLICY "Allow all for anon" ON students
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_students_name ON students (name);
CREATE INDEX IF NOT EXISTS idx_students_updated ON students (updated_at DESC);
