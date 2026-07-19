import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DirectoryDashboard from './components/DirectoryDashboard';
import IdCardPrinter from './components/IdCardPrinter';
import { SacramentClergyVerification } from './components/SacramentClergyVerification';
import { UnifiedLoginPage } from './components/UnifiedLoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ThemeProvider } from './components/common/ThemeProvider';
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { ServicesPage } from './pages/public/ServicesPage';
import { AnnouncementsPage } from './pages/public/AnnouncementsPage';
import { PrayerRequestPage } from './pages/public/PrayerRequestPage';
import { ContactPage } from './pages/public/ContactPage';
import { RegistrationPage } from './pages/public/RegistrationPage';
import { MemberProfilePage } from './pages/member/MemberProfilePage';
import { PriestsListPage } from './pages/member/PriestsListPage';
import { RequestStatusPage } from './pages/member/RequestStatusPage';
import { PriestAssignmentPanel } from './pages/priest/PriestAssignmentPanel';
// Phase 3 — Appointment Management
import { BookAppointmentPage } from './pages/member/BookAppointmentPage';
import { MyAppointmentsPage } from './pages/member/MyAppointmentsPage';
import { PriestAppointmentsPage } from './pages/priest/PriestAppointmentsPage';
// Phase 2.2 — Church Hierarchy Admin
import { ChurchManagementPage } from './pages/admin/ChurchManagementPage';

import { LiturgicalCalendarPanel } from './components/LiturgicalCalendarPanel';
import { AlmsPaymentPanel } from './components/AlmsPaymentPanel';
import { PaymentHistoryPanel } from './components/PaymentHistoryPanel';
import { ClergyVerificationPanel } from './components/ClergyVerificationPanel';
import { QaleGubaeMinutesPanel } from './components/QaleGubaeMinutesPanel';
import { SebekaGubaeSeatsPanel } from './components/SebekaGubaeSeatsPanel';
import { RelicsEstatesLedgerPanel } from './components/RelicsEstatesLedgerPanel';
import { SealVaultPanel } from './components/SealVaultPanel';
import { FollowerCrmPanel } from './components/FollowerCrmPanel';
import { DatabaseControlPanel } from './components/DatabaseControlPanel';
import { OnboardingWizard } from './components/OnboardingWizard';
import { AppointmentBookingPanel } from './components/AppointmentBookingPanel';
import { PriestAppointmentsPanel } from './components/PriestAppointmentsPanel';
import { DualAuthApprovalPanel } from './components/DualAuthApprovalPanel';
import {
  LogOut,
  CreditCard,
  BookOpen,
  Calendar,
  Users,
  FileText,
  Shield,
  ShieldCheck,
  ScrollText,
  Activity,
  Lock,
  Database,
  MapPin,
} from 'lucide-react';

// ─── Shared Layout Shell ──────────────────────────────────────────────────────

// Maps backend ecclesiasticalRole to display strings
const ROLE_DISPLAY: Record<string, { en: string; am: string }> = {
  PATRIARCH:     { en: 'Patriarch',      am: 'ፓትርያርክ' },
  ARCHBISHOP:    { en: 'Archbishop',     am: 'ሊቀ ጳጳሳት' },
  BISHOP:        { en: 'Bishop',         am: 'ጳጳስ' },
  ARCHPRIEST:    { en: 'Archpriest',     am: 'ሊቀ ካህናት' },
  PRIEST:        { en: 'Priest',         am: 'ካህን' },
  DEACON:        { en: 'Deacon',         am: 'ዲያቆን' },
  TREASURER:     { en: 'Treasurer',      am: 'ግምጃ ቤት' },
  SECRETARY:     { en: 'Secretary',      am: 'ጸሐፊ' },
  LAITY:         { en: 'Congregation Member', am: 'ምእመን' },
  CHOIR_MASTER:  { en: 'Choir Master',   am: 'ዘማሪ' },
  SYSTEM_ADMIN:  { en: 'System Admin',   am: 'አስተዳዳሪ' },
};

// Roles that get the Clergy Administration Portal
const CLERGY_ROLES = new Set([
  'PATRIARCH', 'ARCHBISHOP', 'BISHOP', 'ARCHPRIEST', 'PRIEST',
  'DEACON', 'SECRETARY', 'CHOIR_MASTER', 'TREASURER', 'SYSTEM_ADMIN'
]);

interface PortalShellProps {
  children: React.ReactNode;
}

