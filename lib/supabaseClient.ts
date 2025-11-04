import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: Em uma aplicação real, estas chaves devem vir de um local seguro
// de variáveis de ambiente (como `process.env` em um servidor ou um arquivo .env
// com uma ferramenta de build).
// Codificá-las diretamente aqui é APENAS para fins de demonstração neste ambiente
// específico, que não suporta `process.env`.
// CERTIFIQUE-SE DE INVALIDAR ESTAS CHAVES SE ELAS FOREM EXPOSTAS PUBLICAMENTE.
const supabaseUrl = 'https://givgdvimnppvawkgbznn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdkdmltbnBwdmF3a2diem5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMjg1ODksImV4cCI6MjA3NzgwNDU4OX0.8vLoORdHirKGoxILPIvRkOqLF4YorQNOvpMXtTgUOfw';

if (!supabaseUrl || !supabaseAnonKey) {
    // A verificação é mantida caso os valores codificados sejam removidos posteriormente.
    throw new Error("A URL e a Chave Anon do Supabase devem ser fornecidas.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
