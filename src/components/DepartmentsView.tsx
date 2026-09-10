import React, { useState } from 'react';
import { 
  Building2, 
  Bolt, 
  Trash2, 
  Droplets, 
  TrafficCone, 
  Trees, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ShieldCheck,
  FolderOpen,
  ArrowRight,
  MapPin,
  Clock,
  Send,
  Lock,
  MessageSquare,
  BadgeAlert,
  User,
  ExternalLink,
  Navigation,
  Sparkles,
  FileCheck2,
  HelpCircle,
  Check
} from 'lucide-react';
import { DEPARTMENT_SUMMARIES } from '../data/mockData';
import { Grievance, AuthUser, OfficialReply } from '../types';

interface DepartmentsViewProps {
  grievances?: Grievance[];
  onSelectGrievance?: (id: string) => void;
  onNavigateToInbox?: () => void;
  currentUser?: AuthUser | null;
  currentRole?: 'officer' | 'citizen';
  onRequestLogin?: () => void;
  onReplyGrievance?: (
    id: string,
    replyText: string,
    statusSet: 'unseen' | 'in_progress' | 'solved',
    officerInfo: { name: string; email: string; securityCode?: string }
  ) => Promise<void> | void;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  grievances = [],
  onSelectGrievance,
  onNavigateToInbox,
  currentUser,
  currentRole = 'officer',
  onRequestLogin,
  onReplyGrievance
}) => {
  const [search, setSearch] = useState('');
  const [selectedDeptFolder, setSelectedDeptFolder] = useState<string>('all');
  const [problemStatusTab, setProblemStatusTab] = useState<'all' | 'unseen' | 'in_progress' | 'solved'>('all');
  
  // Active problem being replied to
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [statusChoice, setStatusChoice] = useState<'unseen' | 'in_progress' | 'solved'>('in_progress');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);
  const [activeMapPreviewId, setActiveMapPreviewId] = useState<string | null>(null);

  const isGovernmentEmployee = currentRole === 'officer';

  const getDeptIcon = (name: string) => {
    if (name.includes('Power') || name.includes('Light')) return Bolt;
    if (name.includes('Sanitation') || name.includes('Waste')) return Trash2;
    if (name.includes('Water')) return Droplets;
    if (name.includes('Roads') || name.includes('PWD')) return TrafficCone;
    if (name.includes('Parks')) return Trees;
    return Building2;
  };

  // Check if a grievance belongs to a department strictly
  const isGrievanceInDept = (g: Grievance, deptName: string) => {
    const gDept = (g.department || '').toLowerCase();
    const dName = deptName.toLowerCase();
    if (gDept === dName) return true;
    if (dName.includes('power') && gDept.includes('power')) return true;
    if (dName.includes('sanitation') && gDept.includes('sanitation')) return true;
    if (dName.includes('water') && gDept.includes('water')) return true;
    if (dName.includes('roads') && (gDept.includes('roads') || gDept.includes('pwd'))) return true;
    if (dName.includes('parks') && gDept.includes('parks')) return true;
    return false;
  };

  // Classify grievance status into unseen, in_progress, solved
  const getProblemStatusBucket = (g: Grievance): 'unseen' | 'in_progress' | 'solved' => {
    if (g.status === 'Resolved') return 'solved';
    if (g.status === 'In Progress') return 'in_progress';
    // If status is Open and has no replies yet, it is Unseen
    if (!g.officialReplies || g.officialReplies.length === 0) return 'unseen';
    return 'in_progress';
  };

  // Filter department cases
  const deptFilteredCases = selectedDeptFolder === 'all'
    ? grievances
    : grievances.filter((g) => isGrievanceInDept(g, selectedDeptFolder));

  // Further filter by status tab (all, unseen, in_progress, solved)
  const displayedCases = deptFilteredCases.filter((g) => {
    // Search query filter
    const matchesSearch = 
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase()) ||
      g.id.toLowerCase().includes(search.toLowerCase()) ||
      (g.location?.name && g.location.name.toLowerCase().includes(search.toLowerCase())) ||
      (g.location?.address && g.location.address.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (problemStatusTab === 'all') return true;
    return getProblemStatusBucket(g) === problemStatusTab;
  });

  // Calculate live counts for status tabs
  const unseenCount = deptFilteredCases.filter((g) => getProblemStatusBucket(g) === 'unseen').length;
  const inProgressCount = deptFilteredCases.filter((g) => getProblemStatusBucket(g) === 'in_progress').length;
  const solvedCount = deptFilteredCases.filter((g) => getProblemStatusBucket(g) === 'solved').length;

  const handleOpenCase = (id: string) => {
    if (onSelectGrievance) onSelectGrievance(id);
    if (onNavigateToInbox) onNavigateToInbox();
  };

  const handleStartReply = (grievance: Grievance) => {
    setActiveReplyId(grievance.id);
    // Pre-select next logical status
    const currentBucket = getProblemStatusBucket(grievance);
    if (currentBucket === 'unseen') {
      setStatusChoice('in_progress');
    } else {
      setStatusChoice(currentBucket);
    }
    setReplyText('');
  };

  const handleSubmitReply = async (e: React.FormEvent, grievanceId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    const officerInfo = {
      name: currentUser?.name || 'Municipal Officer Jane',
      email: currentUser?.email || 'officer@muni.gov.in',
      securityCode: currentUser?.uniqueSecurityCode || 'GOV-2026-MUNI'
    };

    if (onReplyGrievance) {
      await onReplyGrievance(grievanceId, replyText.trim(), statusChoice, officerInfo);
    }

    setIsSubmittingReply(false);
    setActiveReplyId(null);
    setReplyText('');
  };

  const quickReplyPresets = [
    'Civic field crew has been dispatched to location. Site inspection underway.',
    'Issue identified. Replacement materials procured and repair work initiated.',
    'Civic work completed and inspected by zonal engineer. Restored to full operational state.',
    'Under immediate review by municipal maintenance supervisor.'
  ];

  return (
    <div id="departments-view" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap justify-between items-end gap-3 pb-2 border-b border-[#c6c6cd]/30">
        <div>
          <h1 className="font-bold text-2xl md:text-3xl text-[#0b1c30] tracking-tight flex items-center gap-2">
            <span>Municipal Department Folders</span>
            {isGovernmentEmployee && (
              <span className="bg-[#000000] text-[#82f5c1] text-xs px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#82f5c1]" />
                <span>Verified Officer Console</span>
              </span>
            )}
          </h1>
          <p className="text-xs md:text-sm text-[#45464d] mt-1">
            Departmental dossiers, exact hazard locations, and official municipal reply console.
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#76777d] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems, ward, or ID..."
            className="pl-9 pr-4 py-2 bg-white border border-[#c6c6cd]/40 rounded-xl text-xs font-medium text-[#0b1c30] focus:border-[#000000] outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Access Gate Notice: If citizen is logged in, restrict departmental internal problems */}
      {!isGovernmentEmployee && (
        <div className="bg-[#fff8f6] border border-[#ffb4ab] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#410002] flex items-center gap-2">
                <span>Government Employee & Municipality Access Only</span>
                <span className="bg-[#ffdad6] text-[#93000a] text-[10px] font-bold px-2 py-0.5 rounded">
                  Security Guard
                </span>
              </h3>
              <p className="text-xs md:text-sm text-[#93000a]/90 mt-1 max-w-2xl leading-relaxed">
                You are currently browsing in <strong>Public Citizen mode</strong>. For municipal safety and accountability, viewing internal departmental complaint folders and submitting official replies is restricted strictly to verified <strong>Government Employees</strong> with an official Gmail and Unique Security Code.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="dept-login-officer-btn"
            onClick={onRequestLogin}
            className="shrink-0 py-3 px-5 bg-[#000000] hover:bg-[#131b2e] text-white text-xs md:text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#82f5c1]" />
            <span>Login as Municipality Official</span>
          </button>
        </div>
      )}

      {/* Department Folders Selector Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#006c4a]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b1c30]">
              Select Department Folder
            </h2>
          </div>
          <span className="text-xs text-[#76777d]">
            {DEPARTMENT_SUMMARIES.length} Official Nodes
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* All Departments Folder */}
          <button
            type="button"
            onClick={() => setSelectedDeptFolder('all')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedDeptFolder === 'all'
                ? 'bg-[#000000] text-white border-[#000000] shadow-md ring-2 ring-[#000000]/10'
                : 'bg-white hover:bg-[#eff4ff] text-[#0b1c30] border-[#c6c6cd]/40 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Building2 className={`w-5 h-5 ${selectedDeptFolder === 'all' ? 'text-[#82f5c1]' : 'text-[#497cff]'}`} />
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                selectedDeptFolder === 'all' ? 'bg-white/20 text-white' : 'bg-[#eff4ff] text-[#0b1c30]'
              }`}>
                {grievances.length}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold truncate">All Departments</div>
              <div className={`text-[10px] truncate ${selectedDeptFolder === 'all' ? 'text-gray-300' : 'text-[#76777d]'}`}>
                Master Municipal Inbox
              </div>
            </div>
          </button>

          {/* Individual Department Folders */}
          {DEPARTMENT_SUMMARIES.map((dept) => {
            const Icon = getDeptIcon(dept.name);
            const isSelected = selectedDeptFolder === dept.name;
            const count = grievances.filter((g) => isGrievanceInDept(g, dept.name)).length;

            return (
              <button
                key={dept.id || dept.name}
                type="button"
                onClick={() => setSelectedDeptFolder(dept.name)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#000000] text-white border-[#000000] shadow-md ring-2 ring-[#000000]/10'
                    : 'bg-white hover:bg-[#eff4ff] text-[#0b1c30] border-[#c6c6cd]/40 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-[#82f5c1]' : 'text-[#006c4a]'}`} />
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#f1f3f9] text-[#0b1c30]'
                  }`}>
                    {count}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold truncate">
                    {dept.name.split('(')[0].trim()}
                  </div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-gray-300' : 'text-[#76777d]'}`}>
                    SLA: {dept.resolutionSla}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Department Overview Banner */}
      {selectedDeptFolder !== 'all' && (
        <div className="bg-[#ffffff] rounded-2xl p-4 border border-[#c6c6cd]/40 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#006c4a] flex items-center justify-center font-bold">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#0b1c30]">
                  Folder: {selectedDeptFolder}
                </h3>
                <span className="text-[10px] bg-[#82f5c1]/50 text-[#005137] px-2 py-0.5 rounded font-bold">
                  Single Nodal Jurisdiction
                </span>
              </div>
              <p className="text-xs text-[#76777d] mt-0.5">
                Exclusive routing node • Nodal In-Charge: <strong>{DEPARTMENT_SUMMARIES.find(d => d.name === selectedDeptFolder)?.officerInCharge || 'Assigned Officer'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#45464d]">
              SLA: <strong>{DEPARTMENT_SUMMARIES.find(d => d.name === selectedDeptFolder)?.resolutionSla || '48h'}</strong>
            </span>
            <span className="text-[#45464d]">
              Helpline: <strong>{DEPARTMENT_SUMMARIES.find(d => d.name === selectedDeptFolder)?.contactPhone || '011-23348890'}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Department Problems Section with Working Reply Tab (Solved, Unseen, In Progress) */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#c6c6cd]/40 shadow-xs overflow-hidden">
        {/* Department Problems Filter Tabs Header */}
        <div className="p-4 border-b border-[#c6c6cd]/30 bg-[#f8f9ff] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm md:text-base font-bold text-[#0b1c30] flex items-center gap-2">
              <span>Department Problems & Response Workspace</span>
            </h3>
            <p className="text-xs text-[#76777d]">
              Review complaint location, problem dossier, and issue verified government replies.
            </p>
          </div>

          {/* Status Tabs: All, Unseen, In Progress, Solved */}
          <div className="flex items-center bg-white border border-[#c6c6cd]/40 p-1 rounded-xl shadow-2xs gap-1">
            <button
              type="button"
              id="filter-status-all"
              onClick={() => setProblemStatusTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                problemStatusTab === 'all'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'text-[#45464d] hover:bg-[#eff4ff]'
              }`}
            >
              All ({deptFilteredCases.length})
            </button>

            <button
              type="button"
              id="filter-status-unseen"
              onClick={() => setProblemStatusTab('unseen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                problemStatusTab === 'unseen'
                  ? 'bg-[#ba1a1a] text-white shadow-xs'
                  : 'text-[#ba1a1a] hover:bg-[#ffdad6]/50'
              }`}
            >
              <BadgeAlert className="w-3.5 h-3.5" />
              <span>Unseen ({unseenCount})</span>
            </button>

            <button
              type="button"
              id="filter-status-in-progress"
              onClick={() => setProblemStatusTab('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                problemStatusTab === 'in_progress'
                  ? 'bg-[#0b1c30] text-white shadow-xs'
                  : 'text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#497cff]" />
              <span>In Progress ({inProgressCount})</span>
            </button>

            <button
              type="button"
              id="filter-status-solved"
              onClick={() => setProblemStatusTab('solved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                problemStatusTab === 'solved'
                  ? 'bg-[#006c4a] text-white shadow-xs'
                  : 'text-[#006c4a] hover:bg-[#82f5c1]/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Solved ({solvedCount})</span>
            </button>
          </div>
        </div>

        {/* Problems List with Location, Problem Dossier, and Working Reply Tab */}
        <div className="p-4 md:p-6 space-y-4">
          {displayedCases.length === 0 ? (
            <div className="py-16 text-center text-[#76777d]">
              <FileCheck2 className="w-10 h-10 text-[#006c4a] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[#0b1c30]">
                No {problemStatusTab !== 'all' ? `"${problemStatusTab}"` : ''} problems found in this folder.
              </p>
              <p className="text-xs mt-1">
                All cases under this status filter have been attended to or moved to subsequent stages.
              </p>
            </div>
          ) : (
            displayedCases.map((item) => {
              const statusBucket = getProblemStatusBucket(item);
              const isReplying = activeReplyId === item.id;
              const hasReplies = item.officialReplies && item.officialReplies.length > 0;
              const isMapPreviewOpen = activeMapPreviewId === item.id;

              return (
                <div
                  key={item.id}
                  id={`problem-card-${item.id}`}
                  className="bg-white rounded-2xl border border-[#c6c6cd]/50 shadow-2xs hover:border-[#000000]/40 transition-all p-4 md:p-5 flex flex-col gap-4"
                >
                  {/* Top Header Row: ID, Department, and Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c6c6cd]/20 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0b1c30] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c6c6cd]/30">
                        {item.id}
                      </span>
                      <span className="text-xs font-semibold text-[#45464d]">
                        {item.department}
                      </span>
                      <span className="text-[10px] font-bold text-[#76777d]">
                        • {item.submittedAt}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        statusBucket === 'solved'
                          ? 'bg-[#82f5c1]/50 text-[#005137] border border-[#006c4a]/30'
                          : statusBucket === 'in_progress'
                          ? 'bg-[#e5eeff] text-[#0b1c30] border border-[#497cff]/30'
                          : 'bg-[#ffdad6] text-[#93000a] border border-[#ffb4ab]'
                      }`}>
                        {statusBucket === 'solved' && <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a]" />}
                        {statusBucket === 'in_progress' && <Clock className="w-3.5 h-3.5 text-[#497cff]" />}
                        {statusBucket === 'unseen' && <BadgeAlert className="w-3.5 h-3.5 text-[#ba1a1a]" />}
                        <span>{statusBucket === 'solved' ? 'Solved' : statusBucket === 'in_progress' ? 'In Progress' : 'Unseen'}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.priority === 'High' || item.priority === 'Urgent'
                          ? 'bg-[#ffdad6] text-[#93000a]'
                          : 'bg-[#f1f3f9] text-[#45464d]'
                      }`}>
                        {item.priority} Priority
                      </span>
                    </div>
                  </div>

                  {/* Main Grid: Problem Description & Physical Location */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* The Problem (Col 7) */}
                    <div className="lg:col-span-7 space-y-2">
                      <h4 className="font-bold text-base text-[#0b1c30] leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs md:text-sm text-[#45464d] leading-relaxed bg-[#f8f9ff] p-3 rounded-xl border border-[#c6c6cd]/30">
                        {item.description}
                      </p>

                      {item.englishTranslation && item.detectedLanguage !== 'English' && (
                        <div className="text-xs text-[#0b1c30] bg-[#eff4ff] p-2.5 rounded-xl border border-[#497cff]/20">
                          <span className="font-bold text-[#497cff] block text-[10px] uppercase">
                            AI Translation ({item.detectedLanguage})
                          </span>
                          <span className="italic">{item.englishTranslation}</span>
                        </div>
                      )}

                      {/* Photo Attachment if available */}
                      {item.attachments && item.attachments.length > 0 && item.attachments[0].url && (
                        <div className="flex items-center gap-2 pt-1">
                          <img
                            src={item.attachments[0].url}
                            alt="Citizen problem photo"
                            className="w-16 h-16 rounded-xl object-cover border border-[#c6c6cd]/40"
                          />
                          <div className="text-[11px] text-[#45464d]">
                            <span className="font-bold block text-[#0b1c30]">Evidence Media</span>
                            <span>{item.attachments[0].name}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* The Location (Col 5) */}
                    <div className="lg:col-span-5 flex flex-col justify-between bg-[#f8f9ff] p-3.5 rounded-xl border border-[#c6c6cd]/40 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-[#006c4a] uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#006c4a]" />
                            <span>Incident Location</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#76777d]">
                            {item.location?.lat?.toFixed(4)}, {item.location?.lng?.toFixed(4)}
                          </span>
                        </div>

                        <div className="font-bold text-[#0b1c30] text-xs">
                          {item.location?.name || 'Central Ward Sector'}
                        </div>
                        <div className="text-[#45464d] text-[11px] mt-0.5 leading-snug">
                          {item.location?.address || `${item.location?.zone || 'Zone 4'}, ${item.location?.ward || 'Ward 12'}, Capital Territory`}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#76777d]">
                          <span className="bg-white px-2 py-0.5 rounded border border-[#c6c6cd]/30 font-medium">
                            {item.location?.zone || 'Zone 4'}
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-[#c6c6cd]/30 font-medium">
                            {item.location?.ward || 'Ward 12'}
                          </span>
                        </div>
                      </div>

                      {/* Map Location Preview Button */}
                      <div className="mt-3 pt-2 border-t border-[#c6c6cd]/20 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setActiveMapPreviewId(isMapPreviewOpen ? null : item.id)}
                          className="text-[#006c4a] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{isMapPreviewOpen ? 'Hide GPS Map' : 'View GPS Map Pin'}</span>
                        </button>

                        <span className="text-[10px] text-[#76777d]">
                          Reported by: {item.citizenName || item.citizenUid}
                        </span>
                      </div>

                      {/* Interactive OpenStreetMap Pin Embed */}
                      {isMapPreviewOpen && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-[#c6c6cd]/40">
                          <iframe
                            title={`Map for ${item.id}`}
                            width="100%"
                            height="130"
                            frameBorder="0"
                            scrolling="no"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(item.location?.lng || 77.2090) - 0.005}%2C${(item.location?.lat || 28.6139) - 0.005}%2C${(item.location?.lng || 77.2090) + 0.005}%2C${(item.location?.lat || 28.6139) + 0.005}&layer=mapnik&marker=${item.location?.lat || 28.6139}%2C${item.location?.lng || 77.2090}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Past Government Replies History (if any) */}
                  {hasReplies && (
                    <div className="mt-1 bg-[#eff4ff]/60 rounded-xl p-3 border border-[#497cff]/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0b1c30]">
                        <span className="flex items-center gap-1.5 text-[#006c4a]">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Official Government Communique & Replies ({item.officialReplies?.length})</span>
                        </span>
                        <span className="text-[10px] text-[#76777d]">
                          Verified Municipality Channel
                        </span>
                      </div>

                      <div className="space-y-2">
                        {item.officialReplies?.map((rep) => (
                          <div 
                            key={rep.id} 
                            className="bg-white p-3 rounded-lg border border-[#c6c6cd]/30 text-xs shadow-2xs flex flex-col gap-1"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[#497cff]" />
                                <span>{rep.officerName}</span>
                                {rep.securityCode && (
                                  <span className="font-mono text-[10px] bg-[#000000] text-[#82f5c1] px-1.5 py-0.2 rounded">
                                    {rep.securityCode}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-[#76777d]">{rep.timestamp}</span>
                            </div>
                            <p className="text-[#45464d] mt-1 leading-relaxed">
                              {rep.replyText}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[10px] font-bold text-[#006c4a] bg-[#82f5c1]/30 px-2 py-0.5 rounded">
                                Status Set: {rep.statusSet === 'solved' ? 'Solved' : rep.statusSet === 'in_progress' ? 'In Progress' : 'Unseen'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* The Working Reply Tab / Console for Government Employee */}
                  <div className="pt-2 border-t border-[#c6c6cd]/30 flex flex-col gap-3">
                    {!isReplying ? (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isGovernmentEmployee ? (
                            <button
                              type="button"
                              id={`reply-btn-${item.id}`}
                              onClick={() => handleStartReply(item)}
                              className="py-2 px-4 rounded-xl bg-[#000000] hover:bg-[#131b2e] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#82f5c1]" />
                              <span>{hasReplies ? 'Post Follow-up Municipal Reply' : 'Open Reply Tab & Update Status'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={onRequestLogin}
                              className="py-2 px-3.5 rounded-xl bg-[#eff4ff] hover:bg-[#d3e4fe] text-[#0b1c30] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-[#c6c6cd]/40"
                            >
                              <Lock className="w-3.5 h-3.5 text-[#76777d]" />
                              <span>Login with Security Code to Reply</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenCase(item.id)}
                          className="text-xs font-bold text-[#006c4a] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Full Grievance Audit History</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Active Reply Console */
                      <form
                        onSubmit={(e) => handleSubmitReply(e, item.id)}
                        className="bg-[#f8f9ff] p-4 rounded-2xl border-2 border-[#000000] space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-[#c6c6cd]/30 pb-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#006c4a]" />
                            <span className="text-xs font-bold text-[#0b1c30]">
                              Official Municipal Reply Console ({currentUser?.name || 'Officer'} • {currentUser?.uniqueSecurityCode || 'GOV-2026-MUNI'})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="text-xs text-[#76777d] hover:text-[#0b1c30] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Working Reply Status Selector: Unseen, In Progress, Solved */}
                        <div>
                          <label className="text-[11px] font-bold text-[#0b1c30] uppercase tracking-wider block mb-1.5">
                            Set Problem Status To:
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              id={`set-unseen-${item.id}`}
                              onClick={() => setStatusChoice('unseen')}
                              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                statusChoice === 'unseen'
                                  ? 'bg-[#ffdad6] text-[#93000a] border-[#ffb4ab] ring-2 ring-[#ba1a1a]/20'
                                  : 'bg-white text-[#45464d] border-[#c6c6cd]/40 hover:bg-[#ffdad6]/40'
                              }`}
                            >
                              <BadgeAlert className="w-3.5 h-3.5" />
                              <span>1. Unseen / Open</span>
                            </button>

                            <button
                              type="button"
                              id={`set-inprogress-${item.id}`}
                              onClick={() => setStatusChoice('in_progress')}
                              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                statusChoice === 'in_progress'
                                  ? 'bg-[#0b1c30] text-white border-[#0b1c30] ring-2 ring-[#0b1c30]/20'
                                  : 'bg-white text-[#45464d] border-[#c6c6cd]/40 hover:bg-[#eff4ff]'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5 text-[#497cff]" />
                              <span>2. In Progress</span>
                            </button>

                            <button
                              type="button"
                              id={`set-solved-${item.id}`}
                              onClick={() => setStatusChoice('solved')}
                              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                statusChoice === 'solved'
                                  ? 'bg-[#006c4a] text-white border-[#006c4a] ring-2 ring-[#006c4a]/20'
                                  : 'bg-white text-[#45464d] border-[#c6c6cd]/40 hover:bg-[#82f5c1]/30'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#82f5c1]" />
                              <span>3. Solved / Closed</span>
                            </button>
                          </div>
                        </div>

                        {/* Reply Text Field */}
                        <div>
                          <label className="text-[11px] font-bold text-[#0b1c30] uppercase tracking-wider block mb-1">
                            Government Employee Official Response Note:
                          </label>
                          <textarea
                            id={`reply-textarea-${item.id}`}
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type municipal response to citizen (e.g. team dispatched, pipeline repaired, light replaced)..."
                            required
                            className="w-full p-3 bg-white border border-[#c6c6cd]/60 rounded-xl text-xs font-medium text-[#0b1c30] focus:border-[#000000] focus:ring-1 focus:ring-[#000000] outline-none shadow-2xs"
                          />
                        </div>

                        {/* Quick Presets */}
                        <div>
                          <span className="text-[10px] text-[#76777d] font-bold uppercase block mb-1">
                            Quick Official Templates:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {quickReplyPresets.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setReplyText(preset)}
                                className="text-[10px] bg-white hover:bg-[#eff4ff] text-[#0b1c30] px-2.5 py-1 rounded-lg border border-[#c6c6cd]/40 transition-colors cursor-pointer"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Submit Action */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="py-2 px-3 text-xs font-semibold text-[#45464d] hover:text-[#000000] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            id={`submit-reply-${item.id}`}
                            disabled={isSubmittingReply || !replyText.trim()}
                            className="py-2.5 px-4 bg-[#000000] hover:bg-[#131b2e] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-[#82f5c1]" />
                            <span>Publish Official Reply & Apply Status</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