function PortalShell({ children }: PortalShellProps) {
  const { clearAuth, fullName, ecclesiasticalRole } = useAuth();
  const navigate = useNavigate();

  const roleDisplay = ROLE_DISPLAY[ecclesiasticalRole] ?? { en: ecclesiasticalRole, am: '' };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0809', color: '#F2EEEE' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          background: 'linear-gradient(135deg, #800020 0%, #651A67 60%, #4A154B 100%)',
          borderBottom: '3px solid #D4AF37',
        }}
        className="sticky top-0 z-40 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 text-lg shadow-inner"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)', borderColor: '#D4AF37' }}
            >
              ⛪
            </div>
            <div>
              <p className="text-white font-extrabold text-sm tracking-wide leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                ደብረ ብርሃን መድኃኔዓለም
              </p>
              <p className="text-[10px] font-semibold tracking-wider" style={{ color: '#D4AF37' }}>
                ቤተ ክርስቲያን &bull; {roleDisplay.en} &bull; {roleDisplay.am}
              </p>
            </div>
          </div>

          {/* User context + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-white text-xs font-bold">{fullName}</span>
              <span className="text-[10px]" style={{ color: '#D4AF37' }}>{roleDisplay.en}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border transition cursor-pointer"
              style={{ borderColor: 'rgba(212,175,55,0.5)', color: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D4AF37';
                (e.currentTarget as HTMLButtonElement).style.color = '#4A154B';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(212,175,55,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = '#D4AF37';
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-4 text-center text-xs"
        style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'rgba(0,0,0,0.4)', color: '#6B7280' }}
      >
        ☩ ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን &bull; OrthodoxConnect &bull; ኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
      </footer>
    </div>
  );
}

// ─── Tab helper ───────────────────────────────────────────────────────────────

interface TabDef { id: string; label: string; icon: React.ReactNode; }

function DashTabs({ tabs, active, onSelect }: { tabs: TabDef[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 p-1 rounded-xl border" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'var(--eotc-border)' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            active === t.id ? 'text-[#0a0809]' : 'opacity-60 hover:opacity-100'
          }`}
          style={{ backgroundColor: active === t.id ? 'var(--eotc-gold)' : 'transparent', color: active === t.id ? '#0a0809' : 'inherit' }}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

// ─── FOLLOWER DASHBOARD ───────────────────────────────────────────────────────

function FollowerDashboard() {
  const [tab, setTab] = useState('calendar');
  const { fullName, institution } = useAuth();
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const parishName = institution?.nameAm || institution?.nameEn || 'ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን';

  const tabs: TabDef[] = [
    { id: 'calendar',   label: 'Liturgical Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'appointments', label: 'Book Appointment',   icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'payment',    label: 'Pay Tithes & Alms',   icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: 'history',    label: 'Payment History',      icon: <ScrollText className="w-3.5 h-3.5" /> },
    { id: 'sacraments', label: 'Sacramental Records',  icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'directory',  label: 'Parish Directory',     icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <PortalShell>
      <div
        className="rounded-2xl p-6 mb-6 relative overflow-hidden shadow-md"
        style={{ background: 'linear-gradient(135deg, #800020 0%, #651A67 100%)', borderBottom: '3px solid #D4AF37' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 rounded-full -mr-16 -mt-16" style={{ backgroundColor: '#D4AF37' }} />
        <div className="relative z-10">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#D4AF37' }}>{greeting}, {fullName || 'ወንድም / እህት'}</p>
          <h1 className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>ምእምናን መተግበሪያ</h1>
          <p className="text-sm text-purple-200">{parishName}</p>
        </div>
      </div>

      <DashTabs tabs={tabs} active={tab} onSelect={setTab} />

      {tab === 'calendar'     && <LiturgicalCalendarPanel />}
      {tab === 'appointments' && <AppointmentBookingPanel />}
      {tab === 'payment'      && <AlmsPaymentPanel />}
      {tab === 'history'      && <PaymentHistoryPanel />}
      {tab === 'sacraments'   && <SacramentClergyVerification />}
      {tab === 'directory'    && <DirectoryDashboard />}
    </PortalShell>
  );
}

// ─── CLERGY DASHBOARD ────────────────────────────────────────────────────────

function ClergyDashboard() {
  const { fullName, institution, ecclesiasticalRole } = useAuth();
  const parishName = institution?.nameAm || institution?.nameEn || 'ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን';
  const roleDisplay = ROLE_DISPLAY[ecclesiasticalRole] ?? { en: ecclesiasticalRole, am: '' };

  // Treasurer gets a financial-focused view
  const isTreasurer = ecclesiasticalRole === 'TREASURER';
  const defaultTab = isTreasurer ? 'payment' : 'verify';
  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabs: TabDef[] = isTreasurer ? [
    { id: 'directory',  label: 'Parish Directory',     icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'payment',    label: 'Tithe Ledger',          icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: 'history',    label: 'Payment History',       icon: <ScrollText className="w-3.5 h-3.5" /> },
    { id: 'calendar',   label: 'Liturgical Calendar',   icon: <Calendar className="w-3.5 h-3.5" /> },
  ] : [
    { id: 'verify',     label: 'Clergy Verification',  icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'approvals',  label: 'Dual-Auth Approvals',  icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'minutes',    label: 'Council Minutes',       icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'seats',      label: 'Sebeka Seats',          icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'relics',     label: 'Relics & Estates',      icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'vault',      label: 'Seal Vault',            icon: <Lock className="w-3.5 h-3.5" /> },
    { id: 'crm',        label: 'Spiritual Children',    icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'appointments', label: 'Confession Queue',    icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'sacraments', label: 'Sacramental Registry',  icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'directory',  label: 'Parish Directory',      icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'calendar',   label: 'Liturgical Calendar',   icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'db',         label: 'DB Control',            icon: <Database className="w-3.5 h-3.5" /> },
  ];

  return (
    <PortalShell>
      <div
        className="rounded-2xl p-6 mb-6 relative overflow-hidden shadow-md"
        style={{ background: 'linear-gradient(135deg, #4A154B 0%, #800020 100%)', borderBottom: '3px solid #D4AF37' }}
      >
        <div className="absolute top-0 right-0 w-56 h-56 opacity-10 rounded-full -mr-20 -mt-20" style={{ backgroundColor: '#D4AF37' }} />
        <div className="relative z-10">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#D4AF37' }}>☩ {roleDisplay.en} — {fullName}</p>
          <h1 className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>ካህናት ፐርታል</h1>
          <p className="text-sm text-purple-200">{parishName} &bull; {roleDisplay.am}</p>
        </div>
      </div>

      <DashTabs tabs={tabs} active={activeTab} onSelect={setActiveTab} />

      {activeTab === 'verify'       && <ClergyVerificationPanel />}
      {activeTab === 'approvals'    && <DualAuthApprovalPanel />}
      {activeTab === 'minutes'      && <QaleGubaeMinutesPanel />}
      {activeTab === 'seats'        && <SebekaGubaeSeatsPanel />}
      {activeTab === 'relics'       && <RelicsEstatesLedgerPanel />}
      {activeTab === 'vault'        && <SealVaultPanel />}
      {activeTab === 'crm'          && <FollowerCrmPanel />}
      {activeTab === 'appointments' && <PriestAppointmentsPanel />}
      {activeTab === 'sacraments'   && <SacramentClergyVerification />}
      {activeTab === 'directory'    && <DirectoryDashboard />}
      {activeTab === 'calendar'     && <LiturgicalCalendarPanel />}
      {activeTab === 'db'           && <DatabaseControlPanel />}
      {activeTab === 'payment'      && <AlmsPaymentPanel />}
      {activeTab === 'history'      && <PaymentHistoryPanel />}
    </PortalShell>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

function CanonicalLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4"
      style={{ backgroundColor: '#0a0809', color: '#D4AF37' }}
    >
      <div
        className="w-14 h-14 rounded-full border-4 animate-spin"
        style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}
      />
      <p className="text-sm font-bold tracking-wider" style={{ fontFamily: "'Playfair Display', serif", color: '#F2EEEE' }}>
        Initializing Canonical Registry…
      </p>
      <p className="text-xs" style={{ color: '#D4AF37' }}>
        ደብረ ብርሃን መድኃኔዓለም &bull; OrthodoxConnect
      </p>
    </div>
  );
}

// ─── Main App Router ──────────────────────────────────────────────────────────

// Role-aware app shell: selects the correct dashboard based on ecclesiastical role
function RoleAwareAppShell() {
  const { ecclesiasticalRole } = useAuth();
  return CLERGY_ROLES.has(ecclesiasticalRole) ? <ClergyDashboard /> : <FollowerDashboard />;
}

function MainApp() {
  const { loading, token } = useAuth();

  // Show canonical loader while restoring session from localStorage
  if (loading) return <CanonicalLoader />;

  return (
    <Router>
      <Routes>
        {/* Public Website Pages (Amharic) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/prayer-request" element={<PrayerRequestPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Phase 2 — Registration and Spiritual Father Workflow */}
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/member/profile" element={<MemberProfilePage />} />
        <Route path="/member/priests" element={<PriestsListPage />} />
        <Route path="/member/request-status" element={<RequestStatusPage />} />
        <Route path="/priest/assignments" element={<PriestAssignmentPanel />} />

        {/* Phase 3 — Appointment Management */}
        <Route path="/member/book-appointment" element={<BookAppointmentPage />} />
        <Route path="/member/my-appointments" element={<MyAppointmentsPage />} />
        <Route path="/priest/appointments" element={<PriestAppointmentsPage />} />

        {/* Phase 2.2 — Church Hierarchy Administration */}
        <Route path="/admin/churches" element={<ProtectedRoute><ChurchManagementPage /></ProtectedRoute>} />

        {/* Login — redirect to app if already authenticated */}

        <Route
          path="/login"
          element={token ? <Navigate to="/app/dashboard" replace /> : <UnifiedLoginPage />}
        />

        {/* Legacy redirect: old dashboard paths → new unified path */}
        <Route path="/dashboard/*" element={token ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/login" replace />} />

        {/* Directory — public for now, auth check enforced by backend */}
        <Route path="/directory" element={<DirectoryDashboard />} />

        {/* Unified authenticated app shell with RBAC-aware routing */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <RoleAwareAppShell />
            </ProtectedRoute>
          }
        />

        {/* Protected Operational Wizards */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
        <Route path="/idcard/:id" element={<ProtectedRoute><IdCardPrinter /></ProtectedRoute>} />
        <Route path="/sacraments" element={<ProtectedRoute><SacramentClergyVerification /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
