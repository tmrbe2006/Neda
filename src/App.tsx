import React, { useEffect, useState } from 'react';
import { User, UserRole, Floor, CallRequest, CallStatus, CallType, LanguageCode } from './types';
import { translations } from './translations';
import LanguageSelector from './components/LanguageSelector';
import AudioAlerts from './components/AudioAlerts';
import WorkerDashboard from './components/WorkerDashboard';
import MonitorDashboard from './components/MonitorDashboard';
import EmergencyDashboard from './components/EmergencyDashboard';
import BigScreenView from './components/BigScreenView';
import OwnerDashboard from './components/OwnerDashboard';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Shield, LogOut, Tv, Flame, Bell, Volume2, UserCheck, Smartphone, Check } from 'lucide-react';

export default function App() {
  // Global App States
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<LanguageCode>('ar');
  const [building, setBuilding] = useState<Floor[]>([]);
  const [activeCalls, setActiveCalls] = useState<CallRequest[]>([]);
  const [callLogs, setCallLogs] = useState<CallRequest[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  // Login input states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sound triggering state
  const [playAlert, setPlayAlert] = useState(false);
  const [alertType, setAlertType] = useState<'emergency' | 'relief' | 'none'>('none');

  // Multi-view preview toggle for Owner/Admin testing convenience
  const [previewRole, setPreviewRole] = useState<UserRole | 'bigscreen' | null>(null);

  const activeTranslations = translations[language];
  const isRtl = language === 'ar' || language === 'ur';

  // Load initial settings
  useEffect(() => {
    // Sync direction
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('nidaa_session');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setPreviewRole(u.role);
      } catch (err) {
        localStorage.removeItem('nidaa_session');
      }
    }

    const storedLang = localStorage.getItem('nidaa_lang');
    if (storedLang) {
      setLanguage(storedLang as LanguageCode);
    }

    // Load building structure once
    fetch('/api/building')
      .then(res => res.json())
      .then(data => setBuilding(data))
      .catch(err => console.error('Error fetching building structure:', err));

    // Load users list once
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsersList(data))
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  // Request browser Notification permission
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Real-time synchronization stream via SSE
  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'INIT':
            setActiveCalls(data.activeCalls || []);
            setCallLogs(data.callLogs || []);
            break;

          case 'CALL_ADDED':
            setActiveCalls(prev => [...prev, data.call]);
            triggerWebNotification(data.call);
            // Trigger audio alert
            setAlertType(data.call.type === 'emergency' ? 'emergency' : 'relief');
            setPlayAlert(true);
            break;

          case 'CALL_ACCEPTED':
            setActiveCalls(prev => prev.map(c => c.id === data.call.id ? data.call : c));
            setPlayAlert(false);
            setAlertType('none');
            break;

          case 'CALL_RESOLVED':
            setActiveCalls(data.activeCalls || []);
            setCallLogs(data.callLogs || []);
            setPlayAlert(false);
            setAlertType('none');
            break;

          case 'BUILDING_UPDATED':
            setBuilding(data.building || []);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream lost connection. Attempting auto-reconnect...', err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Dispatch standard desktop warning push alert
  const triggerWebNotification = (call: CallRequest) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = call.type === CallType.EMERGENCY ? '🚨 طوارئ نداء عاجلة!' : '🔄 طلب بديل موظف';
      const body = `📍 الدور: ${call.floorName.split(' ')[0]} • غرفة: ${call.roomNumber}\nبواسطة الموظف: ${call.workerName}`;
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: call.id,
        requireInteraction: true
      });
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();
      if (result.success) {
        setUser(result.user);
        setPreviewRole(result.user.role);
        localStorage.setItem('nidaa_session', JSON.stringify(result.user));
        // Load users list immediately for administration
        fetch('/api/users')
          .then(res => res.json())
          .then(data => setUsersList(data))
          .catch(err => console.error('Error loading users list on login:', err));
      } else {
        setLoginError(activeTranslations.invalidCredentials);
      }
    } catch (err) {
      setLoginError('خطأ بالاتصال بالخادم. تأكد من تشغيل Node.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Login selector helper for the Reviewer/QA
  const handleQuickLogin = (uname: string) => {
    setUsername(uname);
    setPassword('any_password');
    // Programmatically trigger a small click simulation to speed up
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    setPreviewRole(null);
    localStorage.removeItem('nidaa_session');
  };

  // Save localized language preference
  const handleLangChange = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem('nidaa_lang', lang);
  };

  // API Call actions triggered from dashboards
  const handleSendCall = async (payload: any) => {
    const response = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  };

  const handleAcceptCall = async (callId: string) => {
    if (!user) return;
    const response = await fetch(`/api/calls/${callId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responderId: user.id, responderName: user.name })
    });
    return response.json();
  };

  const handleResolveCall = async (callId: string, notes?: string) => {
    const response = await fetch(`/api/calls/${callId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    return response.json();
  };

  const handleUpdateBuilding = async (newBuilding: Floor[]) => {
    const response = await fetch('/api/building', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBuilding)
    });
    return response.json();
  };

  const handleAddUser = async (userPayload: any) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload)
    });
    const result = await response.json();
    if (result.success) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setUsersList(data))
        .catch(err => console.error('Error refreshing users list:', err));
    }
    return result;
  };

  const handleUpdateUser = async (userId: string, payload: any) => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setUsersList(data))
        .catch(err => console.error('Error refreshing users list:', err));
    }
    return result;
  };

  const handleDeleteUser = async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (result.success) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setUsersList(data))
        .catch(err => console.error('Error refreshing users list:', err));
    }
    return result;
  };

  const handleGenerateAiReport = async () => {
    const response = await fetch('/api/ai/report', { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      return result.report;
    } else {
      throw new Error(result.error || 'Failed AI report');
    }
  };

  // Handle active call warnings to shut down audio
  const handleSilenceAlert = () => {
    setPlayAlert(false);
    setAlertType('none');
  };

  // SPLASH & LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-between p-6" id="splash-login-layout" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Top bar Language select */}
        <div className="flex justify-between items-center max-w-sm mx-auto w-full mb-4" id="login-top-bar">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs font-black text-neutral-400">نظام نداء للمساعدة</span>
          </div>
          <LanguageSelector currentLanguage={language} onLanguageChange={handleLangChange} />
        </div>

        {/* Brand visual Logo */}
        <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full" id="splash-logo-container">
          <div className="w-24 h-24 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-100 mb-6 relative animate-bounce">
            <div className="absolute inset-0 bg-blue-500 rounded-3xl animate-ping opacity-25" />
            <span className="text-3xl font-black tracking-widest">{activeTranslations.nidaa}</span>
          </div>

          <h1 className="text-xl font-black text-neutral-800 text-center mb-1">{activeTranslations.welcome}</h1>
          <p className="text-xs text-neutral-400 text-center mb-8 font-medium">نظام المساعدات الفورية وبلاغات الطوارئ لمركز التأهيل</p>

          {/* Login Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm w-full space-y-4" id="login-card">
            <form onSubmit={handleLogin} className="space-y-4" id="form-login-inputs">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase">{activeTranslations.username}</label>
                <input
                  id="input-username"
                  type="text"
                  required
                  placeholder="e.g. worker1, monitor1, owner"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase">{activeTranslations.password}</label>
                <input
                  id="input-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {loginError && (
                <div className="text-[11px] bg-rose-50 text-rose-600 p-2.5 rounded-lg border border-rose-100 font-semibold" id="login-error-alert">
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-100 cursor-pointer transition-all flex items-center justify-center"
                id="btn-login-submit"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  activeTranslations.login
                )}
              </button>
            </form>

            {/* Quick credentials testing helper */}
            <div className="border-t border-neutral-100 pt-4" id="qa-credentials-section">
              <span className="text-[9px] font-bold text-neutral-400 block mb-2 text-center uppercase">💡 تجربة سريعة بدون كتابة (Quick Account Selector)</span>
              
              <div className="grid grid-cols-2 gap-1.5" id="quick-pickers-grid">
                <button
                  onClick={() => handleQuickLogin('worker1')}
                  className="py-1.5 px-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[10px] font-bold text-neutral-700 cursor-pointer transition text-center"
                >
                  👷 عامل الدور 1
                </button>
                <button
                  onClick={() => handleQuickLogin('worker2')}
                  className="py-1.5 px-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[10px] font-bold text-neutral-700 cursor-pointer transition text-center"
                >
                  👷 عامل الدور 2
                </button>
                <button
                  onClick={() => handleQuickLogin('monitor1')}
                  className="py-1.5 px-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[10px] font-bold text-neutral-700 cursor-pointer transition text-center"
                >
                  🖥️ مراقب النداءات
                </button>
                <button
                  onClick={() => handleQuickLogin('emt1')}
                  className="py-1.5 px-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[10px] font-bold text-neutral-700 cursor-pointer transition text-center"
                >
                  🚑 فني الطوارئ
                </button>
              </div>

              <button
                onClick={() => handleQuickLogin('owner')}
                className="w-full mt-1.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-extrabold text-amber-900 cursor-pointer transition text-center"
              >
                👑 المالك (لوحة التحكم الشاملة والـ AI)
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-neutral-400 font-medium" id="login-footer">
          نداء - نظام الطوارئ الذكي المتكامل لعام 2026
        </div>
      </div>
    );
  }

  // BIG SCREEN VIEW (TV Screen mode renders complete fullscreen without standard app layout)
  if (previewRole === 'bigscreen') {
    return (
      <div id="big-screen-layout-shell">
        <BigScreenView activeCalls={activeCalls} translations={activeTranslations} />
        
        {/* Tiny sticky button to back to Normal preview */}
        <button
          onClick={() => setPreviewRole(user.role)}
          className="fixed bottom-4 right-4 z-50 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-xl text-xs font-bold border border-neutral-700 cursor-pointer transition-all flex items-center gap-1 shadow-lg"
          id="btn-tv-exit"
        >
          <Smartphone size={14} />
          <span>الخروج لشاشة الجوال</span>
        </button>
      </div>
    );
  }

  // STANDARD APPLICATION TEMPLATE (Renders header navbar and specific dashboard views)
  return (
    <div className="min-h-screen bg-neutral-50 pb-20 flex flex-col justify-between" id="app-authenticated-shell" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* PWA Install Prompt Bar */}
      <PWAInstallButton translations={activeTranslations} isRtl={isRtl} />
      
      {/* Sound synthesizer integration */}
      <AudioAlerts playPriorityAlert={playAlert} type={alertType} />

      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40" id="main-navigation-header">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex justify-between items-center" id="nav-content">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black tracking-widest text-sm shadow-md shadow-blue-100">
              {activeTranslations.nidaa}
            </div>
            <div>
              <span className="font-extrabold text-neutral-800 text-sm block tracking-tight">نظام نداء الميداني</span>
              <span className="text-[9px] text-neutral-400 font-medium block">إدارة طوارئ مركز التأهيل</span>
            </div>
          </div>

          {/* Interactive Utilities */}
          <div className="flex items-center gap-3" id="nav-utilities">
            
            {/* Quick TV view helper for Monitors/Admins */}
            {(user.role === UserRole.OWNER || user.role === UserRole.ADMIN || user.role === UserRole.MONITOR) && (
              <button
                onClick={() => setPreviewRole('bigscreen')}
                className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer"
                id="btn-trigger-tv-view"
                title="Open Big Screen TV"
              >
                <Tv size={16} />
              </button>
            )}

            {/* Language Selector */}
            <LanguageSelector currentLanguage={language} onLanguageChange={handleLangChange} />

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-rose-600 transition-all cursor-pointer"
              id="btn-nav-logout"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>

        {/* OWNER / ADMIN TESTING CONTROLS (Toggles views directly for demo/reviewing convenience) */}
        {(user.role === UserRole.OWNER || user.role === UserRole.ADMIN) && (
          <div className="bg-neutral-900 border-t border-neutral-800 text-white py-2 px-4 text-xs font-semibold flex flex-wrap items-center justify-between gap-2" id="demo-tester-strip">
            <div className="flex items-center gap-1 text-neutral-400">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
              <span>محاكي معاينة الصلاحيات (Role Sandbox Simulator):</span>
            </div>
            <div className="flex flex-wrap gap-1" id="sandbox-roles">
              <button
                onClick={() => setPreviewRole(UserRole.WORKER)}
                className={`px-2.5 py-1 rounded transition cursor-pointer text-[10px] ${
                  previewRole === UserRole.WORKER ? 'bg-blue-600 text-white font-extrabold' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                👷 {activeTranslations.worker}
              </button>
              <button
                onClick={() => setPreviewRole(UserRole.MONITOR)}
                className={`px-2.5 py-1 rounded transition cursor-pointer text-[10px] ${
                  previewRole === UserRole.MONITOR ? 'bg-violet-600 text-white font-extrabold' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                🖥️ {activeTranslations.monitor}
              </button>
              <button
                onClick={() => setPreviewRole(UserRole.EMERGENCY)}
                className={`px-2.5 py-1 rounded transition cursor-pointer text-[10px] ${
                  previewRole === UserRole.EMERGENCY ? 'bg-rose-600 text-white font-extrabold' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                🚑 {activeTranslations.emergencyTech}
              </button>
              <button
                onClick={() => setPreviewRole(UserRole.OWNER)}
                className={`px-2.5 py-1 rounded transition cursor-pointer text-[10px] ${
                  previewRole === UserRole.OWNER ? 'bg-amber-500 text-neutral-900 font-extrabold' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                👑 {activeTranslations.systemOwner}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* active siren visual warning banner inside standard dashboard if playing sound */}
      {playAlert && (
        <div className="bg-rose-600 text-white py-2 px-4 text-center text-xs font-black animate-pulse flex justify-between items-center max-w-6xl mx-auto w-full mt-4 rounded-xl" id="urgent-audio-warning-banner">
          <span className="flex items-center gap-1.5">
            <Flame size={15} />
            <span>يوجد نداء طوارئ نشط! صافرة الإنذار تعمل حالياً.</span>
          </span>
          <button
            onClick={handleSilenceAlert}
            className="bg-white text-rose-700 px-3 py-1 rounded-lg text-[10px] font-extrabold hover:bg-neutral-100 cursor-pointer"
            id="btn-silence-alert"
          >
            كتم صوت الصافرة
          </button>
        </div>
      )}

      {/* Main Body Router content */}
      <main className="flex-1" id="app-main-content-router">
        {/* Render respective dashboards */}
        {previewRole === UserRole.WORKER && (
          <WorkerDashboard
            user={user}
            building={building}
            activeCalls={activeCalls}
            translations={activeTranslations}
            isRtl={isRtl}
            onSendCall={handleSendCall}
          />
        )}

        {previewRole === UserRole.MONITOR && (
          <MonitorDashboard
            user={user}
            activeCalls={activeCalls}
            callLogs={callLogs}
            translations={activeTranslations}
            isRtl={isRtl}
            onAcceptCall={handleAcceptCall}
            onResolveCall={handleResolveCall}
          />
        )}

        {previewRole === UserRole.EMERGENCY && (
          <EmergencyDashboard
            user={user}
            activeCalls={activeCalls}
            translations={activeTranslations}
            onAcceptCall={handleAcceptCall}
            onResolveCall={handleResolveCall}
          />
        )}

        {previewRole === UserRole.OWNER && (
          <OwnerDashboard
            user={user}
            building={building}
            usersList={usersList}
            callLogs={callLogs}
            activeCalls={activeCalls}
            translations={activeTranslations}
            onUpdateBuilding={handleUpdateBuilding}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onGenerateAiReport={handleGenerateAiReport}
          />
        )}
      </main>

      {/* Floating Bottom Footer Indicator */}
      <footer className="text-center text-[10px] text-neutral-400 font-medium py-4 bg-white border-t border-neutral-200 mt-12" id="app-footer">
        نداء - تطبيق إدارة الطوارئ والمساعدات لعام 2026 • تصفح متوافق مع كافة الأجهزة اللوحية والمحمولة الشاشات الكبيرة
      </footer>

      {/* Global Offline Mode Toast Indicator */}
      <OfflineIndicator translations={activeTranslations} isRtl={isRtl} />

    </div>
  );
}
