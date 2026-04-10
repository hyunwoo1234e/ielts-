import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ═══ AUTH ═══
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ═══ STUDENT CRUD ═══
export async function loadStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) { console.error('Load error:', error); return []; }
  return data.map(function(row) { return Object.assign({ id: row.id, name: row.name }, row.data); });
}

export async function saveStudent(student) {
  var id = student.id;
  var name = student.name;
  var error = (await supabase.from('students').upsert({
    id: id, name: name, data: student, updated_at: new Date().toISOString()
  })).error;
  if (error) console.error('Save error:', error);
  return !error;
}

export async function deleteStudent(id) {
  var error = (await supabase.from('students').delete().eq('id', id)).error;
  if (error) console.error('Delete error:', error);
  return !error;
}
