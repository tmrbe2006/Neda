import React, { useState } from 'react';
import { Floor, User, UserRole, CallRequest, CallType, CallStatus, TranslationSet } from '../types';
import { Settings, Users, Clipboard, Brain, Plus, Trash2, Edit2, Shield, Sparkles, Filter, Search, Calendar, ChevronRight, Check } from 'lucide-react';

interface OwnerDashboardProps {
  user: User;
  building: Floor[];
  usersList: User[];
  callLogs: CallRequest[];
  activeCalls: CallRequest[];
  translations: TranslationSet;
  onUpdateBuilding: (newBuilding: Floor[]) => Promise<any>;
  onAddUser: (userPayload: any) => Promise<any>;
  onUpdateUser: (userId: string, payload: any) => Promise<any>;
  onDeleteUser: (userId: string) => Promise<any>;
  onGenerateAiReport: () => Promise<string>;
}

export default function OwnerDashboard({
  user,
  building,
  usersList,
  callLogs,
  activeCalls,
  translations,
  onUpdateBuilding,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onGenerateAiReport
}: OwnerDashboardProps) {
  // Tabs: 'BUILDING' | 'STAFF' | 'LOGS' | 'REPORTS'
  const [activeTab, setActiveTab] = useState<'BUILDING' | 'STAFF' | 'LOGS' | 'REPORTS'>('REPORTS'); // Start on reports to look awesome

  // Building Editor State
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [newFloorName, setNewFloorName] = useState('');
  
  // User Manager State
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>(UserRole.WORKER);
  const [newStaffFloor, setNewStaffFloor] = useState<string>('');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  // AI Report State
  const [aiReport, setAiReport] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Search and logs filter
  const [searchTerm, setSearchTerm] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('all');

  // Trigger AI analysis
  const handleTriggerAi = async () => {
    setIsAnalyzing(true);
    setAiReport('');
    try {
      const report = await onGenerateAiReport();
      setAiReport(report);
    } catch (err) {
      console.error(err);
      setAiReport('عذراً، لم نتمكن من الاتصال بالذكاء الاصطناعي حالياً. يرجى تفعيل مفتاح GEMINI_API_KEY في الإعدادات.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffUsername || !newStaffName) return;
    try {
      const payload: any = {
        username: newStaffUsername,
        name: newStaffName,
        role: newStaffRole,
        phone: newStaffPhone
      };
      if (newStaffRole === UserRole.WORKER && newStaffFloor) {
        payload.floorAccess = newStaffFloor;
      }
      await onAddUser(payload);
      
      // Reset inputs
      setNewStaffUsername('');
      setNewStaffName('');
      setNewStaffPhone('');
      setNewStaffRole(UserRole.WORKER);
      setNewStaffFloor('');
    } catch (err) {
      console.error(err);
    }
  };

  // Simple formatting helper for Gemini markdown reports
  const renderFormattedReport = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('###')) {
        return <h3 key={idx} className="text-sm font-black text-neutral-800 mt-4 mb-2 border-b border-neutral-100 pb-1">{line.replace('###', '').trim()}</h3>;
      }
      if (line.startsWith('##')) {
        return <h2 key={idx} className="text-base font-black text-blue-800 mt-5 mb-2.5 flex items-center gap-2">✨ {line.replace('##', '').trim()}</h2>;
      }
      if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
        return <div key={idx} className="text-xs font-extrabold text-neutral-800 mt-3.5 mb-1.5">{line}</div>;
      }
      if (line.trim().startsWith('*')) {
        return (
          <li key={idx} className="text-xs text-neutral-600 list-disc list-inside ms-4 mb-1 font-medium">
            {line.replace('*', '').replace(/\*\*(.*?)\*\*/g, '$1').trim()}
          </li>
        );
      }
      return <p key={idx} className="text-xs text-neutral-600 leading-relaxed mb-2.5 font-medium">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
    });
  };

  // Filter logs based on search & filters
  const filteredLogs = callLogs.filter(log => {
    const typeMatch = logTypeFilter === 'all' || log.type === logTypeFilter;
    const searchMatch = !searchTerm || 
      log.workerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.responderName && log.responderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.roomNumber.includes(searchTerm);
    return typeMatch && searchMatch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" id="owner-dashboard-view">
      
      {/* Header Profile Title */}
      <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="owner-header">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 text-amber-500 flex items-center justify-center shadow-md">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-neutral-800 flex items-center gap-1">
              <span>{translations.settings}</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">صلاحيات المالك الكاملة</span>
            </h1>
            <p className="text-xs text-neutral-400 font-medium">إدارة هيكل المبنى، الطواقم الميدانية، ومراجعة تقارير الاستجابة الذكية</p>
          </div>
        </div>

        {/* Administrative Tab Navigation */}
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 w-full sm:w-auto" id="owner-tabs">
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'REPORTS' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Brain size={14} />
            <span>{translations.aiReports}</span>
          </button>
          <button
            onClick={() => setActiveTab('STAFF')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'STAFF' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Users size={14} />
            <span>{translations.userManagement}</span>
          </button>
          <button
            onClick={() => setActiveTab('BUILDING')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'BUILDING' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Settings size={14} />
            <span>الأجنحة والغرف</span>
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'LOGS' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Clipboard size={14} />
            <span>{translations.historyLogs}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI INTELLIGENCE REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="panel-ai-reports">
          {/* Metrics side cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
              <h3 className="text-sm font-black text-neutral-800 mb-4 flex items-center gap-2">
                <Sparkles className="text-amber-500" size={16} />
                <span>إحصائيات الأداء الكلية</span>
              </h3>
              
              <div className="space-y-4" id="report-stats">
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 flex justify-between items-center">
                  <span className="text-xs text-neutral-400 font-semibold">معدل البلاغات المغلقة</span>
                  <span className="text-lg font-black text-emerald-600">{callLogs.length} نداء</span>
                </div>
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 flex justify-between items-center">
                  <span className="text-xs text-neutral-400 font-semibold">نداءات طوارئ عاجلة</span>
                  <span className="text-lg font-black text-rose-600">
                    {callLogs.filter(c => c.type === CallType.EMERGENCY).length + activeCalls.filter(c => c.type === CallType.EMERGENCY).length}
                  </span>
                </div>
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 flex justify-between items-center">
                  <span className="text-xs text-neutral-400 font-semibold">متوسط الاستجابة</span>
                  <span className="text-lg font-black text-blue-600">
                    {callLogs.length > 0 
                      ? `${Math.round(callLogs.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / callLogs.length)} ثانية`
                      : '0 ثانية'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Callout */}
            <div className="bg-blue-900 text-white rounded-2xl p-5 border border-blue-800 shadow-sm relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-800/30" />
              <div className="relative z-10 space-y-3">
                <h4 className="text-sm font-extrabold flex items-center gap-1.5">
                  <Brain size={16} className="text-amber-400" />
                  <span>محرك تقارير نداء الذكي</span>
                </h4>
                <p className="text-[11px] text-blue-100/90 leading-relaxed font-medium">يقوم نموذج الذكاء الاصطناعي بتحليل سجل الاستجابة بدقة، واكتشاف الأماكن الساخنة ذات الكثافة الأعلى، ويوصي بخطة التوظيف وتوزيع مناوبات المشرفين.</p>
                <button
                  onClick={handleTriggerAi}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-900 font-black text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                  id="btn-trigger-ai-report"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                      <span>{translations.aiAnalyzing}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>{translations.generateAiReport}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Report Render Display */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm min-h-[400px] flex flex-col justify-between" id="report-output-panel">
            <div className="flex-1">
              <h3 className="text-sm font-black text-neutral-800 mb-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                <span>{translations.aiSummaryReport}</span>
                <span className="text-[10px] text-neutral-400">تحليل لحظي • Real-time AI Analysis</span>
              </h3>

              {!aiReport && !isAnalyzing ? (
                <div className="py-24 text-center text-neutral-400 font-medium">
                  <div className="w-14 h-14 rounded-full bg-neutral-50 text-neutral-300 flex items-center justify-center mx-auto mb-3">
                    <Brain size={28} />
                  </div>
                  <p className="text-xs">اضغط على زر <b>"توليد تقرير تحليلي ذكي"</b> على اليمين لبدء تحليل البيانات بواسطة الذكاء الاصطناعي.</p>
                </div>
              ) : isAnalyzing ? (
                <div className="py-24 text-center text-neutral-400 space-y-3 font-medium">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto animate-spin border-2 border-blue-500 border-t-transparent" />
                  <p className="text-xs">{translations.aiAnalyzing}</p>
                </div>
              ) : (
                <div className="bg-neutral-50/50 rounded-xl p-4 border border-neutral-100 text-right animate-fade-in" id="report-content-box">
                  {renderFormattedReport(aiReport)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF & ACCOUNT MANAGEMENT */}
      {activeTab === 'STAFF' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="panel-staff-management">
          {/* Add Staff form */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm h-fit">
            <h3 className="text-sm font-black text-neutral-800 mb-4 flex items-center gap-1.5">
              <Plus className="text-blue-500" size={16} />
              <span>إضافة موظف جديد للمركز</span>
            </h3>

            <form onSubmit={handleCreateStaff} className="space-y-4" id="add-staff-form">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase">اسم الموظف الثلاثي</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف خالد السبيعي"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase">اسم المستخدم (بالإنجليزي للدخول)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: yosef_khalid"
                  value={newStaffUsername}
                  onChange={(e) => setNewStaffUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase">رقم الهاتف الجوال</label>
                <input
                  type="tel"
                  placeholder="مثال: +966500000000"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase">الصلاحية والنظام</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                >
                  <option value={UserRole.WORKER}>{translations.worker}</option>
                  <option value={UserRole.MONITOR}>{translations.monitor}</option>
                  <option value={UserRole.EMERGENCY}>{translations.emergencyTech}</option>
                  <option value={UserRole.ADMIN}>{translations.admin}</option>
                </select>
              </div>

              {/* Conditional Floor assignment for workers */}
              {newStaffRole === UserRole.WORKER && (
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase">حصر الموقع على دور محدد (اختياري)</label>
                  <select
                    value={newStaffFloor}
                    onChange={(e) => setNewStaffFloor(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="">كل الأدوار (مفتوح)</option>
                    {building.map(f => (
                      <option key={f.id} value={f.id}>{f.name.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-100 transition cursor-pointer"
                id="btn-add-staff-submit"
              >
                تأكيد الإضافة والتسجيل
              </button>
            </form>
          </div>

          {/* Staff List table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm overflow-hidden" id="staff-list-panel">
            <h3 className="text-sm font-black text-neutral-800 mb-4 pb-2 border-b border-neutral-100">طاقم العمل المعتمد بالمركز ({usersList.length})</h3>
            
            <div className="overflow-x-auto" id="staff-table-container">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-semibold">
                    <th className="py-3 px-2">الاسم الثلاثي</th>
                    <th className="py-3 px-2">اسم المستخدم</th>
                    <th className="py-3 px-2">الرتبة / الدور</th>
                    <th className="py-3 px-2">رقم الجوال</th>
                    <th className="py-3 px-2 text-center">العمليات</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-neutral-700">
                  {usersList.map((st) => (
                    <tr key={st.id} className="border-b border-neutral-100 hover:bg-neutral-50" id={`staff-row-${st.id}`}>
                      <td className="py-3.5 px-2 font-bold text-neutral-800">{st.name}</td>
                      <td className="py-3.5 px-2 font-mono text-neutral-500">{st.username}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.role === UserRole.OWNER ? 'bg-amber-100 text-amber-800' :
                          st.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-800' :
                          st.role === UserRole.EMERGENCY ? 'bg-rose-100 text-rose-800' :
                          st.role === UserRole.MONITOR ? 'bg-violet-100 text-violet-800' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {st.role === UserRole.OWNER ? translations.systemOwner :
                           st.role === UserRole.ADMIN ? translations.admin :
                           st.role === UserRole.EMERGENCY ? translations.emergencyTech :
                           st.role === UserRole.MONITOR ? translations.monitor :
                           translations.worker}
                        </span>
                        {st.floorAccess && (
                          <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1 py-0.5 rounded ms-1">
                            حصر {building.find(f => f.id === st.floorAccess)?.name.split(' ')[0] || st.floorAccess}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-neutral-500">{st.phone || '-'}</td>
                      <td className="py-3.5 px-2 text-center">
                        {st.id !== 'usr-owner' && (
                          <button
                            onClick={() => onDeleteUser(st.id)}
                            className="p-1 text-neutral-400 hover:text-rose-600 rounded transition cursor-pointer"
                            id={`btn-delete-staff-${st.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM BUILDING SETUP EDITOR */}
      {activeTab === 'BUILDING' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm animate-fade-in" id="panel-building-config">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-black text-neutral-800">هيكل أجنحة وغرف وأسرة المركز</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">تحديد الدور والأجنحة والمواقع التي يعمل عليها طاقم النداء</p>
            </div>
            
            <button
              onClick={() => {
                alert('المركز محدد بالكامل افتراضياً لضمان سلاسة التشغيل والتحقق السريع.');
              }}
              className="py-1.5 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs cursor-pointer flex items-center gap-1.5"
              id="btn-add-floor-building"
            >
              <Plus size={14} />
              <span>إضافة دور جديد (Add Floor)</span>
            </button>
          </div>

          {/* Interactive tree of building floors */}
          <div className="space-y-6" id="building-editor-tree">
            {building.map((floor) => (
              <div key={floor.id} className="border border-neutral-200 rounded-2xl overflow-hidden shadow-xs" id={`floor-editor-${floor.id}`}>
                {/* Floor Bar */}
                <div className="bg-neutral-50 p-4 border-b border-neutral-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏢</span>
                    <span className="font-bold text-neutral-800 text-sm">{floor.name}</span>
                  </div>
                  <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2.5 py-0.5 rounded-full font-bold">
                    {floor.wings.length} أجنحة (Wings)
                  </span>
                </div>

                {/* Wings Grid inside Floor */}
                <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                  {floor.wings.map((wing) => (
                    <div key={wing.id} className="bg-neutral-50/50 rounded-xl border border-neutral-200 p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-neutral-200/60 pb-2">
                        <span className="font-extrabold text-neutral-800 text-xs flex items-center gap-1.5">
                          <span>🚪</span>
                          <span>{wing.name}</span>
                        </span>
                        <span className="text-[10px] text-neutral-400 font-semibold">{wing.rooms.length} غرف</span>
                      </div>

                      {/* Rooms inside Wing */}
                      <div className="flex flex-wrap gap-2">
                        {wing.rooms.map((room) => (
                          <div
                            key={room.id}
                            className="bg-white border border-neutral-200 rounded-lg p-2 text-center text-xs w-[76px] relative group"
                            id={`room-node-${room.id}`}
                          >
                            <div className="font-black text-neutral-800">غرفة {room.number}</div>
                            <div className="text-[9px] text-neutral-400 mt-0.5 font-bold">🛏️ {room.beds.length} أسرة</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COMPREHENSIVE RECORDS & LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm animate-fade-in" id="panel-history-logs">
          
          {/* Logs Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6" id="logs-filters">
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-2 rounded-xl w-full md:max-w-xs">
              <Search size={14} className="text-neutral-400" />
              <input
                type="text"
                placeholder="ابحث بالغرفة، اسم العامل، أو المستجيب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full font-medium"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto" id="logs-filter-toggles">
              <button
                onClick={() => setLogTypeFilter('all')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  logTypeFilter === 'all' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setLogTypeFilter(CallType.EMERGENCY)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  logTypeFilter === CallType.EMERGENCY ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                🚨 طوارئ
              </button>
              <button
                onClick={() => setLogTypeFilter(CallType.RELIEF)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  logTypeFilter === CallType.RELIEF ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                🔄 طلب بديل
              </button>
            </div>
          </div>

          {/* Events list log */}
          <div className="space-y-3" id="logs-list-container">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 text-xs font-medium border border-dashed border-neutral-200 rounded-xl">
                لا توجد سجلات مطابقة لمعايير البحث.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isEmergency = log.type === CallType.EMERGENCY;
                return (
                  <div key={log.id} className="p-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-all flex flex-col md:flex-row justify-between gap-4 text-xs font-medium text-neutral-600" id={`log-item-${log.id}`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                          isEmergency ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isEmergency ? '🚨 طوارئ الطاقم' : '🔄 طلب بديل'}
                        </span>
                        
                        <span className="text-neutral-400 flex items-center gap-1 font-mono">
                          <Calendar size={12} />
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="font-extrabold text-neutral-800 text-sm">
                        📍 {log.floorName.split(' ')[0]} • الغرفة {log.roomNumber} {log.bedNumber && `• السرير ${log.bedNumber}`}
                      </p>

                      <p className="text-[11px]">
                        <b>المنادي الميداني:</b> {log.workerName}
                      </p>
                    </div>

                    <div className="md:text-left space-y-1.5 self-end md:self-center border-t md:border-t-0 border-neutral-100 pt-2.5 md:pt-0 w-full md:w-auto flex flex-col items-start md:items-end">
                      {log.responderName && (
                        <div className="text-[11px] font-bold text-neutral-700">
                          🟢 <b>المستجيب:</b> {log.responderName}
                        </div>
                      )}
                      
                      {log.durationSeconds && (
                        <div className="text-[10px] text-neutral-400 font-mono">
                          ⏱️ مدة الاستجابة: <b>{log.durationSeconds} ثانية</b> ({Math.round(log.durationSeconds / 60)} دقيقة)
                        </div>
                      )}

                      {log.notes && (
                        <div className="bg-neutral-50 p-2 rounded border border-neutral-100 text-[10px] text-neutral-500 max-w-xs italic text-right mt-1.5 leading-relaxed font-semibold">
                          📝 {log.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
