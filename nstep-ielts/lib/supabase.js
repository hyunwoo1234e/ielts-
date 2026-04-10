import { createClient } from '@supabase/supabase-js';

var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
var supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export var supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function signUp(email, password) {
  if (!supabase) return { data: null, error: { message: 'DB not connected' } };
  return await supabase.auth.signUp({ email: email, password: password });
}

export async function signIn(email, password) {
  if (!supabase) return { data: null, error: { message: 'DB not connected' } };
  return await supabase.auth.signInWithPassword({ email: email, password: password });
}

export async function signOut() {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
}

export async function getUser() {
  if (!supabase) return null;
  try {
    var result = await supabase.auth.getUser();
    return result.data ? result.data.user : null;
  } catch (e) { return null; }
}

export function onAuthChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: function(){} } } };
  return supabase.auth.onAuthStateChange(callback);
}

export async function loadStudents() {
  if (!supabase) return [];
  try {
    var result = await supabase.from('students').select('*').order('updated_at', { ascending: false });
    if (result.error) return [];
    return result.data.map(function(row) {
      return Object.assign({ id: row.id, name: row.name }, row.data || {});
    });
  } catch (e) { return []; }
}

export async function saveStudent(student) {
  if (!supabase) return false;
  try {
    var result = await supabase.from('students').upsert({
      id: student.id, name: student.name, data: student,
      updated_at: new Date().toISOString()
    });
    return !result.error;
  } catch (e) { return false; }
}

export async function deleteStudent(id) {
  if (!supabase) return false;
  try {
    var result = await supabase.from('students').delete().eq('id', id);
    return !result.error;
  } catch (e) { return false; }
}
