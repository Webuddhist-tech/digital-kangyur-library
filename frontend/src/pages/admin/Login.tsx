import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Label } from '@/components/ui/atoms/label';
import { Card } from '@/components/ui/atoms/card';
import { LogIn, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

const Login = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { t, isTibetan } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success(t('loginSuccessful'));
      } else {
        if (!username || !email || !password) {
          toast.error(t('pleaseFillAllFields'));
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error(t('passwordMin6Chars'));
          setIsLoading(false);
          return;
        }
        await register(username, email, password);
        toast.success(t('accountCreatedSuccessfully'));
      }
      navigate('/admin');
    } catch (error) {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (mode === 'login') {
        errorMessage = t('loginFailed');
      } else {
        errorMessage = t('registrationFailed');
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isTibetan ? 'tibetan' : 'english'} bg-gradient-to-b from-kangyur-cream to-white flex items-center justify-center p-4`}>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-kangyur-orange/5 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-kangyur-green/5 blur-3xl"></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <img src="/logo.svg" alt="" className="w-[600px] h-[600px]" />
        </div>
      </div>

      <Card className="w-full max-w-md p-8 relative z-10 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.svg" alt="Kangyur Logo" className="w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold text-kangyur-maroon mb-2">
            {mode === 'login' ? t('adminLogin') : t('createAccount')}
          </h1>
          <p className="text-sm text-gray-600">
            {mode === 'login' ? t('signInToAccessAdminPanel') : t('createNewUserAccount')}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <Button
            type="button"
            variant={mode === 'login' ? 'default' : 'ghost'}
            onClick={() => {
              setMode('login');
              setUsername('');
              setEmail('');
              setPassword('');
            }}
            className="flex-1"
            disabled={isLoading}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {t('login')}
          </Button>
          <Button
            type="button"
            variant={mode === 'register' ? 'default' : 'ghost'}
            onClick={() => {
              setMode('register');
              setUsername('');
              setEmail('');
              setPassword('');
            }}
            className="flex-1"
            disabled={isLoading}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {t('createUser')}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="username">{t('username')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('enterUsername')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={mode === 'register'}
                disabled={isLoading}
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={mode === 'login' ? t('adminEmailPlaceholder') : t('userEmailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={mode === 'login' ? t('enterYourPassword') : t('enterPasswordMin6Chars')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
              minLength={mode === 'register' ? 6 : undefined}
            />
            {mode === 'register' && (
              <p className="text-xs text-gray-500">{t('passwordMin6Chars')}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-kangyur-orange hover:bg-kangyur-orange/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'login' ? t('signingIn') : t('creatingAccount')}
              </>
            ) : (
              <>
                {mode === 'login' ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('signIn')}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('createAccount')}
                  </>
                )}
              </>
            )}
          </Button>
        </form>

        {mode === 'login' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              {t('defaultCredentials')}
            </p>
          </div>
        )}

      
      </Card>
    </div>
  );
};

export default Login;
