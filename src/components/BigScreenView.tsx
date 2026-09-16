import React, { useEffect, useState } from 'react';
import { CallRequest, CallStatus, CallType, TranslationSet } from '../types';
import { ShieldAlert, RefreshCw, Volume2, Maximize2, Clock, MapPin, Bed, Tv } from 'lucide-react';

interface BigScreenViewProps {
  activeCalls: CallRequest[];
  translations: TranslationSet;
}

export default function BigScreenView({ activeCalls, translations }: BigScreenViewProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingEmergencies = activeCalls.filter(c => c.type === CallType.EMERGENCY && c.status === CallStatus.PENDING);
  const pendingReliefs = activeCalls.filter(c => c.type === CallType.RELIEF && c.status === CallStatus.PENDING);
  const acceptedCalls = activeCalls.filter(c => c.status === CallStatus.ACCEPTED);

  // Toggle fullscreen mode
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const hasUrgentEmergency = pendingEmergencies.length > 0;

  return (
    <div 
      className={`min-h-screen bg-neutral-950 text-white font-sans p-6 flex flex-col justify-between transition-colors duration-500 ${
        hasUrgentEmergency ? 'animate-emergency-red' : ''
      }`} 
      id="big-screen-view"
    >
      {/* Top TV Screen Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-2xl mb-6 shadow-xl" id="tv-header">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
            hasUrgentEmergency ? 'bg-rose-600 animate-pulse' : 'bg-neutral-800'
          }`}>
            <Tv size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase flex items-center gap-2">
              <span>{translations.bigScreen}</span>
              <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded border border-neutral-700">شاشات العرض الكبيرة</span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-medium">عرض فوري مكبر لبلاغات الموظفين الميدانيين</p>
          </div>
        </div>

        {/* Live TV Indicators */}
        <div className="flex items-center gap-4 mt-3 sm:mt-0" id="tv-controls">
          {/* Large Clock */}
          <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-blue-400 bg-neutral-950 px-3 py-1 rounded-lg border border-neutral-800">
            <Clock size={16} />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
            id="btn-tv-fullscreen"
            title="Toggle Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Areas split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 mb-6" id="tv-layout-grid">
        
        {/* Column 1: PENDING EMERGENCIES (HIGH PRIORITY) - 2cols on lg if large */}
        <div className="lg:col-span-2 bg-neutral-900 rounded-2xl border border-neutral-800 p-5 flex flex-col justify-between" id="tv-emergencies-panel">
          <div>
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
              <h2 className="text-base font-extrabold text-rose-500 flex items-center gap-2">
                <ShieldAlert className="animate-pulse" size={20} />
                <span>حالات الطوارئ المفتوحة والنشطة ({pendingEmergencies.length})</span>
              </h2>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold">عاجل جداً (Critical)</span>
            </div>

            {pendingEmergencies.length === 0 ? (
              <div className="py-20 text-center text-neutral-500 flex flex-col items-center justify-center h-full">
                <span className="text-5xl mb-3">🟢</span>
                <h3 className="text-xl font-bold text-neutral-300">لا توجد حالات طوارئ معلقة</h3>
                <p className="text-xs text-neutral-500 mt-1">المركز آمن ومستقر طبيّاً حالياً</p>
              </div>
            ) : (
              <div className="space-y-4" id="tv-emergencies-list">
                {pendingEmergencies.map((call) => (
                  <div
                    key={call.id}
                    className="bg-rose-950/40 border-2 border-rose-600 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg shadow-rose-950/20 animate-pulse"
                    id={`tv-call-item-${call.id}`}
                  >
                    <div>
                      {/* Big Location Display */}
                      <div className="text-3xl font-black text-white tracking-tight">
                        الدور {call.floorName.split(' ')[0]} • الغرفة {call.roomNumber}
                        {call.bedNumber && ` • السرير ${call.bedNumber}`}
                      </div>
                      <div className="text-sm font-semibold text-rose-400 mt-1.5 flex items-center gap-2">
                        <span>🏢 {call.wingName.split(' (')[0]}</span>
                        <span>•</span>
                        <span>👤 العامل: {call.workerName}</span>
                      </div>
                    </div>

                    {/* Elapsed Time Call */}
                    <div className="text-center md:text-right shrink-0">
                      <span className="text-[10px] text-rose-300 uppercase block font-bold">منذ (Elapsed)</span>
                      <span className="text-2xl font-mono font-black text-white block bg-rose-900/60 px-4 py-1.5 rounded-xl border border-rose-700">
                        {Math.round((Date.now() - new Date(call.createdAt).getTime()) / 1000)} ثانية
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer of the panel */}
          <div className="text-xs text-neutral-500 border-t border-neutral-800 pt-3 flex justify-between">
            <span>تنبيه: يترافق عرض البلاغ مع إشارة صوتية مستمرة</span>
            <span>نظام نداء © {new Date().getFullYear()}</span>
          </div>
        </div>

        {/* Column 2: RELIEF REQUESTS & ACCEPTED CASES */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 flex flex-col justify-between" id="tv-reliefs-panel">
          <div>
            {/* Shift Relief Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
                <h2 className="text-sm font-extrabold text-amber-500 flex items-center gap-2">
                  <RefreshCw size={16} />
                  <span>طلبات البديل المعلقة ({pendingReliefs.length})</span>
                </h2>
              </div>

              {pendingReliefs.length === 0 ? (
                <div className="text-center py-6 text-neutral-600 text-xs font-semibold">
                  لا توجد طلبات تغطية مناوبات معلقة
                </div>
              ) : (
                <div className="space-y-3" id="tv-reliefs-list">
                  {pendingReliefs.map((call) => (
                    <div key={call.id} className="bg-neutral-950 border border-amber-500/40 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-sm font-black text-neutral-200">غرفة {call.roomNumber} ({call.floorName.split(' ')[0]})</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{call.workerName}</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        طلب بديل
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* In-Response / Accepted Section */}
            <div>
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
                <h2 className="text-sm font-extrabold text-emerald-500 flex items-center gap-2">
                  <span>حالات تحت الاستجابة حالياً ({acceptedCalls.length})</span>
                </h2>
              </div>

              {acceptedCalls.length === 0 ? (
                <div className="text-center py-6 text-neutral-600 text-xs font-semibold">
                  لا توجد حالات تحت المتابعة حالياً
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in" id="tv-accepted-list">
                  {acceptedCalls.map((call) => (
                    <div key={call.id} className="bg-neutral-950 border border-emerald-500/20 p-3 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-neutral-200">غرفة {call.roomNumber} ({call.floorName.split(' ')[0]})</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">تم القبول</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 flex justify-between">
                        <span><b>طالب النداء:</b> {call.workerName}</span>
                        <span><b>المستجيب:</b> {call.responderName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Guide visual */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-neutral-400 text-[10px] leading-relaxed flex items-center gap-2 mt-4" id="tv-guide-chime">
            <Volume2 className="text-blue-400 shrink-0" size={16} />
            <span>يتم بث نغمة صوتية مخصصة ومصنفة تلقائياً لكل نوع من البلاغات عبر سماعات المركز.</span>
          </div>
        </div>

      </div>

      {/* Safety Bottom Banner Alert */}
      {hasUrgentEmergency && (
        <div className="bg-rose-600 text-white p-3 rounded-xl text-center text-sm font-black animate-pulse" id="tv-crit-alert-footer">
          ⚠️ تنبيه أمني وطبي: يوجد حالات طوارئ عاجلة معلقة دون استجابة! يرجى توجه فني الطوارئ فوراً لموقع البلاغ.
        </div>
      )}

    </div>
  );
}
