import React, { useState } from 'react';
import { CallRequest, CallStatus, CallType, TranslationSet, User } from '../types';
import { AlertCircle, CheckCircle2, ShieldAlert, Clock, UserCheck, MessageSquare, Flame } from 'lucide-react';

interface EmergencyDashboardProps {
  user: User;
  activeCalls: CallRequest[];
  translations: TranslationSet;
  onAcceptCall: (callId: string) => Promise<any>;
  onResolveCall: (callId: string, notes?: string) => Promise<any>;
}

export default function EmergencyDashboard({
  user,
  activeCalls,
  translations,
  onAcceptCall,
  onResolveCall
}: EmergencyDashboardProps) {
  const [resolvingCallId, setResolvingCallId] = useState<string | null>(null);
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Only display emergencies (Exclude Relief calls for the medical/EMT crew)
  const emergencies = activeCalls.filter(c => c.type === CallType.EMERGENCY);
  const pendingEmergencies = emergencies.filter(c => c.status === CallStatus.PENDING);
  const acceptedEmergencies = emergencies.filter(c => c.status === CallStatus.ACCEPTED);

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
    <div className="max-w-5xl mx-auto px-4 py-6" id="emergency-dashboard-view">
      
      {/* Alert Header Banner */}
      <div className="bg-rose-900 text-white rounded-2xl p-6 border border-rose-800 shadow-xl mb-6 relative overflow-hidden" id="emergency-banner">
        {/* Animated Background Pulse decoration */}
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-rose-800/40 animate-ping pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg animate-pulse">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <span>{translations.emergencyScreen}</span>
              </h1>
              <p className="text-xs text-rose-200/80 mt-1 font-semibold">بث طوارئ ذو خط ساخن معطل للوساطة - استقبال وإغلاق مباشر للحالات الحرجة</p>
            </div>
          </div>

          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 text-center" id="emergency-banner-stats">
            <span className="text-[10px] text-rose-200 block uppercase font-bold">الحالات المعلقة الآن</span>
            <span className="text-3xl font-black text-white block animate-pulse">{pendingEmergencies.length}</span>
          </div>
        </div>
      </div>

      {/* Emergency Active List */}
      <div>
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>{translations.activeRequests} ({emergencies.length})</span>
        </h2>

        {emergencies.length === 0 ? (
          <div className="bg-white border border-rose-100 rounded-2xl p-12 text-center text-neutral-500 shadow-sm" id="empty-emergency-state">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-lg font-extrabold text-neutral-800 mb-1">المركز آمن ومستقر طبيّاً</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">لا توجد أي حالات مساعدة أو طوارئ معلقة في هذه الأثناء. يعاد فحص الحالات لحظياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="emergency-cards-grid">
            {emergencies.map((call) => {
              const isPending = call.status === CallStatus.PENDING;
              
              // Count seconds elapsed
              const elapsedSeconds = Math.round((Date.now() - new Date(call.createdAt).getTime()) / 1000);
              const isCriticallyDelayed = isPending && elapsedSeconds > 60; // Flag red if pending for over a minute

              return (
                <div
                  key={call.id}
                  className={`bg-white rounded-2xl border-2 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    isPending
                      ? isCriticallyDelayed
                        ? 'border-rose-600 shadow-rose-100 animate-pulse bg-rose-50/20'
                        : 'border-rose-400 shadow-rose-50'
                      : 'border-neutral-200'
                  }`}
                  id={`emergency-call-card-${call.id}`}
                >
                  {/* Flashing Hazard Top Strip for pending alerts */}
                  {isPending && (
                    <div className="h-1.5 bg-rose-600 animate-pulse w-full" id="hazard-strip" />
                  )}

                  {/* Body Info */}
                  <div className="p-5 space-y-4" id={`emergency-card-body-${call.id}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs bg-rose-100 text-rose-700 font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                        <Flame size={12} className="animate-bounce" />
                        <span>طوارئ طبية (Critical Alert)</span>
                      </span>
                      
                      <div className="flex items-center gap-1 text-xs text-neutral-400 font-bold" id="elapsed-counter">
                        <Clock size={14} />
                        <span>منذ {elapsedSeconds} {translations.seconds}</span>
                      </div>
                    </div>

                    {/* Location target description */}
                    <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                      <div className="text-[10px] font-bold text-rose-600 block uppercase mb-1.5">{translations.selectLocation}</div>
                      <div className="text-base font-black text-rose-950">
                        📍 {call.floorName.split(' ')[0]} • {call.wingName.split(' (')[0]}
                      </div>
                      <div className="text-sm font-extrabold text-rose-900 mt-1 flex items-center gap-4">
                        <span>🚪 {translations.room}: <b>{call.roomNumber}</b></span>
                        {call.bedNumber && (
                          <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded border border-rose-200 font-black">
                            🛏️ {translations.bed}: {call.bedNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Requester name */}
                    <div className="flex items-center gap-2.5 text-xs border-t border-neutral-100 pt-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold shrink-0">
                        {call.workerName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-semibold">{translations.workerName}</span>
                        <span className="font-bold text-neutral-800">{call.workerName}</span>
                      </div>
                    </div>

                    {/* Progress tracking if accepted */}
                    {!isPending && (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs space-y-1 text-emerald-800">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>🟢 تم قبول الحالة وبدء التجهيز الطبي</span>
                        </div>
                        <div><b>المستجيب الطبي:</b> {call.responderName}</div>
                        <div className="text-[10px] text-emerald-600/90">
                          وقت بدء الاستجابة: {new Date(call.acceptedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operational EMT Actions */}
                  <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-2" id={`emergency-card-actions-${call.id}`}>
                    {isPending ? (
                      <button
                        onClick={() => onAcceptCall(call.id)}
                        className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-200 cursor-pointer transition-all flex items-center justify-center gap-2"
                        id={`btn-emergency-accept-${call.id}`}
                      >
                        <UserCheck size={18} />
                        <span>تحرك تلبيةً للنداء (Accept Emergency)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenResolveDialog(call.id)}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                        id={`btn-emergency-resolve-${call.id}`}
                      >
                        <CheckCircle2 size={18} />
                        <span>إنهاء وإغلاق الحالة (Close EMT Event)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EMERGENCY NOTES MODAL */}
      {resolvingCallId && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4" id="emergency-resolve-overlay">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-neutral-200 shadow-2xl p-5 animate-scale-up" id="emergency-resolve-modal">
            <h3 className="text-lg font-black text-rose-800 mb-2 flex items-center gap-2">
              <ShieldAlert className="text-rose-600" size={22} />
              <span>تسجيل التقرير وإغلاق الطوارئ</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed font-medium">سجل تفاصيل الحادث والتدخل الطبي الذي تم تقديمه للنزيل لضمان المراجعة الإدارية وسجل الأمان بالمركز.</p>
            
            <div className="mb-4" id="emergency-notes-container">
              <label htmlFor="emergency-notes-input" className="text-[10px] font-bold text-neutral-400 block mb-1.5 uppercase">الإجراء الطبي المتبع (اختياري)</label>
              <textarea
                id="emergency-notes-input"
                rows={3}
                placeholder="مثال: تم إسعاف النزيل وإعطاء خافض الحرارة واستقرار حالته..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 resize-none font-medium"
              />
            </div>

            <div className="flex gap-2" id="emergency-resolve-modal-actions">
              <button
                onClick={() => setResolvingCallId(null)}
                className="flex-1 py-2.5 rounded-lg border border-neutral-200 text-xs font-bold text-neutral-500 hover:bg-neutral-50 cursor-pointer"
                id="btn-emergency-modal-cancel"
              >
                {translations.cancel}
              </button>
              <button
                onClick={handleConfirmResolve}
                className="flex-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                id="btn-emergency-modal-confirm"
              >
                تأكيد الإغلاق والأرشفة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
