import { createClient } from '@supabase/supabase-js';

// --- Configuração do Supabase ---
// As credenciais do Supabase são carregadas a partir de variáveis de ambiente.
// Isso é mais seguro e flexível do que colocar as chaves diretamente no código.

// Para desenvolvimento local:
// Preencha o arquivo `.env.local` na raiz do projeto com suas credenciais.

// Para produção (ex: Vercel, Netlify):
// Configure as mesmas variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
// no painel de configurações do seu provedor de hospedagem.

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Exporta uma flag para verificar se o Supabase está configurado.
// A verificação `includes('seu-projeto')` previne o uso das chaves de exemplo.
export const isSupabaseConfigured = 
    !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('seu-projeto'));

if (!isSupabaseConfigured) {
    console.warn(
        "AVISO: Credenciais do Supabase não configuradas ou são de exemplo. " +
        "A aplicação utilizará dados de exemplo (mock data). " +
        "Para conectar ao seu backend, configure o arquivo `.env.local` ou as " +
        "variáveis de ambiente no seu serviço de hospedagem."
    );
}

// Cria um cliente Supabase. Se as credenciais não estiverem disponíveis,
// ele usa valores temporários para evitar que a aplicação quebre, e a flag `isSupabaseConfigured`
// garantirá que os dados de exemplo sejam usados.
export const supabase = createClient(
    supabaseUrl || 'http://localhost:1',
    supabaseAnonKey || 'dummy-anon-key'
);
