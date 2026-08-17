import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';
import { getUsers, updateRawUserPin } from '../../data/index';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { COMPANY_CONFIG } from '../../config/company';

export const LoginView: React.FC = () => {
  const { login, resetPin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Completely disable window/body scrollbar while on the login page
  useEffect(() => {
    document.documentElement.classList.add('login-active');
    document.body.classList.add('login-active');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.classList.remove('login-active');
      document.body.classList.remove('login-active');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // Mode: 'login' or 'forgot_step_1' or 'forgot_step_2' or 'forgot_step_3' or 'force_reset_pin'
  const [mode, setMode] = useState<'login' | 'forgot_step_1' | 'forgot_step_2' | 'forgot_step_3' | 'force_reset_pin'>('login');
  
  // Login Form States
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Forgot / Force Password States
  const [forgotUser, setForgotUser] = useState<any>(null);
  const [contactInput, setContactInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!username || !pin) {
      setLoginError('Username and PIN are required');
      return;
    }

    const users = getUsers();
    const found = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.pin === pin);
    if (found) {
      if (found.active === false) {
        setLoginError(t('login.invalid_credentials'));
        return;
      }
      if (found.needsPinReset) {
        setForgotUser(found);
        setNewPin('');
        setResetError('');
        setMode('force_reset_pin');
      } else {
        const success = await login(username, pin);
        if (success) {
          navigate('/');
        } else {
          setLoginError(t('login.invalid_credentials'));
        }
      }
    } else {
      setLoginError(t('login.invalid_credentials'));
    }
  };

  const handleForceResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!newPin.trim()) {
      setResetError('New PIN is required');
      return;
    }

    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setResetError('PIN must be exactly 4 digits');
      return;
    }

    if (newPin === pin) {
      setResetError('New PIN cannot be the same as the current temporary PIN.');
      return;
    }

    const success = updateRawUserPin(forgotUser.username, newPin);
    if (success) {
      const loggedIn = await login(forgotUser.username, newPin);
      if (loggedIn) {
        navigate('/');
      } else {
        setResetError('Error logging in. Please try again.');
      }
    } else {
      setResetError('Error updating PIN');
    }
  };

  const handleForgotStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    if (!contactInput.trim()) {
      setResetError('Email or registered mobile number is required');
      return;
    }
    
    const users = getUsers();
    const found = users.find(u => 
      (u.email && u.email.toLowerCase() === contactInput.trim().toLowerCase()) ||
      (u.phone && u.phone.replace(/\s+/g, '') === contactInput.trim().replace(/\s+/g, ''))
    );
    
    if (found) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(otp);
      setForgotUser(found);
      setOtpInput('');
      setNewPin('');
      setMode('forgot_step_2');
    } else {
      setResetError('No account found with this email or phone number.');
    }
  };

  const handleOtpVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    if (otpInput.trim() !== generatedOtp) {
      setResetError('Invalid 6-digit OTP code. Please try again.');
      return;
    }
    
    setResetError('');
    setMode('forgot_step_3');
  };

  const handleNewPinSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    if (!newPin.trim()) {
      setResetError('New PIN is required');
      return;
    }
    
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setResetError('PIN must be exactly 4 digits');
      return;
    }
    
    const success = await resetPin(forgotUser.username, newPin);
    if (success) {
      navigate('/');
    } else {
      setResetError('Failed to reset PIN. Please try again.');
    }
  };

  return (
    <div className="login-page-container no-scrollbar fixed inset-0 min-h-screen min-h-[100dvh] w-full bg-[#0066FF] flex items-center justify-center p-3 sm:p-5 md:p-8 relative font-sans z-50 overflow-y-auto">
      
      {/* Background Decorative Circles */}
      <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-sm pointer-events-none" />
      <div className="absolute top-1/4 right-8 w-16 h-16 rounded-full bg-white/15 blur-xs pointer-events-none" />
      <div className="absolute bottom-12 left-10 w-24 h-24 rounded-full bg-white/15 blur-xs pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-sky-300/20 blur-md pointer-events-none" />
      
      {/* Main Floating White Card - Dynamic responsive scaling across screen resolutions */}
      <div className="w-full max-w-[340px] sm:max-w-[370px] md:max-w-[410px] lg:max-w-[430px] bg-white rounded-[24px] sm:rounded-[28px] md:rounded-[32px] shadow-2xl p-4 sm:p-6 md:p-7 relative z-10 my-auto transition-all duration-300">
        
        {/* Title & Subtitle with Official Logo */}
        <div className="flex items-center justify-between mb-3.5 sm:mb-4 md:mb-5 border-b border-slate-100 pb-2.5 sm:pb-3 md:pb-4">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[#1E293B] tracking-tight">
              {COMPANY_CONFIG.name}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-bold tracking-wide mt-0.5">
              Paper Mill Management System
            </p>
          </div>
          <img src="/logo.png" alt={`${COMPANY_CONFIG.shortName} Logo`} className="h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 object-contain rounded-xl shadow-xs border border-slate-200/80 bg-white p-0.5 shrink-0" />
        </div>

        {/* 1. Login Mode */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-2.5 sm:space-y-3 md:space-y-4">
            {loginError && (
              <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                {loginError}
              </div>
            )}

            {/* Username Pill Input */}
            <div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-white border-2 border-[#2563EB]/80 focus:border-[#0066FF] rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition"
                placeholder="Username"
                autoComplete="username"
              />
            </div>

            {/* Password / PIN Pill Input */}
            <div>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  maxLength={4}
                  className="w-full px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-white border-2 border-[#2563EB]/80 focus:border-[#0066FF] rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 tracking-wider transition pr-10 md:pr-12"
                  placeholder="Password"
                  inputMode="numeric"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Forgot Password Link Right Aligned */}
              <div className="text-right mt-1.5">
                <button
                  type="button"
                  onClick={() => setMode('forgot_step_1')}
                  className="text-[11px] sm:text-xs text-[#2563EB] hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Pill Login Button */}
            <div className="pt-1.5">
              <button
                type="submit"
                className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-full shadow-md shadow-blue-500/25 transition duration-200 text-xs sm:text-sm tracking-wide cursor-pointer"
              >
                Login
              </button>
            </div>

            {/* Quick Demo Credentials - Dynamic Responsive Grid */}
            <div className="pt-3.5 sm:pt-4 border-t border-slate-100">
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 text-center mb-2">
                Quick Demo Access
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const success = await login('admin', '1234');
                    if (success) navigate('/');
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-gradient-to-br from-red-50 to-red-100/50 hover:from-red-100 hover:to-red-200/50 border border-red-200/80 rounded-xl transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex-shrink-0 w-6.5 h-6.5 sm:w-7 sm:h-7 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs group-hover:scale-105 transition-transform">
                    👑
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-red-700 truncate">Admin</p>
                    <p className="text-[9px] text-red-600/70 font-medium">PIN: 1234</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const success = await login('plant_manager', '1111');
                    if (success) navigate('/');
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 border border-blue-200/80 rounded-xl transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex-shrink-0 w-6.5 h-6.5 sm:w-7 sm:h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs group-hover:scale-105 transition-transform">
                    🏭
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-blue-700 truncate">Plant Mgr</p>
                    <p className="text-[9px] text-blue-600/70 font-medium">PIN: 1111</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const success = await login('lab_operator', '1234');
                    if (success) navigate('/');
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 border border-purple-200/80 rounded-xl transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex-shrink-0 w-6.5 h-6.5 sm:w-7 sm:h-7 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs group-hover:scale-105 transition-transform">
                    🔬
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-purple-700 truncate">Pulper</p>
                    <p className="text-[9px] text-purple-600/70 font-medium">PIN: 1234</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const success = await login('shopper', '1234');
                    if (success) navigate('/');
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 border border-emerald-200/80 rounded-xl transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex-shrink-0 w-6.5 h-6.5 sm:w-7 sm:h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs group-hover:scale-105 transition-transform">
                    🛒
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-emerald-700 truncate">Shopper</p>
                    <p className="text-[9px] text-emerald-600/70 font-medium">PIN: 1234</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const success = await login('dispatcher', '1234');
                    if (success) navigate('/');
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-gradient-to-br from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200/50 border border-amber-200/80 rounded-xl transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex-shrink-0 w-6.5 h-6.5 sm:w-7 sm:h-7 bg-amber-500 rounded-lg flex items-center justify-center text-white text-xs group-hover:scale-105 transition-transform">
                    🚚
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-amber-700 truncate">Dispatcher</p>
                    <p className="text-[9px] text-amber-600/70 font-medium">PIN: 1234</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const success = await login('viewer', '1234');
                    if (success) navigate('/');
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-200/50 border border-slate-200/80 rounded-xl transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex-shrink-0 w-6.5 h-6.5 sm:w-7 sm:h-7 bg-slate-500 rounded-lg flex items-center justify-center text-white text-xs group-hover:scale-105 transition-transform">
                    👁️
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-700 truncate">Viewer</p>
                    <p className="text-[9px] text-slate-600/70 font-medium">PIN: 1234</p>
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 2. Forgot Password Step 1 */}
        {mode === 'forgot_step_1' && (
          <form onSubmit={handleForgotStep1Submit} className="space-y-4">
            <div className="text-left space-y-1 mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Reset Password Request
              </h3>
              <p className="text-xs text-slate-500">
                Enter your registered email or mobile number to receive an OTP code.
              </p>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                {resetError}
              </div>
            )}

            <div>
              <input
                type="text"
                value={contactInput}
                onChange={e => {
                  const val = e.target.value;
                  // If user is typing numeric phone number, cap at 10 digits
                  if (/^\d+$/.test(val)) {
                    setContactInput(val.slice(0, 10));
                  } else {
                    setContactInput(val);
                  }
                }}
                maxLength={50}
                className="w-full px-6 py-3.5 bg-white border-2 border-[#2563EB]/80 focus:border-[#0066FF] rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition"
                placeholder="Email or Mobile Number (10 Digits)"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetError('');
                  setContactInput('');
                }}
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold py-3 px-4 rounded-full text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full text-xs shadow-md transition"
              >
                Send OTP
              </button>
            </div>
          </form>
        )}

        {/* 3. Forgot Password Step 2: OTP Verification Input */}
        {mode === 'forgot_step_2' && forgotUser && (
          <form onSubmit={handleOtpVerifySubmit} className="space-y-4">
            <div className="text-left space-y-1 mb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Verify OTP
              </h3>
              <p className="text-xs text-slate-500">
                Enter the 6-digit verification code sent to your contact details.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs text-left leading-relaxed">
              🔑 **SIMULATION OTP CODE**: <span className="font-mono font-bold tracking-widest bg-white px-2 py-0.5 rounded shadow-xs">{generatedOtp}</span>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                {resetError}
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={e => setOtpInput(e.target.value)}
                className="w-full px-6 py-3.5 bg-white border-2 border-[#2563EB]/80 text-center tracking-widest font-mono font-bold text-slate-800 focus:outline-none rounded-full text-base"
                placeholder="000000"
                inputMode="numeric"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot_step_1');
                  setResetError('');
                  setOtpInput('');
                }}
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold py-3 px-4 rounded-full text-xs transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full text-xs shadow-md transition"
              >
                Verify Code
              </button>
            </div>
          </form>
        )}

        {/* 4. Forgot Password Step 3: Set New PIN */}
        {mode === 'forgot_step_3' && forgotUser && (
          <form onSubmit={handleNewPinSaveSubmit} className="space-y-4">
            <div className="text-left space-y-1 mb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Set New Password
              </h3>
              <p className="text-xs text-slate-500">
                OTP verified for <span className="font-bold">@{forgotUser.username}</span>. Enter your new 4-digit PIN below.
              </p>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                {resetError}
              </div>
            )}

            <div>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                className="w-full px-6 py-3.5 bg-white border-2 border-[#2563EB]/80 tracking-widest text-center text-slate-800 focus:outline-none rounded-full text-base"
                placeholder="••••"
                inputMode="numeric"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-full shadow-lg text-xs tracking-wide transition"
            >
              Reset Password & Log In
            </button>
          </form>
        )}

        {/* 5. Force Reset PIN Mode */}
        {mode === 'force_reset_pin' && forgotUser && (
          <form onSubmit={handleForceResetSubmit} className="space-y-4">
            <div className="text-center space-y-1 mb-2">
              <ShieldAlert className="h-9 w-9 text-amber-500 mx-auto mb-1 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-800">
                Password Change Required
              </h3>
              <p className="text-xs text-slate-500">
                Your PIN was reset by an admin. Please set your new personal 4-digit PIN.
              </p>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                {resetError}
              </div>
            )}

            <div>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                className="w-full px-6 py-3.5 bg-white border-2 border-[#2563EB]/80 tracking-widest text-center text-slate-800 focus:outline-none rounded-full text-base"
                placeholder="••••"
                inputMode="numeric"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetError('');
                  setForgotUser(null);
                  setNewPin('');
                }}
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold py-3 px-4 rounded-full text-xs transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full text-xs shadow-md transition"
              >
                Save & Enter
              </button>
            </div>
          </form>
        )}

        {/* Company Verified Contact & Address Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center space-y-1">
          <p className="text-[10px] text-slate-500 font-medium leading-tight">
            {COMPANY_CONFIG.shortAddress}
          </p>
          <div className="flex items-center justify-center gap-2.5 text-[10px] text-slate-500 font-semibold">
            <span>Ph: {COMPANY_CONFIG.phone}</span>
            <span>•</span>
            <a href={COMPANY_CONFIG.websiteUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">
              {COMPANY_CONFIG.website}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginView;
