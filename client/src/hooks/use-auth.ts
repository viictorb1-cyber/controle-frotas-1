import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { 
  supabase, 
  isSupabaseConfigured,
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  resetPassword as supabaseResetPassword,
} from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSupabaseEnabled: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    isSupabaseEnabled: isSupabaseConfigured(),
  });

  useEffect(() => {
    if (!supabase) {
      // Se Supabase não está configurado, considera como "autenticado" para permitir uso
      setState(prev => ({
        ...prev,
        loading: false,
        isAuthenticated: true, // Permite acesso sem autenticação
      }));
      return;
    }

    // Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
        isAuthenticated: !!session,
      }));
    });

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
          isAuthenticated: !!session,
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await supabaseSignIn(email, password);
    } catch (err: any) {
      const message = err?.message || 'Erro ao fazer login';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    setError(null);
    try {
      await supabaseSignUp(email, password, fullName);
    } catch (err: any) {
      const message = err?.message || 'Erro ao criar conta';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await supabaseSignOut();
    } catch (err: any) {
      const message = err?.message || 'Erro ao sair';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await supabaseResetPassword(email);
    } catch (err: any) {
      const message = err?.message || 'Erro ao enviar email de recuperação';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    loading,
    error,
    clearError: () => setError(null),
  };
}

// Provider component para envolver a aplicação
export { AuthContext };

export function createAuthContextValue(): AuthContextType {
  const state = useAuthState();
  const actions = useAuthActions();

  return {
    ...state,
    signIn: actions.signIn,
    signUp: actions.signUp,
    signOut: actions.signOut,
    resetPassword: actions.resetPassword,
  };
}

