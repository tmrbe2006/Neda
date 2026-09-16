import React, { useState } from 'react';
import { CallRequest, CallStatus, CallType, TranslationSet, User } from '../types';
import { Shield, AlertCircle, RefreshCw, CheckCircle2, Clock, UserCheck, Eye, Search, Filter, MessageSquare, AlertTriangle } from 'lucide-react';

interface MonitorDashboardProps {
  user: User;
  activeCalls: CallRequest[];
  callLogs: CallRequest[];
  translations: TranslationSet;
  isRtl: boolean;
  onAcceptCall: (callId: string) => Promise<any>;
  onResolveCall: (callId: string, notes?: string) => Promise<any>;
}

export default function MonitorDashboard({
  user,
  activeCalls,
  callLogs,
  translations,
  isRtl,
  onAcceptCall,
  onResolveCall
}: MonitorDashboardProps) {
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [resolvingCallId, setResolvingCallId] = useState<string | null>(null);
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Calculate metrics
  const pendingCalls = activeCalls.filter(c => c.status === CallStatus.PENDING);
  const acceptedCalls = activeCalls.filter(c => c.status === CallStatus.ACCEPTED);
  const resolvedCalls = callLogs.filter(c => c.status === CallStatus.RESOLVED);

  const avgResponseTime = resolvedCalls.length > 0 
    ? Math.round(resolvedCalls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / resolvedCalls.length)
    : 0;

  // Filter requests
  const filteredActive = activeCalls.filter(call => {
    const floorMatch = filterFloor === 'all' || call.floorId === filterFloor;
    const typeMatch = filterType === 'all' || call.type === filterType;
    return floorMatch && typeMatch;
  });

  const handleOpenResolveDialog = (callId: string) => {
    setResolvingCallId(callId);
    setClosingNotes('');
  };

  const handleConfirmResolve = async () => {
    if (!resolvingCallId) return;
    try {
      await onResolveCall(resolvingCallId, closingNotes);
      setResolvingCallId(null);
      setClosingNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" id="monitor-dashboard-view">
      
      {/* Header Info */}
      <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="monitor-header">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-neutral-800 flex items-center gap-2">
              <span>{translations.observerScreen}</span>
            </h1>
            <p className="text-xs text-neutral-400 font-medium">مراقبة النداءات والتحكم بالاستجابة في المركز لحظة بلحظة</p>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100" id="live-sync-indicator">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>متصل ومزامن لحظياً (Live Connected)</span>
        </div>
      </div>

      {/* Metric Widgets (Compact Visuals) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="monitor-metrics-grid">
        
        {/* Widget 1: Pending Callers */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4" id="metric-pending">
          <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center font-bold shrink-0">
            <AlertCircle size={24} className={pendingCalls.length > 0 ? 'animate-bounce' : ''} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 block uppercase">{translations.pending}</span>
            <span className="text-2xl font-black text-rose-600 block">{pendingCalls.length}</span>
          </div>
        </div>

        {/* Widget 2: Handled/Accepted */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4" id="metric-accepted">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center font-bold shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 block uppercase">{translations.accepted}</span>
            <span className="text-2xl font-black text-amber-600 block">{acceptedCalls.length}</span>
          </div>
        </div>

        {/* Widget 3: Closed Logs */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4" id="metric-resolved">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 block uppercase">{translations.resolved}</span>
            <span className="text-2xl font-black text-emerald-600 block">{resolvedCalls.length}</span>
          </div>
        </div>

        {/* Widget 4: Avg Speed Response */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4" id="metric-speed">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center font-bold shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 block uppercase">{translations.responseTime}</span>
            <span className="text-xl font-black text-blue-600 block">
              {avgResponseTime > 60 
                ? `${Math.round(avgResponseTime / 60)} ${translations.minutes}`
                : `${avgResponseTime} ${translations.seconds}`}
            </span>
          </div>
        </div>

      </div>

      {/* Filtering Options */}
      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between" id="monitor-filters">
        <div className="flex items-center gap-2 text-sm font-bold text-neutral-700 w-full md:w-auto">
          <Filter size={16} className="text-neutral-500" />
          <span>تصفية النداءات:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto" id="filter-controls-container">
          {/* Floor filter */}
          <select
            id="filter-floor-select"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="bg-white border border-neutral-200 px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">كل الأدوار (All Floors)</option>
            <option value="floor-1">الدور الأول (Floor 1)</option>
            <option value="floor-2">الدور الثاني (Floor 2)</option>
          </select>

          {/* Call type filter */}
          <select
            id="filter-type-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-neutral-200 px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">كل التصنيفات (All Types)</option>
            <option value="emergency">🚨 طوارئ فقط (Emergencies Only)</option>
            <option value="relief">🔄 طلبات بديل (Relief Requests)</option>
          </select>
        </div>
      </div>

      {/* Call Cards Main Monitor Grid */}
      <div>
        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2" id="monitor-subtitle">
          <span>قائمة البلاغات النشطة والحرجة ({filteredActive.length})</span>
        </h2>

        {filteredActive.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-500 shadow-sm" id="empty-monitor-state">
            <div className="w-16 h-16 rounded-full bg-neutral-50 text-neutral-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-extrabold text-neutral-800 mb-1">{translations.noActiveCalls}</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">عندما يضغط أي موظف ميداني على زر "نداء"، سيظهر البلاغ هنا فوراً مع تشغيل صافرة التنبيه.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="monitor-active-calls-grid">
            {filteredActive.map((call) => {
              const isEmergency = call.type === CallType.EMERGENCY;
              const isPending = call.status === CallStatus.PENDING;
              
              // Calculate minutes elapsed since creation
              const elapsedMinutes = Math.round((Date.now() - new Date(call.createdAt).getTime()) / 60000);

              return (
                <div
                  key={call.id}
                  className={`bg-white rounded-2xl border-2 shadow-sm transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    isPending
                      ? isEmergency 
                        ? 'border-rose-400 animate-pulse shadow-rose-50'
                        : 'border-amber-300 shadow-amber-50'
                      : 'border-neutral-200'
                  }`}
                  id={`monitor-call-card-${call.id}`}
                >
                  {/* Top Call Alert Banner */}
                  <div className={`px-4 py-3 text-white font-extrabold text-xs flex justify-between items-center ${
                    isEmergency ? 'bg-rose-600' : 'bg-amber-500'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      {isEmergency ? <AlertCircle size={16} /> : <RefreshCw size={16} />}
                      {isEmergency ? translations.emergencyCall : translations.reliefCall}
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      {elapsedMinutes} دقيقة مضت ({elapsedMinutes}m ago)
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="p-4 flex-1 space-y-3" id={`monitor-card-body-${call.id}`}>
                    {/* Location Badge Banner */}
                    <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-1">
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{translations.selectLocation}</div>
                      <div className="text-sm font-black text-neutral-800">
                        📍 {call.floorName.split(' ')[0]} • {call.wingName.split(' (')[0]}
                      </div>
                      <div className="text-xs text-neutral-700 font-bold flex items-center gap-3">
                        <span>🚪 {translations.room}: <b className="text-sm text-neutral-900">{call.roomNumber}</b></span>
                        {call.bedNumber && (
                          <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-100">
                            🛏️ {translations.bed}: {call.bedNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Requester detail */}
                    <div className="flex items-center gap-2.5 text-xs border-t border-neutral-100 pt-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold shrink-0">
                        {call.workerName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-semibold">{translations.workerName}</span>
                        <span className="font-bold text-neutral-800" id={`card-worker-name-${call.id}`}>{call.workerName}</span>
                      </div>
                    </div>

                    {/* Progress tracking details if accepted */}
                    {call.status === CallStatus.ACCEPTED && (
                      <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-xs space-y-1 text-emerald-800">
                        <div className="font-bold flex items-center gap-1">
                          <span>🟢 تم القبول وبدء الاستجابة</span>
                        </div>
                        <div><b>المستجيب الميداني:</b> {call.responderName}</div>
                        <div className="text-[10px] text-emerald-600/90">
                          وقت الاستجابة الأولي: {Math.round((new Date(call.acceptedAt!).getTime() - new Date(call.createdAt).getTime()) / 1000)} ثانية
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operational Action Footer */}
                  <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-2" id={`monitor-card-actions-${call.id}`}>
                    {isPending ? (
                      <button
                        onClick={() => onAcceptCall(call.id)}
                        className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs text-white shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          isEmergency ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-50'
                        }`}
                        id={`btn-accept-${call.id}`}
                      >
                        <UserCheck size={14} />
                        <span>{translations.accept}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenResolveDialog(call.id)}
                        className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        id={`btn-resolve-${call.id}`}
                      >
                        <CheckCircle2 size={14} />
                        <span>{translations.resolve}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RESOLUTION POPUP OVERLAY */}
      {resolvingCallId && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4" id="resolve-overlay">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-neutral-200 shadow-2xl p-5 animate-scale-up" id="resolve-modal">
            <h3 className="text-lg font-black text-neutral-800 mb-2 flex items-center gap-2" id="resolve-modal-title">
              <CheckCircle2 className="text-emerald-500" size={22} />
              <span>إغلاق وإنهاء بلاغ النداء</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed font-medium">مستجيب الحالة الميداني سيكمل إغلاق النداء وتأكيد الاستقرار. اكتب أي ملاحظات إضافية قبل الحفظ والسجل التاريخي.</p>
            
            <div className="mb-4" id="notes-input-container">
              <label htmlFor="resolve-notes-input" className="text-[10px] font-bold text-neutral-400 block mb-1.5 uppercase">ملاحظات المستجيب (اختياري)</label>
              <textarea
                id="resolve-notes-input"
                rows={3}
                placeholder="مثال: تم التعامل وإعطاء الدواء لنزيل السرير، أو تمت تغطية الدور بنجاح..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 resize-none font-medium"
              />
            </div>

            <div className="flex gap-2" id="resolve-modal-actions">
              <button
                onClick={() => setResolvingCallId(null)}
                className="flex-1 py-2.5 rounded-lg border border-neutral-200 text-xs font-bold text-neutral-500 hover:bg-neutral-50 cursor-pointer"
                id="btn-modal-cancel"
              >
                {translations.cancel}
              </button>
              <button
                onClick={handleConfirmResolve}
                className="flex-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-100 cursor-pointer"
                id="btn-modal-confirm"
              >
                {translations.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
