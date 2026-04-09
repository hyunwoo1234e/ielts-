import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ═══ STUDENT CRUD ═══

export async function loadStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Load error:', error);
    return [];
  }
  
  return data.map(row => ({
    id: row.id,
    ...row.data,
    name: row.name
  }));
}

export async function saveStudent(student) {
  const { id, name, ...rest } = student;
  const { error } = await supabase
    .from('students')
    .upsert({
      id: id,
      name: name,
      data: student,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Save error:', error);
    return false;
  }
  return true;
}

export async function deleteStudent(id) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Delete error:', error);
    return false;
  }
  return true;
}
