import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: As chaves do Supabase agora são carregadas a partir de variáveis de ambiente.
// Para o deploy na Vercel, você DEVE configurar as seguintes variáveis de ambiente
// no painel do seu projeto:
// 1. VITE_SUPABASE_URL: A URL do seu projeto Supabase.
// 2. VITE_SUPABASE_ANON_KEY: A chave anônima (public) do seu projeto.
//
// O prefixo VITE_ é uma convenção para expor variáveis ao front-end de forma segura
// durante o processo de build com ferramentas como o Vite.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Exporta uma flag para verificar se o Supabase está configurado.
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    console.warn(
        "AVISO: Variáveis de ambiente do Supabase não definidas. " +
        "A aplicação funcionará com dados de exemplo (mock data). Para conectar ao backend, " +
        "configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
    );
}

// Cria um cliente com valores dummy se as variáveis não estiverem presentes para evitar que a aplicação quebre.
// A lógica da aplicação usará `isSupabaseConfigured` para decidir se usa este cliente ou os dados mock.
export const supabase = createClient(
    supabaseUrl || 'http://localhost:1',
    supabaseAnonKey || 'dummy-anon-key'
);
