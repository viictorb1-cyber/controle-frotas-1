import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthActions, useAuthState } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Truck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { signIn, loading, error, clearError } = useAuthActions();
  const { isSupabaseEnabled } = useAuthState();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await signIn(email, password);
      setLocation('/');
    } catch {
      // Erro já tratado no hook
    }
  };

  if (!isSupabaseEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Autenticação não configurada</CardTitle>
            <CardDescription className="text-slate-400">
              O Supabase não está configurado. Configure as variáveis de ambiente para habilitar autenticação.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={() => setLocation('/')}
            >
              Continuar sem autenticação
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Controle de Frotas</CardTitle>
          <CardDescription className="text-slate-400">
            {showForgotPassword 
              ? 'Digite seu email para recuperar a senha'
              : 'Entre com suas credenciais para acessar o sistema'
            }
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            {!showForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {showForgotPassword ? 'Enviando...' : 'Entrando...'}
                </>
              ) : (
                showForgotPassword ? 'Enviar email de recuperação' : 'Entrar'
              )}
            </Button>

            <div className="flex flex-col space-y-2 text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(!showForgotPassword);
                  clearError();
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showForgotPassword ? 'Voltar ao login' : 'Esqueceu a senha?'}
              </button>

              {!showForgotPassword && (
                <span className="text-slate-400">
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setLocation('/register')}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Cadastre-se
                  </button>
                </span>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

