import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuthStore();

  const token = searchParams.get('token');
  const refreshToken = searchParams.get('refreshToken');
  const error = searchParams.get('error');

  useEffect(() => {
    const processAuth = async () => {
      if (error) {
        console.error('OAuth error:', error);
        navigate('/login');
        return;
      }

      if (token && refreshToken) {
        try {
          await handleGoogleCallback(token, refreshToken);
          // Redirect will be handled in the store
        } catch (err) {
          console.error('OAuth callback error:', err);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    processAuth();
  }, [token, refreshToken, error, navigate, handleGoogleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
