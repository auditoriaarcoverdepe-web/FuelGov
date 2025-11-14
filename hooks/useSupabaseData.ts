
import { useMockData } from './useMockData';

/**
 * Hook de dados para a aplicação.
 * A integração com Supabase foi removida. Agora, este hook utiliza 
 * exclusivamente dados fictícios (mock data) de `useMockData`.
 * A interface do hook foi mantida para garantir compatibilidade com
 * os componentes que o consomem.
 */
export const useSupabaseData = () => {
    const mockData = useMockData();
    
    // Retorna os dados e funções do mock, com a propriedade 'loading' definida
    // como 'false' para manter a consistência da interface do hook.
    return { ...mockData, loading: false };
};
