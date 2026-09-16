import React, { useState } from 'react';
import { Floor, Wing, Room, Bed, CallType, CallStatus, CallRequest, TranslationSet } from '../types';
import { AlertCircle, RefreshCw, CheckCircle2, User, HelpCircle, ChevronLeft, MapPin, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface WorkerDashboardProps {
  user: any;
  building: Floor[];
  activeCalls: CallRequest[];
  translations: TranslationSet;
  isRtl: boolean;
  onSendCall: (payload: any) => Promise<any>;
}

export default function WorkerDashboard({
  user,
  building,
  activeCalls,
  translations,
  isRtl,
  onSendCall
}: WorkerDashboardProps) {
  // Wizard steps: 'LOCATION' | 'CALL_TYPE' | 'CONFIRM' | 'SENDING'
  const [step, setStep] = useState<'LOCATION' | 'CALL_TYPE' | 'CONFIRM' | 'SENDING'>('LOCATION');
  
  // Location selectors
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [selectedWing, setSelectedWing] = useState<Wing | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  
  // Call configuration
  const [selectedCallType, setSelectedCallType] = useState<CallType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill floor restriction if worker is restricted to a floor
  React.useEffect(() => {
    if (user.floorAccess && building.length > 0) {
      const matched = building.find(f => f.id === user.floorAccess);
      if (matched) {
        setSelectedFloor(matched);
      }
    }
  }, [user.floorAccess, building]);

  const handleSelectFloor = (floor: Floor) => {
    setSelectedFloor(floor);
    setSelectedWing(null);
    setSelectedRoom(null);
    setSelectedBed(null);
  };

  const handleSelectWing = (wing: Wing) => {
    setSelectedWing(wing);
    setSelectedRoom(null);
    setSelectedBed(null);
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setSelectedBed(null);
  };

  const handleSelectBed = (bed: Bed) => {
    setSelectedBed(bed);
  };

  const resetSelection = () => {
    // If restricted to floor, keep floor
    if (!user.floorAccess) {
      setSelectedFloor(null);
    }
    setSelectedWing(null);
    setSelectedRoom(null);
    setSelectedBed(null);
    setSelectedCallType(null);
    setStep('LOCATION');
  };

  const handleNextToCallType = () => {
    if (selectedFloor && selectedWing && selectedRoom) {
      setStep('CALL_TYPE');
    }
  };

  const handleSelectCallType = (type: CallType) => {
    setSelectedCallType(type);
    setStep('CONFIRM');
  };

  const handleConfirmCall = async () => {
    if (!selectedFloor || !selectedWing || !selectedRoom || !selectedCallType) return;
    
    setIsSubmitting(true);
    setStep('SENDING');
    
    const payload = {
      workerId: user.id,
      workerName: user.name,
      type: selectedCallType,
      floorId: selectedFloor.id,
      floorName: selectedFloor.name,
      wingId: selectedWing.id,
      wingName: selectedWing.name,
      roomId: selectedRoom.id,
      roomNumber: selectedRoom.number,
      bedId: selectedBed?.id || '',
      bedNumber: selectedBed?.number || ''
    };

    try {
      await onSendCall(payload);
      // Wait briefly for a smooth UX
      setTimeout(() => {
        setIsSubmitting(false);
        resetSelection();
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setStep('CONFIRM');
    }
  };

  // Filter active calls sent by THIS worker
  const myActiveCalls = activeCalls.filter(c => c.workerId === user.id);

  return (
    <div className="max-w-md mx-auto px-4 py-6" id="worker-dashboard-view">
      {/* Header Profile Greeting */}
      <div className="bg-white rounded-xl p-4 border border-neutral-100 shadow-sm mb-6 flex items-center justify-between" id="worker-profile-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg" id="avatar-worker">
            {user.name.charAt(0)}
          </div>
          <div>
            <span className="text-xs text-neutral-400 block">{translations.worker}</span>
            <span className="font-semibold text-neutral-800 text-sm block" id="worker-username">{user.name}</span>
          </div>
        </div>
        {user.floorAccess && (
          <span className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full font-medium" id="floor-badge">
            {translations.floor}: {building.find(f => f.id === user.floorAccess)?.name.split(' ')[0] || user.floorAccess}
          </span>
        )}
      </div>

      {/* Step Visual Progress Bar */}
      {step !== 'SENDING' && (
        <div className="mb-6 flex justify-between items-center bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-xs text-neutral-400" id="progress-container">
          <div className={`flex items-center gap-1 font-semibold ${step === 'LOCATION' ? 'text-blue-600' : 'text-emerald-600'}`}>
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">1</span>
            <span>{translations.selectLocation}</span>
          </div>
          <div className="h-px bg-neutral-200 flex-1 mx-2" />
          <div className={`flex items-center gap-1 font-semibold ${step === 'CALL_TYPE' ? 'text-blue-600' : step === 'CONFIRM' ? 'text-emerald-600' : ''}`}>
            <span className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-[10px]">2</span>
            <span>{translations.nidaa}</span>
          </div>
          <div className="h-px bg-neutral-200 flex-1 mx-2" />
          <div className={`flex items-center gap-1 font-semibold ${step === 'CONFIRM' ? 'text-blue-600' : ''}`}>
            <span className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-[10px]">3</span>
            <span>{translations.confirm}</span>
          </div>
        </div>
      )}

      {/* Main Wizard Area */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm min-h-[340px] flex flex-col justify-between" id="wizard-card">
        
        {/* Step 1: LOCATION SELECTOR */}
        {step === 'LOCATION' && (
          <div className="flex-1 flex flex-col justify-between" id="location-wizard-step">
            <div>
              <h2 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2" id="step-title-location">
                <MapPin className="text-blue-500" size={20} />
                {translations.selectLocation}
              </h2>

              {/* Floor Selection (if not restricted) */}
              {!user.floorAccess && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-neutral-400 uppercase block mb-2">{translations.floor}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {building.map(f => (
                      <button
                        key={f.id}
                        onClick={() => handleSelectFloor(f)}
                        className={`py-3.5 px-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                          selectedFloor?.id === f.id
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                        id={`btn-floor-${f.id}`}
                      >
                        <span className="text-xl">🏢</span>
                        <span className="mt-1">{f.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wing Selection (Dependent on selected Floor) */}
              {selectedFloor && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-neutral-400 uppercase block mb-2">{translations.wing}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFloor.wings.map(w => (
                      <button
                        key={w.id}
                        onClick={() => handleSelectWing(w)}
                        className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                          selectedWing?.id === w.id
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                        }`}
                        id={`btn-wing-${w.id}`}
                      >
                        <span className="text-lg">🚪</span>
                        <span className="mt-1 line-clamp-1">{w.name.split(' (')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Room Selection (Dependent on selected Wing) */}
              {selectedWing && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-neutral-400 uppercase block mb-2">{translations.room}</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {selectedWing.rooms.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectRoom(r)}
                        className={`py-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                          selectedRoom?.id === r.id
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                        id={`btn-room-${r.id}`}
                      >
                        <span>{r.number}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bed Selection (Optional, Dependent on Room) */}
              {selectedRoom && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-neutral-400 uppercase block mb-2">{translations.bed}</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {selectedRoom.beds.map(b => (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBed(b)}
                        className={`py-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                          selectedBed?.id === b.id
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100'
                        }`}
                        id={`btn-bed-${b.id}`}
                      >
                        <span>🛏️ {b.number}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next Button */}
            <div className="mt-6">
              <button
                onClick={handleNextToCallType}
                disabled={!selectedFloor || !selectedWing || !selectedRoom}
                className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                  selectedFloor && selectedWing && selectedRoom
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                }`}
                id="btn-location-next"
              >
                <span>{translations.confirm}</span>
                {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: CHOOSE CALL TYPE */}
        {step === 'CALL_TYPE' && (
          <div className="flex-1 flex flex-col justify-between animate-fade-in" id="call-type-wizard-step">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-neutral-800">{translations.nidaa}</h2>
                <button
                  onClick={() => setStep('LOCATION')}
                  className="text-xs font-semibold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer"
                  id="btn-back-to-location"
                >
                  <ChevronLeft size={14} className={isRtl ? 'rotate-180' : ''} />
                  <span>{translations.backToSelection}</span>
                </button>
              </div>

              {/* Selection Location Summary */}
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 mb-6 text-xs text-neutral-600 flex flex-wrap gap-x-4 gap-y-1.5" id="location-summary-call-type">
                <span>📍 <b>{translations.floor}:</b> {selectedFloor?.name.split(' ')[0]}</span>
                <span>🚪 <b>{translations.wing}:</b> {selectedWing?.name.split(' (')[0]}</span>
                <span>🔢 <b>{translations.room}:</b> {selectedRoom?.number}</span>
                {selectedBed && <span>🛏️ <b>{translations.bed}:</b> {selectedBed?.number}</span>}
              </div>

              {/* CALL TYPE CARDS */}
              <div className="space-y-4">
                {/* 1. Emergency Call Card */}
                <button
                  onClick={() => handleSelectCallType(CallType.EMERGENCY)}
                  className="w-full text-right p-4 rounded-2xl border-2 border-rose-100 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50 transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-sm"
                  id="btn-call-emergency"
                >
                  <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center animate-pulse shrink-0">
                    <AlertCircle size={32} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-rose-700 text-base mb-1">{translations.emergencyCall}</h3>
                    <p className="text-xs text-rose-600/80 leading-relaxed font-medium">{translations.emergencyRequestDesc}</p>
                  </div>
                </button>

                {/* 2. Relief Call Card */}
                <button
                  onClick={() => handleSelectCallType(CallType.RELIEF)}
                  className="w-full text-right p-4 rounded-2xl border-2 border-amber-100 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50 transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-sm"
                  id="btn-call-relief"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <RefreshCw size={28} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-amber-700 text-base mb-1">{translations.reliefCall}</h3>
                    <p className="text-xs text-amber-600/80 leading-relaxed font-medium">{translations.reliefRequestDesc}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: CONFIRMATION SUMMARY */}
        {step === 'CONFIRM' && (
          <div className="flex-1 flex flex-col justify-between animate-fade-in" id="confirm-wizard-step">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-neutral-800">{translations.confirm}</h2>
                <button
                  onClick={() => setStep('CALL_TYPE')}
                  className="text-xs font-semibold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer"
                  id="btn-back-to-types"
                >
                  <ChevronLeft size={14} className={isRtl ? 'rotate-180' : ''} />
                  <span>{translations.backToSelection}</span>
                </button>
              </div>

              {/* Visual Ticket Summary */}
              <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-sm bg-neutral-50" id="confirm-ticket">
                {/* Header Ticket color */}
                <div className={`p-4 text-white font-extrabold flex items-center justify-between ${
                  selectedCallType === CallType.EMERGENCY ? 'bg-rose-600' : 'bg-amber-500'
                }`} id="ticket-header">
                  <div className="flex items-center gap-2">
                    {selectedCallType === CallType.EMERGENCY ? <AlertCircle size={20} /> : <RefreshCw size={20} />}
                    <span>{selectedCallType === CallType.EMERGENCY ? translations.emergencyCall : translations.reliefCall}</span>
                  </div>
                  <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 bg-white/20 rounded-full">NIDAA TICKET</span>
                </div>

                {/* Ticket Details */}
                <div className="p-4 space-y-3.5 text-sm font-medium text-neutral-700 bg-white" id="ticket-body">
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span className="text-neutral-400">{translations.floor}</span>
                    <span className="font-bold text-neutral-800">{selectedFloor?.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span className="text-neutral-400">{translations.wing}</span>
                    <span className="font-bold text-neutral-800">{selectedWing?.name.split(' (')[0]}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span className="text-neutral-400">{translations.room}</span>
                    <span className="font-bold text-neutral-800">{selectedRoom?.number}</span>
                  </div>
                  {selectedBed && (
                    <div className="flex justify-between border-b border-neutral-100 pb-2">
                      <span className="text-neutral-400">{translations.bed}</span>
                      <span className="font-bold text-neutral-800">{selectedBed?.number}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <span className="text-neutral-400">{translations.workerName}</span>
                    <span className="font-bold text-neutral-800">{user.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit and Cancel buttons */}
            <div className="mt-6 flex gap-3" id="confirm-actions">
              <button
                onClick={resetSelection}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 font-bold text-neutral-500 hover:bg-neutral-50 cursor-pointer transition-all text-sm"
                id="btn-confirm-cancel"
              >
                {translations.cancel}
              </button>
              <button
                onClick={handleConfirmCall}
                className={`flex-2 py-3 px-4 rounded-xl font-bold text-white shadow-md cursor-pointer transition-all text-sm flex items-center justify-center gap-2 ${
                  selectedCallType === CallType.EMERGENCY
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                }`}
                id="btn-confirm-send"
              >
                <span>{translations.sendNidaa}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: SUBMITTING / TRANSMITTING VIEW */}
        {step === 'SENDING' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center" id="sending-wizard-step">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce ${
              selectedCallType === CallType.EMERGENCY ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-500'
            }`}>
              <AlertCircle size={44} className="animate-pulse" />
            </div>
            <h3 className="text-lg font-extrabold text-neutral-800 mb-2">جاري بث النداء لحظياً...</h3>
            <p className="text-xs text-neutral-400 max-w-[240px]">يتم إرسال بلاغك فوراً لجميع المراقبين وغرفة الطوارئ</p>
            <div className="w-16 h-1 bg-neutral-100 rounded-full overflow-hidden mt-6">
              <div className={`h-full animate-infinite-loading rounded-full ${
                selectedCallType === CallType.EMERGENCY ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
            </div>
          </div>
        )}

      </div>

      {/* Active Device Calls Monitor List */}
      <div className="mt-8" id="worker-active-calls-section">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
          <span>{translations.activeRequests} ({myActiveCalls.length})</span>
        </h3>

        {myActiveCalls.length === 0 ? (
          <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl p-5 text-center text-xs text-neutral-400 font-medium">
            💡 {translations.noActiveCalls}
          </div>
        ) : (
          <div className="space-y-3" id="worker-active-calls-list">
            {myActiveCalls.map((call) => (
              <div
                key={call.id}
                className={`p-4 rounded-xl border bg-white shadow-sm transition-all duration-300 relative overflow-hidden ${
                  call.status === CallStatus.PENDING
                    ? 'border-neutral-200'
                    : 'border-emerald-200 bg-emerald-50/10'
                }`}
                id={`worker-call-item-${call.id}`}
              >
                {/* Visual side accent */}
                <div className={`absolute top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-1.5 ${
                  call.type === CallType.EMERGENCY ? 'bg-rose-500' : 'bg-amber-500'
                }`} />

                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                      call.type === CallType.EMERGENCY
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {call.type === CallType.EMERGENCY ? '🚨 طوارئ ناصعة' : '🔄 طلب بديل'}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  
                  {/* Status pills */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    call.status === CallStatus.PENDING
                      ? 'bg-neutral-100 text-neutral-500'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${call.status === CallStatus.PENDING ? 'bg-neutral-400 animate-pulse' : 'bg-emerald-500'}`} />
                    {call.status === CallStatus.PENDING ? translations.pending : translations.accepted}
                  </span>
                </div>

                {/* Location text details */}
                <p className="text-xs text-neutral-700 font-bold mb-2">
                  📍 {call.floorName.split(' ')[0]} • {call.wingName.split(' (')[0]} • {translations.room} {call.roomNumber}
                  {call.bedNumber && ` • ${translations.bed} ${call.bedNumber}`}
                </p>

                {/* Responder Feedback */}
                {call.status === CallStatus.ACCEPTED && call.responderName && (
                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-xs text-emerald-800 flex items-center justify-between" id="responder-feedback-box">
                    <div className="flex items-center gap-1.5">
                      <span className="animate-pulse">🟢</span>
                      <span><b>{translations.responder}:</b> {call.responderName}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">في الطريق (On Way)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
