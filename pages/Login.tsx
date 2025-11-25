import React, { useState, useEffect } from 'react';
import { mockBackend } from '../services/mockBackend';
import { UserRole } from '../types';
import { CheckCircle, AlertCircle, Eye, EyeOff, Lock, ArrowLeft, Check, Circle } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface LoginProps {
  onLogin: (user: any) => void;
}

type ViewState = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [viewState, setViewState] = useState<ViewState>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.VOTER);
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { speakText } = useAccessibility();

  const [pwdReqs, setPwdReqs] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  useEffect(() => {
    setPwdReqs({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*._-]/.test(password)
    });
  }, [password]);

  const isStrongPassword = () => {
    return Object.values(pwdReqs).every(Boolean);
  };

  const clearForm = () => {
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSwitchView = (view: ViewState) => {
    setViewState(view);
    clearForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (viewState === 'LOGIN') {
        const user = await mockBackend.login(email, password);
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid email or password.');
          speakText('Invalid email or password.');
        }
      } else if (viewState === 'REGISTER') {
        if (!isStrongPassword()) {
          throw new Error('Please ensure your password meets all strength requirements.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        await mockBackend.register(name, email, role, password);
        setSuccess('Registration successful! Please login.');
        speakText('Registration successful. Please login.');
        handleSwitchView('LOGIN');
      } else if (viewState === 'FORGOT_PASSWORD') {
        if (!isStrongPassword()) {
          throw new Error('Please ensure your new password meets all strength requirements.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        await mockBackend.resetPassword(email, password);
        setSuccess('Password reset successfully. You can now login.');
        speakText('Password reset successfully.');
        handleSwitchView('LOGIN');
      }
    } catch (err: any) {
      setError(err.message);
      speakText(err.message);
    } finally {
      setLoading(false);
    }
  };

  const RequirementItem = ({ met, label }: { met: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${met ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
      {met ? <Check size={12} className="stroke-2" /> : <Circle size={12} className="stroke-2" />}
      <span>{label}</span>
    </div>
  );

  const renderPasswordInput = (
    label: string, 
    value: string, 
    setValue: (val: string) => void, 
    id: string
  ) => (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none pr-10 transition-all ${
            error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-brand-500'
          }`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      
      {/* Password Strength Meter - Only show for main password field in Register/Reset modes */}
      {viewState !== 'LOGIN' && id === 'password' && (
        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <RequirementItem met={pwdReqs.length} label="At least 8 characters" />
          <RequirementItem met={pwdReqs.upper} label="Uppercase letter (A-Z)" />
          <RequirementItem met={pwdReqs.lower} label="Lowercase letter (a-z)" />
          <RequirementItem met={pwdReqs.number} label="Number (0-9)" />
          <RequirementItem met={pwdReqs.special} label="Special char (!@#...)" />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8 border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Lock className="text-brand-600" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-brand-900" tabIndex={0}>
            {viewState === 'LOGIN' && 'Welcome Back'}
            {viewState === 'REGISTER' && 'Create Account'}
            {viewState === 'FORGOT_PASSWORD' && 'Reset Password'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {viewState === 'LOGIN' && 'Sign in to access your voting dashboard'}
            {viewState === 'REGISTER' && 'Register securely to participate'}
            {viewState === 'FORGOT_PASSWORD' && 'Create a new strong password'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex items-center gap-2 text-sm animate-pulse" role="alert">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 flex items-center gap-2 text-sm" role="alert">
            <CheckCircle size={20} className="shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Registration Fields */}
          {viewState === 'REGISTER' && (
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
          )}

          {/* Email Field (Always visible) */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          {/* Password Fields */}
          {renderPasswordInput(
            viewState === 'FORGOT_PASSWORD' ? "New Password" : "Password", 
            password, 
            setPassword, 
            "password"
          )}

          {(viewState === 'REGISTER' || viewState === 'FORGOT_PASSWORD') && renderPasswordInput(
            "Confirm Password", 
            confirmPassword, 
            setConfirmPassword, 
            "confirmPassword"
          )}

          {/* Role Selection (Register only) */}
          {viewState === 'REGISTER' && (
            <div>
              <label className="block text-sm font-medium mb-1">I am a:</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 flex-1">
                  <input
                    type="radio"
                    name="role"
                    value={UserRole.VOTER}
                    checked={role === UserRole.VOTER}
                    onChange={() => setRole(UserRole.VOTER)}
                    className="accent-brand-600"
                  />
                  Voter
                </label>
                <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 flex-1">
                  <input
                    type="radio"
                    name="role"
                    value={UserRole.ADMIN}
                    checked={role === UserRole.ADMIN}
                    onChange={() => setRole(UserRole.ADMIN)}
                    className="accent-brand-600"
                  />
                  Official
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (
              viewState === 'LOGIN' ? 'Login' : 
              viewState === 'REGISTER' ? 'Create Account' : 
              'Reset Password'
            )}
          </button>
        </form>

        {/* Navigation Links */}
        <div className="mt-6 text-center space-y-2">
          {viewState === 'LOGIN' && (
            <>
              <button
                onClick={() => handleSwitchView('FORGOT_PASSWORD')}
                className="block w-full text-sm text-gray-500 hover:text-brand-600 hover:underline"
              >
                Forgot Password?
              </button>
              <div className="pt-2 border-t mt-4">
                 <span className="text-gray-500 text-sm">Don't have an account? </span>
                 <button
                    onClick={() => handleSwitchView('REGISTER')}
                    className="text-brand-600 hover:underline font-medium ml-1"
                  >
                    Register
                  </button>
              </div>
            </>
          )}

          {(viewState === 'REGISTER' || viewState === 'FORGOT_PASSWORD') && (
            <button
              onClick={() => handleSwitchView('LOGIN')}
              className="text-brand-600 hover:underline font-medium flex items-center justify-center gap-2 w-full"
            >
              <ArrowLeft size={16} /> Back to Login
            </button>
          )}
        </div>
      </div>
      
      {/* Helper info for demo */}
      {viewState === 'LOGIN' && (
        <p className="mt-4 text-xs text-gray-400">
          Demo Admin: admin@vote.com / Admin@1234
        </p>
      )}
    </div>
  );
};