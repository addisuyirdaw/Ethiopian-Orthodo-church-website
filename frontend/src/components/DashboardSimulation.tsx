import React, { useState, useMemo } from 'react';
import { gregorianToEthiopian } from '../utils/calendarConverter';
import {
  Shield,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  Printer,
  Search,
  Activity,
  Clock,
  AlertTriangle,
  X,
  CreditCard,
  Building,
  RefreshCw,
  TrendingUp,
  FileCheck
} from 'lucide-react';

// Strict TypeScript Interfaces
export interface ClergyProfile {
  id: string;
  name: string;
  role: string;
  parish: string;
}

export interface FollowerProfile {
  id: string;
  name: string;
  baptismName: string;
  confessionalFatherId: string;
  status: 'Active Contributor' | 'Pending Review';
  email: string;
  phone: string;
}

export interface TitheRecord {
  id: string;
  followerId: string;
  amount: number;
  referenceNumber: string;
  channel: 'Telebirr' | 'CBE Birr' | 'Bank Deposit' | 'Cash Receipt';
  gregorianDate: string;
  ethiopianDate: string;
}

export interface LiturgicalSchedule {
  id: string;
  date: string;
  time: string;
  liturgyType: string;
  servingPriestId: string;
}

export interface MeetingMinute {
  id: string;
  minuteNumber: string;
  meetingDate: string;
  discussionTopic: string;
  resolutionsPassed: string;
  recordedById: string;
  signatureHash: string;
}

export interface AssetRecord {
  id: string;
  name: string;
  category: string;
  status: 'Good' | 'Needs Repair' | 'Archived';
  assignedTo: string;
}

// Seeded Relational Datasets
const INITIAL_CLERGY: ClergyProfile[] = [
  {
    id: 'CL-701',
    name: 'Aba Wolde Harrison',
    role: 'Parish Priest',
    parish: 'ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን'
  },
  {
    id: 'CL-702',
    name: 'Qesis Melaku Berhan',
    role: 'Assistant Priest',
    parish: 'ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን'
  }
];

const INITIAL_FOLLOWERS: FollowerProfile[] = [
  {
    id: 'FL-101',
    name: 'Samuel Kassa',
    baptismName: 'Hailemariam',
    confessionalFatherId: 'CL-701',
    status: 'Active Contributor',
    email: 'samuel.kassa@orthodoxconnect.et',
    phone: '+251911223344'
  },
  {
    id: 'FL-102',
    name: 'Helen Tesfaye',
    baptismName: 'Walatta Maryam',
    confessionalFatherId: 'CL-701',
    status: 'Active Contributor',
    email: 'helen.tesfaye@orthodoxconnect.et',
    phone: '+251912345678'
  },
  {
    id: 'FL-103',
    name: 'Selamawit Alemu',
    baptismName: 'Walatta Kidusan',
    confessionalFatherId: 'CL-702',
    status: 'Pending Review',
    email: 'selamawit.alemu@orthodoxconnect.et',
    phone: '+251913456789'
  }
];

const INITIAL_TITHES: TitheRecord[] = [
  {
    id: 'TXN-882910',
    followerId: 'FL-101',
    amount: 1500,
    referenceNumber: 'TXN-882910',
    channel: 'Telebirr',
    gregorianDate: '2026-05-10',
    ethiopianDate: 'Genbot 2, 2018 á‹“.áˆ.'
  },
  {
    id: 'TXN-991283',
    followerId: 'FL-102',
    amount: 3000,
    referenceNumber: 'TXN-991283',
    channel: 'CBE Birr',
    gregorianDate: '2026-06-15',
    ethiopianDate: 'Sene 8, 2018 á‹“.áˆ.'
  },
  {
    id: 'TXN-773829',
    followerId: 'FL-101',
    amount: 2000,
    referenceNumber: 'TXN-773829',
    channel: 'Bank Deposit',
    gregorianDate: '2026-07-01',
    ethiopianDate: 'Sene 24, 2018 á‹“.áˆ.'
  }
];

const INITIAL_SCHEDULES: LiturgicalSchedule[] = [
  {
    id: 'SCH-1',
    date: '2026-07-19',
    time: '05:00 AM',
    liturgyType: 'Divine Liturgy (á‰…á‹³áˆ´)',
    servingPriestId: 'CL-701'
  },
  {
    id: 'SCH-2',
    date: '2026-07-23',
    time: '06:00 AM',
    liturgyType: 'Kidane (áŠªá‹³áŠ•)',
    servingPriestId: 'CL-702'
  }
];

const INITIAL_MINUTES: MeetingMinute[] = [
  {
    id: 'MIN-001',
    minuteNumber: 'MIN-2026-04',
    meetingDate: '2026-07-10',
    discussionTopic: 'Preparing for the Feast of Savior of the World (Debre Berhan)',
    resolutionsPassed: 'Approved procurement of liturgical carpets and set security taskforce roles.',
    recordedById: 'CL-701',
    signatureHash: '4a0f8b9e2c4d8e7a6b5c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a'
  }
];

const INITIAL_ASSETS: AssetRecord[] = [
  { id: 'AST-001', name: 'Parish Hall Sound System', category: 'Audio', status: 'Good', assignedTo: 'Diocese Laity Council' },
  { id: 'AST-002', name: 'Holy Communion Liturgical Vessels', category: 'Liturgical Sacra', status: 'Good', assignedTo: 'Sacristan Deacons' },
  { id: 'AST-003', name: 'Parish Office Archival Computers', category: 'Office', status: 'Needs Repair', assignedTo: 'Secretary Office' }
];

export default function DashboardSimulation() {
  // Global States (Simulating Vertical Data Infrastructure / Anti-Gravity Flow)
  const [followers, setFollowers] = useState<FollowerProfile[]>(INITIAL_FOLLOWERS);
  const [tithes, setTithes] = useState<TitheRecord[]>(INITIAL_TITHES);
  const [schedules, setSchedules] = useState<LiturgicalSchedule[]>(INITIAL_SCHEDULES);
  const [minutes, setMinutes] = useState<MeetingMinute[]>(INITIAL_MINUTES);
  const [assets, setAssets] = useState<AssetRecord[]>(INITIAL_ASSETS);

  // Simulation states
  const [viewMode, setViewMode] = useState<'LANDING' | 'PORTAL'>('LANDING');
  const [activeRole, setActiveRole] = useState<'PATRIARCH' | 'CHAIRPERSON' | 'DEPUTY_CHAIRPERSON' | 'SECRETARY' | 'PRIEST' | 'FOLLOWER'>('PATRIARCH');

  // Interactive UI Focus States
  const [activeFollowerId, setActiveFollowerId] = useState<string>('FL-101');
  const [activePriestId, setActivePriestId] = useState<string>('CL-701');

  // Dual-Auth Sign-offs (Laity / Clergy power balance under Qale Awadi)
  const [chairSignOff, setChairSignOff] = useState<boolean>(false);
  const [deputySignOff, setDeputySignOff] = useState<boolean>(false);

  // Archival Receipt Engine Modal
  const [selectedReceipt, setSelectedReceipt] = useState<TitheRecord | null>(null);

  // Search Filters
  const [followerSearch, setFollowerSearch] = useState<string>('');
  const [priestSearch, setPriestSearch] = useState<string>('');

  // Form inputs
  const [titheAmount, setTitheAmount] = useState<string>('');
  const [titheChannel, setTitheChannel] = useState<'Telebirr' | 'CBE Birr' | 'Bank Deposit' | 'Cash Receipt'>('Telebirr');
  const [titheDate, setTitheDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [titheRef, setTitheRef] = useState<string>('');

  const [schedDate, setSchedDate] = useState<string>('2026-07-26');
  const [schedTime, setSchedTime] = useState<string>('05:00 AM');
  const [schedType, setSchedType] = useState<string>('Divine Liturgy (á‰…á‹³áˆ´)');
  const [schedPriest, setSchedPriest] = useState<string>('CL-701');

  const [minNum, setMinNum] = useState<string>('');
  const [minDate, setMinDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [minTopic, setMinTopic] = useState<string>('');
  const [minResolutions, setMinResolutions] = useState<string>('');

  const [newFollowerName, setNewFollowerName] = useState<string>('');
  const [newFollowerBaptism, setNewFollowerBaptism] = useState<string>('');
  const [newFollowerEmail, setNewFollowerEmail] = useState<string>('');
  const [newFollowerPhone, setNewFollowerPhone] = useState<string>('');
  const [newFollowerPriest, setNewFollowerPriest] = useState<string>('CL-701');

  // Date conversion helper (Converts Gregorian Date string "YYYY-MM-DD" to Ethiopian formatted string)
  const calculateEthiopianDate = (gregorianDateStr: string): string => {
    try {
      const dateParts = gregorianDateStr.split('-');
      if (dateParts.length !== 3) return 'áˆ˜áˆµáŠ¨áˆ¨áˆ 1, 2019 á‹“.áˆ.';
      const y = parseInt(dateParts[0], 10);
      const m = parseInt(dateParts[1], 10);
      const d = parseInt(dateParts[2], 10);
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      const ethDateRaw = gregorianToEthiopian(dateObj); // "DD/MM/YYYY"
      const [ethDay, ethMonth, ethYear] = ethDateRaw.split('/');

      const ETHIOPIAN_MONTHS = [
        'áˆ˜áˆµáŠ¨áˆ¨áˆ', 'áŒ¥á‰…áˆá‰µ', 'áŠ…á‹³áˆ­', 'á‰³áŠ…áˆ£áˆ¥', 'áŒ¥áˆ­', 'á‹¨áŠ«á‰²á‰µ',
        'áˆ˜áŒ‹á‰¢á‰µ', 'áˆšá‹«á‹á‹«', 'áŒáŠ•á‰¦á‰µ', 'áˆ°áŠ”', 'áˆáˆáˆŒ', 'áŠáˆáˆ´', 'áŒ³áŒ‰áˆœ'
      ];
      const monthIndex = parseInt(ethMonth, 10) - 1;
      const monthName = ETHIOPIAN_MONTHS[monthIndex] || 'áˆ˜áˆµáŠ¨áˆ¨áˆ';
      return `${monthName} ${parseInt(ethDay, 10)}, ${ethYear} á‹“.áˆ.`;
    } catch {
      return 'áˆ˜áˆµáŠ¨áˆ¨áˆ 1, 2019 á‹“.áˆ.';
    }
  };

  // Cryptographic simulated hash for minutes
  const generateSimulatedHash = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padEnd(8, '0') + Math.floor(Math.random() * 1000000).toString(16);
    return `sha256-${hex.padEnd(64, 'a')}`;
  };

  // Submit Tithe (Follower view action)
  const handleTitheSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titheAmount || isNaN(Number(titheAmount)) || Number(titheAmount) <= 0) return;

    const calculatedEth = calculateEthiopianDate(titheDate);
    const ref = titheRef.trim() || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRecord: TitheRecord = {
      id: ref,
      followerId: activeFollowerId,
      amount: parseFloat(titheAmount),
      referenceNumber: ref,
      channel: titheChannel,
      gregorianDate: titheDate,
      ethiopianDate: calculatedEth
    };

    // Prepend tithe entry in state
    setTithes(prev => [newRecord, ...prev]);

    // Anti-Gravity check: if follower status is "Pending Review", upgrade them to "Active Contributor"
    setFollowers(prev =>
      prev.map(follower => {
        if (follower.id === activeFollowerId && follower.status === 'Pending Review') {
          return { ...follower, status: 'Active Contributor' };
        }
        return follower;
      })
    );

    // Reset Form Fields
    setTitheAmount('');
    setTitheRef('');
    alert(`Tithe Contribution Submitted successfully!\nEthiopic Date: ${calculatedEth}\nState Synchronized! Status set to 'Active Contributor'.`);
  };

  // Add Liturgical Schedule (Chairperson action)
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSchedule: LiturgicalSchedule = {
      id: `SCH-${Math.floor(1000 + Math.random() * 9000)}`,
      date: schedDate,
      time: schedTime,
      liturgyType: schedType,
      servingPriestId: schedPriest
    };
    setSchedules(prev => [...prev, newSchedule]);
    alert('New Liturgical Schedule Published!');
  };

  // Add Meeting Minutes (Secretary action)
  const handleMinutesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!minNum || !minTopic || !minResolutions) return;

    const dataToHash = `${minNum}|${minDate}|${minTopic}|${minResolutions}|CL-Secretary`;
    const signatureHash = generateSimulatedHash(dataToHash);

    const newMinute: MeetingMinute = {
      id: `MIN-${Math.floor(1000 + Math.random() * 9000)}`,
      minuteNumber: minNum,
      meetingDate: minDate,
      discussionTopic: minTopic,
      resolutionsPassed: minResolutions,
      recordedById: 'Secretary',
      signatureHash
    };

    setMinutes(prev => [newMinute, ...prev]);
    setMinNum('');
    setMinTopic('');
    setMinResolutions('');
    alert('Meeting Minutes Recorded & Ledger Signed Cryptographically!');
  };

  // Add Follower (Secretary action)
  const handleAddFollower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowerName || !newFollowerBaptism) return;

    const newId = `FL-${Math.floor(104 + Math.random() * 800)}`;
    const newFollower: FollowerProfile = {
      id: newId,
      name: newFollowerName,
      baptismName: newFollowerBaptism,
      confessionalFatherId: newFollowerPriest,
      status: 'Pending Review',
      email: newFollowerEmail || `${newFollowerName.toLowerCase().replace(/\s/g, '')}@orthodoxconnect.et`,
      phone: newFollowerPhone || '+251900000000'
    };

    setFollowers(prev => [...prev, newFollower]);
    setNewFollowerName('');
    setNewFollowerBaptism('');
    setNewFollowerEmail('');
    setNewFollowerPhone('');
    alert(`Follower Profile ${newId} Registered successfully in status 'Pending Review'.`);
  };

  // Telemetry Calculations for Patriarch View
  const statistics = useMemo(() => {
    const totalParishioners = followers.length;
    const activeContributors = followers.filter(f => f.status === 'Active Contributor').length;
    const activeRatio = totalParishioners > 0 ? (activeContributors / totalParishioners) * 100 : 0;
    const totalTitheSum = tithes.reduce((sum, t) => sum + t.amount, 0);
    const pendingReviewCount = followers.filter(f => f.status === 'Pending Review').length;

    return {
      totalParishioners,
      activeContributors,
      activeRatio: activeRatio.toFixed(1),
      totalTitheSum,
      pendingReviewCount
    };
  }, [followers, tithes]);

  // Dual Auth Status (amber: "PENDING DUAL-AUTH", green: "APPROVED & RELEASED")
  const dualAuthStatus = chairSignOff && deputySignOff ? 'APPROVED & RELEASED' : 'PENDING DUAL-AUTH';

  // Active Follower profile lookup
  const activeFollowerProfile = useMemo(() => {
    return followers.find(f => f.id === activeFollowerId) || followers[0];
  }, [followers, activeFollowerId]);

  // Active Priest profile lookup
  const activePriestProfile = useMemo(() => {
    return INITIAL_CLERGY.find(c => c.id === activePriestId) || INITIAL_CLERGY[0];
  }, [activePriestId]);

  // Spiritual children lookup for selected Priest
  const spiritualChildren = useMemo(() => {
    return followers.filter(f => {
      const matchesPriest = f.confessionalFatherId === activePriestId;
      const matchesSearch = f.name.toLowerCase().includes(priestSearch.toLowerCase()) ||
                            f.baptismName.toLowerCase().includes(priestSearch.toLowerCase()) ||
                            f.id.toLowerCase().includes(priestSearch.toLowerCase());
      return matchesPriest && matchesSearch;
    });
  }, [followers, activePriestId, priestSearch]);

  // All followers list filtered for Secretary search
  const filteredFollowers = useMemo(() => {
    return followers.filter(f =>
      f.name.toLowerCase().includes(followerSearch.toLowerCase()) ||
      f.baptismName.toLowerCase().includes(followerSearch.toLowerCase()) ||
      f.id.toLowerCase().includes(followerSearch.toLowerCase())
    );
  }, [followers, followerSearch]);

  // Render EOTC Landing Page
  if (viewMode === 'LANDING') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#1F2937] font-sans flex flex-col justify-between selection:bg-[#800020]/20 selection:text-[#800020]">
        
        {/* Navigation Bar */}
        <nav className="bg-white border-b-2 border-[#D4AF37]/30 sticky top-0 z-40 shadow-sm px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-[#800020] to-[#651A67] rounded-lg flex items-center justify-center border border-[#D4AF37]">
                <span className="text-white text-lg">âœï¸</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#800020] font-serif">OrthodoxConnect</span>
            </div>

            {/* Traditional Non-SaaS Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#1F2937]/80">
              <span className="hover:text-[#800020] cursor-pointer transition">Home &bull; áˆ˜áŠáˆ»</span>
              <span className="hover:text-[#800020] cursor-pointer transition">Liturgical Schedule &bull; áˆ¥áˆ­á‹“á‰° á‰…á‹³áˆ´</span>
              <span className="hover:text-[#800020] cursor-pointer transition">Parish Registry &bull; á‹¨áˆ°á‰ áŠ« áˆ˜á‹áŒˆá‰¥</span>
              <span className="hover:text-[#800020] cursor-pointer transition">Alms &amp; Tithes &bull; áŠ áˆ¥áˆ«á‰µáŠ“ áˆ˜á‹‹áŒ®</span>
            </div>

            <button
              onClick={() => {
                setActiveRole('FOLLOWER');
                setViewMode('PORTAL');
              }}
              className="bg-[#800020] text-white hover:bg-[#651A67] text-xs font-bold px-4 py-2 rounded-lg border border-[#D4AF37] shadow transition transform active:scale-95"
            >
              Sign In &bull; á‹­áŒá‰¡
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="relative flex-grow flex flex-col items-center justify-center text-center px-6 py-16 bg-gradient-to-b from-[#800020]/5 to-transparent">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37] px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-[#800020] rounded-full animate-pulse"></span>
              <span className="text-[10px] sm:text-xs font-black text-[#800020] uppercase tracking-widest font-serif">
                Ethiopian Orthodox Tewahedo Church Portal &bull; á‹¨áŠ¢á‰µá‹®áŒµá‹« áŠ¦áˆ­á‰¶á‹¶áŠ­áˆµ á‰°á‹‹áˆ•á‹¶ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#800020] font-serif leading-tight">
              Canonical Governance <br className="hidden sm:inline" />
              for the Digital Age
              <span className="block text-xl sm:text-2xl font-normal text-slate-600 mt-2 font-sans font-serif">
                áˆ•áŒ‹á‹Š á‹¨á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ• áŠ áˆµá‰°á‹³á‹°áˆ­ á‰ á‹²áŒ‚á‰³áˆ á‹˜áˆ˜áŠ•
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
              The unified system for parish administration, liturgical coordination, registry of the faithful, and alms management across the global Ethiopian Orthodox Tewahedo Church, configured according to the official Qale Awadi charter.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
              <button
                onClick={() => setViewMode('PORTAL')}
                className="w-full sm:w-auto bg-[#800020] hover:bg-[#651A67] text-white font-extrabold text-xs px-6 py-3 rounded-lg border-2 border-[#D4AF37] shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                Explore Portal &bull; á–áˆ­á‰³áˆ‰áŠ• á‹­áŒŽá‰¥áŠ™
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('roles-matrix');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs px-6 py-3 rounded-lg border border-gray-300 shadow hover:shadow-md transition flex items-center justify-center gap-2"
              >
                Canonical Roles &bull; áˆ•áŒ‹á‹Š áˆ˜á‹°á‰¦á‰½
              </button>
            </div>

            {/* Liturgical Non-SaaS Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-3xl mx-auto">
              <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-center">
                <span className="text-2xl sm:text-3xl font-black text-[#800020] font-serif">6</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Canonical Roles</span>
                <span className="text-[9px] text-[#800020] mt-0.5">áˆ¥áˆáŒ£áŠ áˆ˜á‹‹á‰…áˆ­</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-center">
                <span className="text-2xl sm:text-3xl font-black text-[#800020] font-serif">Ledger</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Alms Register</span>
                <span className="text-[9px] text-[#800020] mt-0.5">áŠ áˆ¥áˆ«á‰µáŠ“ áˆ˜á‹‹áŒ® áˆ˜á‹áŒˆá‰¥</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-center">
                <span className="text-2xl sm:text-3xl font-black text-[#800020] font-serif">3</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Sacred Languages</span>
                <span className="text-[9px] text-[#800020] mt-0.5">á‰…á‹±áˆ³á‰µ á‰‹áŠ•á‰‹á‹Žá‰½</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-center">
                <span className="text-2xl sm:text-3xl font-black text-[#800020] font-serif">Qale Awadi</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Ecclesiastical Charter</span>
                <span className="text-[9px] text-[#800020] mt-0.5">á‰ƒáˆˆ á‹“á‹‹á‹² áˆ•áŒˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•</span>
              </div>
            </div>

          </div>
        </header>

        {/* Roles Selection Grid */}
        <section id="roles-matrix" className="bg-white border-t border-gray-200 py-16 px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-3xl font-bold font-serif text-[#800020]">
                Select a Canonical Role to Begin Simulation
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                áˆˆáˆ˜áŒ€áˆ˜áˆ­ á‹¨á‰ƒáˆˆ á‹“á‹‹á‹²á‹áŠ• áˆ•áŒ‹á‹Š áˆ˜á‹°á‰¥ á‹­áˆáˆ¨áŒ¡ &bull; Test Qale Awadi controls across all six hierarchical tiers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  role: 'PATRIARCH',
                  title: 'Patriarch (áˆ˜áŠ•á‰ áˆ¨ á“á‰µáˆ­á‹«áˆ­áŠ­)',
                  desc: 'Supreme global oversight. View consolidated compliance audit telemetry from parishes.',
                  icon: 'ðŸ‘‘',
                  accent: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400'
                },
                {
                  role: 'CHAIRPERSON',
                  title: 'Chairperson (áˆŠá‰€ áˆ˜áŠ•á‰ áˆ­)',
                  desc: 'Parish priest administrator. Manages liturgical calendar assemblies and holds primary expenditure signature.',
                  icon: 'â›ª',
                  accent: 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400'
                },
                {
                  role: 'DEPUTY_CHAIRPERSON',
                  title: 'Deputy Chairperson (áˆáŠ­á‰µáˆ áˆŠá‰€ áˆ˜áŠ•á‰ áˆ­)',
                  desc: 'Elected lay leader. Coordinates church inventory assets and co-signs expenditures in the multi-sig workflow.',
                  icon: 'ðŸ“œ',
                  accent: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400'
                },
                {
                  role: 'SECRETARY',
                  title: 'Secretary (á‹‹áŠ“ áŒ¸áˆáŠ)',
                  desc: 'Parish registrar. Encodes member registries and records minutes (á‰ƒáˆˆ áŒ‰á‰£áŠ¤) with cryptographic hashing validation.',
                  icon: 'âœï¸',
                  accent: 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-400'
                },
                {
                  role: 'PRIEST',
                  title: 'Priest / Confessional Father (á‹¨áŠ•áˆµáˆ áŠ á‰£á‰µ)',
                  desc: 'Spiritual counselor. Searches assigned confessional children and verifies active contribution status.',
                  icon: 'âœï¸',
                  accent: 'bg-red-50 text-red-800 border-red-200 hover:border-red-400'
                },
                {
                  role: 'FOLLOWER',
                  title: 'Follower / Congregation (áˆáŠ¥áˆ˜áŠ•)',
                  desc: 'Parishioner. Submits tithes (áŠ áˆ¥áˆ«á‰µ) with calendar stamps, reviews parish financial disclosures, and prints slips.',
                  icon: 'ðŸ‘¤',
                  accent: 'bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-400'
                }
              ].map(item => (
                <button
                  key={item.role}
                  onClick={() => {
                    setActiveRole(item.role as any);
                    setViewMode('PORTAL');
                  }}
                  className={`p-6 border rounded-xl text-left shadow-sm hover:shadow transition-all group flex flex-col justify-between h-48 cursor-pointer ${item.accent}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <h4 className="font-bold text-sm font-serif">{item.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Enter Workspace âž”
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#800020] text-white border-t-4 border-[#D4AF37] px-6 py-8 text-center text-xs space-y-1">
          <p className="font-serif">â˜© OrthodoxConnect &bull; EOTC Canonical Governance System</p>
          <p className="text-purple-300">Under the Spiritual Protection of the Holy Synod of the Ethiopian Orthodox Tewahedo Church</p>
          <p className="text-purple-400 mt-2 font-mono">&copy; 2026 OrthodoxConnect. Structured around the Qale Awadi Church Charter.</p>
        </footer>

      </div>
    );
  }

  // Render Portal Workspace Simulation
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1F2937] font-sans pb-16 transition-colors duration-200">
      
      {/* 1. PERSISTENT TESTING TOOLBAR (Top testing ribbon) */}
      <div className="bg-[#800020] text-white border-b border-[#D4AF37] sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#D4AF37] text-[#800020] text-xs font-black uppercase px-2.5 py-0.5 rounded tracking-wider shadow border border-white/20">
              Qale Awadi Governance Selector
            </span>
            <span className="text-xs text-purple-200 hidden lg:inline font-mono">
              Switch role workspaces to simulate multi-sig and data state updates:
            </span>
          </div>

          {/* Role Switching Buttons */}
          <div className="flex flex-wrap gap-1">
            {(['PATRIARCH', 'CHAIRPERSON', 'DEPUTY_CHAIRPERSON', 'SECRETARY', 'PRIEST', 'FOLLOWER'] as const).map(role => {
              const isActive = activeRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1.5 rounded transition duration-200 shadow-sm border cursor-pointer ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#800020] border-[#D4AF37] scale-105 font-bold'
                      : 'bg-purple-950 text-purple-200 border-purple-800 hover:bg-purple-900 hover:text-white'
                  }`}
                >
                  {role.replace('_', ' ')}
                </button>
              );
            })}
            
            {/* Exit Simulation Button */}
            <button
              onClick={() => setViewMode('LANDING')}
              className="bg-white/10 text-white hover:bg-white/20 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded border border-white/30 ml-2 transition cursor-pointer"
            >
              Exit âž”
            </button>
          </div>
        </div>
      </div>

      {/* 2. GLOBAL ELEMENT BANNER */}
      <header className="bg-gradient-to-r from-[#800020] via-[#651A67] to-[#4A154B] text-white border-b-4 border-[#D4AF37] shadow-xl py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border-2 border-[#D4AF37] shadow-inner transform hover:rotate-12 transition">
              <span className="text-3xl">â›ª</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-wide font-serif">
                ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን አስተዳደር
              </h1>
              <p className="text-xs sm:text-sm text-amber-300 font-medium tracking-wider mt-0.5">
                á‰ƒáˆˆ á‹“á‹‹á‹² áˆ˜á‰†áŒ£áŒ áˆªá‹« á–áˆ­á‰³áˆ &bull; Qale Awadi Control Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Switch to Follower to make donation */}
            <button
              onClick={() => {
                setActiveRole('FOLLOWER');
                setViewMode('PORTAL');
              }}
              className="bg-gradient-to-r from-[#D4AF37] to-[#B89025] text-purple-950 hover:from-white hover:to-white hover:text-purple-950 font-bold text-xs px-4 py-2.5 rounded-lg border border-[#D4AF37] shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 duration-200 cursor-pointer"
            >
              Contribute Tithe / Make Parish Donation <span className="block text-[10px] font-normal font-sans">(áŠ áˆµáˆ«á‰µáŠ“ áˆ˜á‹‹áŒ® á‹­áŠ­áˆáˆ‰)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Current Active Context Badge */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#800020]/5 border border-[#800020]/20 rounded-xl p-4 shadow-sm gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#800020]/10 rounded-lg text-[#800020]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-[#800020]/70 font-semibold uppercase tracking-wider">Active Workspace View</p>
              <h2 className="text-lg font-bold text-[#800020] flex items-center gap-2">
                {activeRole.replace('_', ' ')} Portal
                <span className="text-xs font-normal text-gray-500 font-serif">
                  {activeRole === 'PATRIARCH' && 'â€” áˆ˜áŠ•á‰ áˆ¨ á“á‰µáˆ­á‹«áˆ­áŠ­ áŒ á‰…áˆ‹á‹­ áˆ˜á‰†áŒ£áŒ áˆªá‹«'}
                  {activeRole === 'CHAIRPERSON' && 'â€” á‹¨áˆ°á‰ áŠ« áŒ‰á‰£áŠ¤ áˆŠá‰€ áˆ˜áŠ•á‰ áˆ­'}
                  {activeRole === 'DEPUTY_CHAIRPERSON' && 'â€” áˆáŠ­á‰µáˆ áˆŠá‰€ áˆ˜áŠ•á‰ áˆ­ (á‹¨áˆáŠ¥áˆ˜áŠ“áŠ• á‰°á‹ˆáŠ«á‹­)'}
                  {activeRole === 'SECRETARY' && 'â€” á‹‹áŠ“ áŒ¸áˆáŠ (á‹¨áˆ˜á‹›áŒá‰¥á‰µ áŠ­ááˆ)'}
                  {activeRole === 'PRIEST' && 'â€” á‹¨áŠ•áˆµáˆ áŠ á‰£á‰µ áŠ­ááˆ'}
                  {activeRole === 'FOLLOWER' && 'â€” á‹¨áˆáŠ¥áˆ˜áŠ• áˆ˜á‰°áŒá‰ áˆªá‹«'}
                </span>
              </h2>
            </div>
          </div>
          <div className="bg-[#D4AF37]/20 border border-[#D4AF37] rounded-lg px-3 py-1 text-xs font-semibold text-[#8C6D1F]">
            Status: Active Simulation
          </div>
        </div>

        {/* 4. DUAL-AUTH VERIFICATION BLOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Dual-Auth Panel Card */}
          <div className="lg:col-span-1 bg-white border-2 border-amber-200 rounded-xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8"></div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-[#800020] uppercase tracking-wide">
                  Parish Alms Fund Authorization
                </h3>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/50 rounded-lg p-4 mb-4">
                <p className="text-xs font-bold text-[#800020]">Expenditure Item:</p>
                <p className="text-sm font-black text-slate-800">Authorize Parish Roof Renovation Fund</p>
                <p className="text-lg font-black text-[#800020] mt-1">$15,000 USD / <span className="text-xs font-normal">á‹¨á‹°á‰¥áˆ© áˆ°áŒˆáŠá‰µ áŠ¥á‹µáˆ³á‰µ áˆáŠ•á‹µ</span></p>
                <p className="text-[10px] text-gray-500 mt-1">Requires dual independent signatures from both the Chairperson (Priest) and Deputy Chairperson (Elected Layperson) to release capital.</p>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-3 rounded-lg border transition ${
                  activeRole === 'CHAIRPERSON' 
                    ? 'bg-amber-50 border-amber-300 cursor-pointer hover:bg-amber-100/50' 
                    : 'bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#800020]">Chairperson Sign-off (áˆŠá‰€ áˆ˜áŠ•á‰ áˆ­)</span>
                    {activeRole !== 'CHAIRPERSON' && (
                      <span className="text-[9px] text-gray-400">Requires Chairperson role</span>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={chairSignOff}
                    disabled={activeRole !== 'CHAIRPERSON'}
                    onChange={(e) => setChairSignOff(e.target.checked)}
                    className="w-5 h-5 accent-[#800020] rounded cursor-pointer"
                  />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-lg border transition ${
                  activeRole === 'DEPUTY_CHAIRPERSON' 
                    ? 'bg-amber-50 border-amber-300 cursor-pointer hover:bg-amber-100/50' 
                    : 'bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#800020]">Deputy Chairperson Sign-off (áˆáŠ­á‰µáˆ áˆŠá‰€ áˆ˜áŠ•á‰ áˆ­)</span>
                    {activeRole !== 'DEPUTY_CHAIRPERSON' && (
                      <span className="text-[9px] text-gray-400">Requires Deputy Chairperson role</span>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={deputySignOff}
                    disabled={activeRole !== 'DEPUTY_CHAIRPERSON'}
                    onChange={(e) => setDeputySignOff(e.target.checked)}
                    className="w-5 h-5 accent-[#800020] rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Current Fund Status */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">Fund Allocation Status:</p>
              {dualAuthStatus === 'APPROVED & RELEASED' ? (
                <div className="bg-green-100 border border-green-400 text-green-800 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 animate-bounce" />
                  <div>
                    <p className="text-xs font-extrabold uppercase">APPROVED &amp; RELEASED</p>
                    <p className="text-[10px] text-green-700">Audit keys active. Fund unlocked.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-100 border border-amber-400 text-amber-800 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="text-xs font-extrabold uppercase">PENDING DUAL-AUTH</p>
                    <p className="text-[10px] text-amber-700">Awaiting signatures to release fund.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Dashboard Portal Space */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-md min-h-[500px]">
            
            {/* ========================================================================= */}
            {/* 1. PATRIARCH DASHBOARD PANEL */}
            {/* ========================================================================= */}
            {activeRole === 'PATRIARCH' && (
              <div className="space-y-6">
                <div className="bg-[#800020]/10 border-l-4 border-[#D4AF37] p-4 rounded-r-lg">
                  <h3 className="font-bold text-[#800020] text-sm">Universal Holy Synod Administrative Tier Authorized</h3>
                  <p className="text-xs text-slate-700 mt-1 font-serif">
                    áŒ á‰…áˆ‹á‹­ á‰¤á‰° áŠ­áˆ…áŠá‰µ - á‹¨áˆ˜áŠ•á‰ áˆ¨ á“á‰µáˆ­á‹«áˆ­áŠ­ á‹¨á‰ áˆ‹á‹­ áŠ áˆµá‰°á‹³á‹°áˆ­ á‹¨á‰°áˆá‰€á‹°áˆˆá‰µ á‹°áˆ¨áŒƒá¢ Read-only compliance audit checks.
                  </p>
                </div>

                {/* Telemetry Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#FDFBF7] border border-gray-200 p-4 rounded-xl text-center shadow-sm">
                    <Users className="w-6 h-6 text-[#800020] mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Parish Laity</p>
                    <p className="text-2xl font-black text-[#800020]">{statistics.totalParishioners}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Active profiles</p>
                  </div>
                  <div className="bg-[#FDFBF7] border border-gray-200 p-4 rounded-xl text-center shadow-sm">
                    <Activity className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Contribution Rate</p>
                    <p className="text-2xl font-black text-green-700">{statistics.activeRatio}%</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{statistics.activeContributors} of {statistics.totalParishioners}</p>
                  </div>
                  <div className="bg-[#FDFBF7] border border-gray-200 p-4 rounded-xl text-center shadow-sm">
                    <DollarSign className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Capitalized Alms</p>
                    <p className="text-2xl font-black text-[#800020]">{statistics.totalTitheSum} ETB</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Seeded and logged</p>
                  </div>
                  <div className="bg-[#FDFBF7] border border-gray-200 p-4 rounded-xl text-center shadow-sm">
                    <Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Pending Audits</p>
                    <p className="text-2xl font-black text-amber-700">{statistics.pendingReviewCount}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Laity awaiting review</p>
                  </div>
                </div>

                {/* Synod Telemetry Logs */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> Synod Compliance Audit Ledger (Read-Only)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#800020]/5 text-[#800020] font-bold">
                        <tr>
                          <th className="p-2 border-b">Parishioner</th>
                          <th className="p-2 border-b">Baptism Name</th>
                          <th className="p-2 border-b">Confessional Priest</th>
                          <th className="p-2 border-b">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {followers.map(f => {
                          const confPriest = INITIAL_CLERGY.find(c => c.id === f.confessionalFatherId);
                          return (
                            <tr key={f.id} className="border-b bg-white">
                              <td className="p-2 font-semibold">{f.name}</td>
                              <td className="p-2 font-serif text-[#800020]">{f.baptismName}</td>
                              <td className="p-2 text-gray-600">{confPriest?.name || 'Unknown'}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  f.status === 'Active Contributor' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {f.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Liturgical Schedules Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h4 className="font-bold text-xs text-[#800020] mb-2 uppercase tracking-wide">Liturgical Assemblies</h4>
                    <div className="space-y-2">
                      {schedules.map(s => {
                        const priest = INITIAL_CLERGY.find(c => c.id === s.servingPriestId);
                        return (
                          <div key={s.id} className="p-2 bg-gray-50 border border-gray-100 rounded text-xs">
                            <p className="font-bold text-[#800020]">{s.liturgyType}</p>
                            <p className="text-gray-500 text-[10px]">{s.date} at {s.time} &bull; Server: {priest?.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h4 className="font-bold text-xs text-[#800020] mb-2 uppercase tracking-wide">Synod Meeting Ledger</h4>
                    <div className="space-y-2">
                      {minutes.map(m => (
                        <div key={m.id} className="p-2 bg-gray-50 border border-gray-100 rounded text-xs">
                          <p className="font-bold text-[#800020]">{m.minuteNumber}: {m.discussionTopic}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">Ledger Hash: {m.signatureHash}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. CHAIRPERSON (áˆŠá‰€ áˆ˜áŠ•á‰ áˆ­) DASHBOARD PANEL */}
            {/* ========================================================================= */}
            {activeRole === 'CHAIRPERSON' && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-lg text-[#800020] flex items-center gap-2">
                    Parish Council Chairperson Workspace
                  </h3>
                  <p className="text-xs text-gray-500">
                    Priestly Parish Leader. Set canonical calendars, configure liturgy, and manage dual signature requests.
                  </p>
                </div>

                {/* Signature Highlight Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between transition ${
                  chairSignOff 
                    ? 'bg-green-50 border-green-200 text-green-900' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div>
                    <h4 className="font-bold text-sm">Parish Roof Fund Co-Signature Status</h4>
                    <p className="text-xs mt-0.5">Your signature controls the primary parish lock. Click checkbox in the left panel to sign.</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      chairSignOff ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {chairSignOff ? 'SIGNED' : 'UNSIGNED'}
                    </span>
                  </div>
                </div>

                {/* Liturgical Scheduler form */}
                <form onSubmit={handleScheduleSubmit} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4">
                  <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" /> Publish New Liturgical Schedule
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                      <input
                        type="date"
                        value={schedDate}
                        onChange={(e) => setSchedDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Time</label>
                      <input
                        type="text"
                        value={schedTime}
                        onChange={(e) => setSchedTime(e.target.value)}
                        placeholder="e.g. 5:00 AM"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Liturgy Type</label>
                      <select
                        value={schedType}
                        onChange={(e) => setSchedType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                      >
                        <option>Divine Liturgy (á‰…á‹³áˆ´)</option>
                        <option>Kidane (áŠªá‹³áŠ•)</option>
                        <option>Evening Prayer (áˆ°á‹“á‰³á‰µ)</option>
                        <option>Spiritual Sermon (áŒ‰á‰£áŠ¤)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Serving Priest</label>
                      <select
                        value={schedPriest}
                        onChange={(e) => setSchedPriest(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                      >
                        {INITIAL_CLERGY.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#800020] text-white hover:bg-[#651A67] text-xs font-bold px-4 py-2 rounded shadow transition cursor-pointer"
                    >
                      Publish Liturgical Assembly
                    </button>
                  </div>
                </form>

                {/* Published Schedules */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-[#800020]/5 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider">Liturgical Calendars</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {schedules.map(s => {
                      const servingPriest = INITIAL_CLERGY.find(c => c.id === s.servingPriestId);
                      return (
                        <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                          <div>
                            <p className="text-sm font-bold text-[#800020]">{s.liturgyType}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Serving Priest: {servingPriest?.name}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 bg-[#D4AF37]/15 text-[#8C6D1F] text-xs font-semibold px-2 py-1 rounded">
                              <Calendar className="w-3.5 h-3.5" />
                              {s.date} @ {s.time}
                            </span>
                            <p className="text-[9px] text-gray-400 mt-1 font-semibold">Ethiopic: {calculateEthiopianDate(s.date)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. DEPUTY_CHAIRPERSON (áˆáŠ­á‰µáˆ áˆŠá‰€ áˆ˜áŠ•á‰ áˆ­) DASHBOARD PANEL */}
            {/* ========================================================================= */}
            {activeRole === 'DEPUTY_CHAIRPERSON' && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-lg text-[#800020] flex items-center gap-2">
                    Deputy Chairperson (Laity Representative)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Elected Lay Leader. Coordinates parish physical assets, protects diocesan inventory, and co-signs expenditures.
                  </p>
                </div>

                {/* Signature Highlight Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between transition ${
                  deputySignOff 
                    ? 'bg-green-50 border-green-200 text-green-900' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div>
                    <h4 className="font-bold text-sm">Parish Roof Fund Secondary Signature Status</h4>
                    <p className="text-xs mt-0.5">Your signature controls the layperson lock. Click checkbox in the left panel to sign.</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      deputySignOff ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {deputySignOff ? 'SIGNED' : 'UNSIGNED'}
                    </span>
                  </div>
                </div>

                {/* Community Assets Tracker */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-[#800020]/5 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-[#D4AF37]" /> Parish Community Asset Ledger
                    </h4>
                    <span className="text-[10px] text-gray-500 font-semibold">{assets.length} items logged</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {assets.map(asset => (
                      <div key={asset.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-purple-950 font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                              {asset.id}
                            </span>
                            <p className="text-sm font-bold text-slate-800">{asset.name}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Category: {asset.category} &bull; Custodian/Assigned: {asset.assignedTo}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            asset.status === 'Good' 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {asset.status}
                          </span>
                          
                          {/* Simulated status toggle */}
                          <button
                            onClick={() => {
                              setAssets(prev =>
                                prev.map(a =>
                                  a.id === asset.id
                                    ? { ...a, status: a.status === 'Good' ? 'Needs Repair' : 'Good' }
                                    : a
                                )
                              );
                            }}
                            className="text-[10px] bg-[#800020]/10 hover:bg-[#800020]/20 text-[#800020] font-bold px-2 py-1 rounded transition cursor-pointer"
                          >
                            Toggle Status
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 text-xs text-[#8C6D1F]">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Shield className="w-4 h-4" /> Constitutional Role Mandate (Qale Awadi):
                  </p>
                  <p className="leading-relaxed">
                    Under Article 32, Section B of the parish constitution, the lay deputy chairperson administers property contracts, coordinates parish festivals, and retains joint authorization keys over parish expenditures exceeding $1,000.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. SECRETARY (á‹‹áŠ“ áŒ¸áˆáŠ) DASHBOARD PANEL */}
            {/* ========================================================================= */}
            {activeRole === 'SECRETARY' && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-lg text-[#800020]">
                    Parish Data Registry &amp; Secretary Office
                  </h3>
                  <p className="text-xs text-gray-500">
                    Official Parish Clerk. Record council minutes (á‰ƒáˆˆ áŒ‰á‰£áŠ¤) into the immutable ledger and manage the master parishioner database.
                  </p>
                </div>

                {/* Sub-tabs for Registry vs Minutes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Registry Form */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider border-b border-gray-200 pb-2">
                      Register Follower Profile
                    </h4>
                    <form onSubmit={handleAddFollower} className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Civil Name</label>
                        <input
                          type="text"
                          value={newFollowerName}
                          onChange={(e) => setNewFollowerName(e.target.value)}
                          placeholder="e.g. Selamawit Alemu"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Baptismal Name (á‹¨áŠ­áˆ­áˆµá‰µáŠ“ áˆµáˆ)</label>
                        <input
                          type="text"
                          value={newFollowerBaptism}
                          onChange={(e) => setNewFollowerBaptism(e.target.value)}
                          placeholder="e.g. Walatta Kidusan"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Email</label>
                          <input
                            type="email"
                            value={newFollowerEmail}
                            onChange={(e) => setNewFollowerEmail(e.target.value)}
                            placeholder="e.g. name@server.et"
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Phone</label>
                          <input
                            type="text"
                            value={newFollowerPhone}
                            onChange={(e) => setNewFollowerPhone(e.target.value)}
                            placeholder="e.g. +251..."
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Assigned Confessional Father</label>
                        <select
                          value={newFollowerPriest}
                          onChange={(e) => setNewFollowerPriest(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                        >
                          {INITIAL_CLERGY.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#800020] text-white hover:bg-[#651A67] text-xs font-bold py-2 rounded transition shadow-sm cursor-pointer"
                      >
                        Register Member Profile
                      </button>
                    </form>
                  </div>

                  {/* Minutes Form */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider border-b border-gray-200 pb-2">
                      Record Council Minutes (á‰ƒáˆˆ áŒ‰á‰£áŠ¤)
                    </h4>
                    <form onSubmit={handleMinutesSubmit} className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Minute Number</label>
                          <input
                            type="text"
                            value={minNum}
                            onChange={(e) => setMinNum(e.target.value)}
                            placeholder="MIN-2026-05"
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Meeting Date</label>
                          <input
                            type="date"
                            value={minDate}
                            onChange={(e) => setMinDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Discussion Topic</label>
                        <input
                          type="text"
                          value={minTopic}
                          onChange={(e) => setMinTopic(e.target.value)}
                          placeholder="e.g. Sunday School Curriculum expansion"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Resolutions Passed</label>
                        <textarea
                          value={minResolutions}
                          onChange={(e) => setMinResolutions(e.target.value)}
                          placeholder="e.g. Authorized funds for textbook translation..."
                          rows={2}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#800020] text-white hover:bg-[#651A67] text-xs font-bold py-2 rounded transition shadow-sm cursor-pointer"
                      >
                        Record Minutes &amp; Sign Ledger
                      </button>
                    </form>
                  </div>
                </div>

                {/* Master Registries Search */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider">
                      Master Registry Directory
                    </h4>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={followerSearch}
                        onChange={(e) => setFollowerSearch(e.target.value)}
                        placeholder="Search by civil/baptismal name..."
                        className="w-full pl-8 pr-3 py-1 bg-gray-50 border border-gray-300 rounded text-xs text-[#1F2937]"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#800020]/5 text-[#800020] font-bold">
                        <tr>
                          <th className="p-2 border-b">ID</th>
                          <th className="p-2 border-b">Civil Name</th>
                          <th className="p-2 border-b">Baptism Name</th>
                          <th className="p-2 border-b">Spiritual Father</th>
                          <th className="p-2 border-b">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFollowers.map(f => {
                          const confPriest = INITIAL_CLERGY.find(c => c.id === f.confessionalFatherId);
                          return (
                            <tr key={f.id} className="border-b hover:bg-gray-50/50">
                              <td className="p-2 font-mono font-bold text-gray-500">{f.id}</td>
                              <td className="p-2 font-semibold">{f.name}</td>
                              <td className="p-2 font-serif text-[#800020]">{f.baptismName}</td>
                              <td className="p-2 text-gray-600">{confPriest?.name || 'Unknown'}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  f.status === 'Active Contributor' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {f.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. PRIEST (á‰€áˆ²áˆµ / á‹¨áŠ•áˆµáˆ áŠ á‰£á‰µ) DASHBOARD PANEL */}
            {/* ========================================================================= */}
            {activeRole === 'PRIEST' && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-[#800020] flex items-center gap-2">
                      Confessional Father Portal &bull; á‹¨áŠ•áˆµáˆ áŠ á‰£á‰µ áŠ­ááˆ
                    </h3>
                    <p className="text-xs text-gray-500">
                      Track pastoral care, verify spiritual activities, and inspect the contribution status of assigned spiritual children.
                    </p>
                  </div>
                  
                  {/* Select Priest Identity */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Priest Profile:</span>
                    <select
                      value={activePriestId}
                      onChange={(e) => setActivePriestId(e.target.value)}
                      className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-[#1F2937] font-semibold"
                    >
                      {INITIAL_CLERGY.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-[#800020]/5 border border-[#800020]/20 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#800020] text-white rounded-full flex items-center justify-center font-bold">
                    âœï¸
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Logged in Spiritual Counselor</p>
                    <p className="text-sm font-bold text-[#800020]">{activePriestProfile.name}</p>
                    <p className="text-[10px] text-gray-400">{activePriestProfile.role} &bull; {activePriestProfile.parish}</p>
                  </div>
                </div>

                {/* Spiritual Children Search & Directory */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider">
                      My Assigned Spiritual Children (á‹¨áŠ•áˆµáˆ áˆáŒ†á‰½)
                    </h4>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={priestSearch}
                        onChange={(e) => setPriestSearch(e.target.value)}
                        placeholder="Search spiritual children..."
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-[#1F2937]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {spiritualChildren.length > 0 ? (
                      spiritualChildren.map(child => {
                        const totalPaid = tithes
                          .filter(t => t.followerId === child.id)
                          .reduce((sum, t) => sum + t.amount, 0);

                        return (
                          <div key={child.id} className="border border-gray-200 bg-white rounded-xl p-4 shadow-sm hover:border-[#800020]/30 hover:shadow transition relative flex flex-col justify-between">
                            <div className="absolute top-4 right-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                child.status === 'Active Contributor' 
                                  ? 'bg-green-100 text-green-800 border border-green-300' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {child.status}
                              </span>
                            </div>
                            
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 font-mono">{child.id}</p>
                              <h5 className="font-black text-slate-800 text-sm mt-0.5">{child.name}</h5>
                              
                              <div className="mt-2 space-y-1 text-xs">
                                <p className="flex justify-between text-gray-500">
                                  <span>Baptism Name:</span>
                                  <span className="font-bold font-serif text-[#800020]">{child.baptismName}</span>
                                </p>
                                <p className="flex justify-between text-gray-500">
                                  <span>Contact Phone:</span>
                                  <span className="font-mono">{child.phone}</span>
                                </p>
                                <p className="flex justify-between text-gray-500">
                                  <span>Total Tithes:</span>
                                  <span className="font-bold text-[#800020]">{totalPaid} ETB</span>
                                </p>
                              </div>
                            </div>

                            {/* Simulated Pastoral interaction */}
                            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                              <button
                                onClick={() => alert(`Recorded Communion authorization for ${child.baptismName} (${child.name}).`)}
                                className="flex-1 bg-[#800020]/10 hover:bg-[#800020] hover:text-white text-[#800020] text-[10px] font-bold py-1.5 rounded transition text-center cursor-pointer"
                              >
                                Certify Communion
                              </button>
                              <button
                                onClick={() => alert(`Scheduled next Confession session for ${child.baptismName}.`)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold py-1.5 rounded transition text-center cursor-pointer"
                              >
                                Schedule Confession
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-8 text-gray-400 text-xs">
                        No spiritual children found matching your search.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 6. FOLLOWER (áˆáŠ¥áˆ˜áŠ•) DASHBOARD PANEL */}
            {/* ========================================================================= */}
            {activeRole === 'FOLLOWER' && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-[#800020] flex items-center gap-2">
                      Parish Congregation Portal &bull; á‹¨á‹°á‰¥áˆ© áˆáŠ¥áˆ˜áŠ“áŠ• áˆ˜á‰°áŒá‰ áˆªá‹«
                    </h3>
                    <p className="text-xs text-gray-500">
                      Submit tithes (áŠ áˆ¥áˆ«á‰µ), convert Gregorian payment logs to Ethiopic stamps, and print double gold-framed parish vouchers.
                    </p>
                  </div>

                  {/* Switch follower persona */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Test Member:</span>
                    <select
                      value={activeFollowerId}
                      onChange={(e) => setActiveFollowerId(e.target.value)}
                      className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-[#1F2937] font-semibold"
                    >
                      {followers.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.status === 'Active Contributor' ? 'Active' : 'Pending'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Follower Info Card */}
                <div className="bg-[#FDFBF7] border-2 border-[#D4AF37]/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#800020] to-[#4A154B] text-white rounded-full flex items-center justify-center text-xl shadow">
                      ðŸ‘¤
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Laity Congregation Member</p>
                      <h4 className="text-base font-black text-[#800020]">{activeFollowerProfile.name}</h4>
                      <p className="text-xs text-gray-500">
                        Baptismal Name: <span className="font-serif font-bold text-[#800020]">{activeFollowerProfile.baptismName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      activeFollowerProfile.status === 'Active Contributor' 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {activeFollowerProfile.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">Parish Code: {activeFollowerProfile.id}</span>
                  </div>
                </div>

                {/* Form to submit tithe */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                  <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" /> Submit Tithe Contribution (áŠ áˆ¥áˆ«á‰µáŠ“ áˆ˜á‹‹áŒ® á‹­áŠ­áˆáˆ‰)
                  </h4>
                  <form onSubmit={handleTitheSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Amount (ETB)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">ETB</span>
                        <input
                          type="number"
                          value={titheAmount}
                          onChange={(e) => setTitheAmount(e.target.value)}
                          placeholder="e.g. 1000"
                          className="w-full pl-10 pr-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Gregorian Date</label>
                      <input
                        type="date"
                        value={titheDate}
                        onChange={(e) => setTitheDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Payment Channel</label>
                      <select
                        value={titheChannel}
                        onChange={(e) => setTitheChannel(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                      >
                        <option value="Telebirr">Telebirr (á‰´áˆŒá‰¥áˆ­)</option>
                        <option value="CBE Birr">CBE Birr (áˆ²á‰¢áŠ¢ á‰¥áˆ­)</option>
                        <option value="Bank Deposit">Bank Deposit (á‰£áŠ•áŠ­ áˆ’áˆ³á‰¥)</option>
                        <option value="Cash Receipt">Cash Receipt (á‰ áŠ¥áŒ… á‹¨á‰°á‰€á‰ áˆˆ)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Reference Number (Optional)</label>
                      <input
                        type="text"
                        value={titheRef}
                        onChange={(e) => setTitheRef(e.target.value)}
                        placeholder="Auto-Generated if empty"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1F2937]"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4 flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs">
                      <span className="text-[#8C6D1F] font-semibold">
                        Calculated Ethiopic Stamp: <strong className="font-serif font-black">{calculateEthiopianDate(titheDate)}</strong>
                      </span>
                      <button
                        type="submit"
                        className="bg-[#800020] text-white hover:bg-[#651A67] text-xs font-bold px-6 py-2 rounded shadow transition cursor-pointer"
                      >
                        Submit &amp; Synchronize State
                      </button>
                    </div>
                  </form>
                </div>

                {/* My payment history table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-[#800020]/5 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider">
                      My Contributions Ledger
                    </h4>
                  </div>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                        <tr>
                          <th className="p-3">Ref ID</th>
                          <th className="p-3">Gregorian Date</th>
                          <th className="p-3">Ethiopian Date</th>
                          <th className="p-3">Channel</th>
                          <th className="p-3">Amount (ETB)</th>
                          <th className="p-3 text-right">Archival Slip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tithes
                          .filter(t => t.followerId === activeFollowerId)
                          .map(t => (
                            <tr key={t.id} className="border-b hover:bg-gray-50/50">
                              <td className="p-3 font-mono font-bold text-gray-500">{t.id}</td>
                              <td className="p-3 text-gray-600">{t.gregorianDate}</td>
                              <td className="p-3 font-serif font-bold text-slate-800">{t.ethiopianDate}</td>
                              <td className="p-3 font-semibold text-[#800020]">{t.channel}</td>
                              <td className="p-3 font-black text-slate-800">{t.amount} ETB</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setSelectedReceipt(t)}
                                  className="inline-flex items-center gap-1 bg-[#D4AF37]/20 hover:bg-[#D4AF37] hover:text-purple-950 text-[#8C6D1F] text-[10px] font-extrabold px-2.5 py-1 rounded transition border border-[#D4AF37]/40 shadow-sm cursor-pointer"
                                >
                                  <Printer className="w-3 h-3" />
                                  Print Slip
                                </button>
                              </td>
                            </tr>
                          ))}
                        {tithes.filter(t => t.followerId === activeFollowerId).length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-gray-400">
                              No tithes logged for this member yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Parish Financial Disclosures (áŠ áŒ á‰ƒáˆ‹á‹­ á‹¨á‹°á‰¥áˆ© á‹¨á‹á‹­áŠ“áŠ•áˆµ áˆ˜áŒáˆˆáŒ«á‹Žá‰½) */}
                <div className="bg-[#800020]/5 border border-[#800020]/20 rounded-xl p-5 shadow-sm space-y-3 mt-6">
                  <h4 className="font-bold text-xs text-[#800020] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#800020]/10 pb-2">
                    <FileCheck className="w-4 h-4 text-[#D4AF37]" /> Parish Financial Disclosures (á‹¨á‹°á‰¥áˆ© á‹¨á‹á‹­áŠ“áŠ•áˆµ á‹­á‹á‹Š áˆ˜áŒáˆˆáŒ«)
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">
                    Under the <strong>Qale Awadi Constitution Article 44</strong>, all parishes are mandated to publish quarterly financial statements to general congregation members to maintain transparency in alms administration.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Quarterly Parish Budget</p>
                      <p className="text-sm font-black text-[#800020] mt-1">$45,000 USD</p>
                      <p className="text-[9px] text-gray-400">Approved by Council</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Roof Renovation Fund Allocation</p>
                      <p className="text-sm font-black text-[#800020] mt-1">$15,000 USD</p>
                      <p className={`text-[9px] font-bold ${dualAuthStatus === 'APPROVED & RELEASED' ? 'text-green-600' : 'text-amber-500'}`}>
                        {dualAuthStatus}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Charitable &amp; Alms Outflow</p>
                      <p className="text-sm font-black text-slate-800 mt-1">12,500 ETB</p>
                      <p className="text-[9px] text-gray-400">Distributed to needy</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Dynamic State Inspector / Database Monitor (Anti-Gravity Telemetry visualization) */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md mt-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-sm text-[#800020] uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-[#D4AF37]" /> Active Qale Awadi Database State Synchronizer (Live Compliance Registry)
            </h3>
            <span className="text-[10px] bg-green-100 text-green-800 font-mono px-2 py-0.5 rounded border border-green-300">
              CANONICAL SYNCHRONIZER: ACTIVE
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mb-4">
            Below is the simulated global state database array. Submitting a new transaction under a follower's name updates their state in real-time, instantly reflecting across Priest's spiritual care tracker and Patriarch's global telemetry logs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
            {/* Followers state monitor */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-bold text-[#800020] uppercase text-[10px] mb-2 tracking-wider">Followers DB State</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {followers.map(f => (
                  <div key={f.id} className="p-2 bg-white rounded border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{f.name}</p>
                      <p className="text-[9px] text-gray-400 font-serif">Baptismal: {f.baptismName}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
                      f.status === 'Active Contributor' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {f.status === 'Active Contributor' ? 'ACTIVE' : 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tithes ledger state monitor */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-bold text-[#800020] uppercase text-[10px] mb-2 tracking-wider">Alms Ledger State</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {tithes.map(t => {
                  const f = followers.find(fol => fol.id === t.followerId);
                  return (
                    <div key={t.id} className="p-2 bg-white rounded border border-gray-100 flex justify-between items-center text-[10px]">
                      <div>
                        <p className="font-bold">{t.amount} ETB &bull; {t.channel}</p>
                        <p className="text-[9px] text-gray-400">Payer: {f?.name || 'Unknown'}</p>
                      </div>
                      <span className="text-[9px] text-[#800020] font-serif">{t.ethiopianDate.split(',')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Authorizations and scheduling state monitor */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-bold text-[#800020] uppercase text-[10px] mb-2 tracking-wider">Ecclesiastical Sanction Registry</p>
              <div className="p-2 bg-white rounded border border-gray-100 space-y-2 text-[10px]">
                <div>
                  <p className="font-bold text-gray-500">EXPENDITURE ID: ROOF-15K</p>
                  <div className="flex justify-between mt-1">
                    <span>Chairperson (Priest) Key:</span>
                    <span className={chairSignOff ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                      {chairSignOff ? 'SIGNED' : 'LOCKED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deputy Chairperson (Laity) Key:</span>
                    <span className={deputySignOff ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                      {deputySignOff ? 'SIGNED' : 'LOCKED'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-1 mt-1 font-bold">
                    <span>Fund Status:</span>
                    <span className={dualAuthStatus === 'APPROVED & RELEASED' ? 'text-green-600 animate-pulse' : 'text-amber-500'}>
                      {dualAuthStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* 5. ARCHIVAL RECEIPT ENGINE (Voucher Modal Overlay) */}
      {/* ========================================================================= */}
      {selectedReceipt && (() => {
        const payer = followers.find(f => f.id === selectedReceipt.followerId) || followers[0];
        const confPriest = INITIAL_CLERGY.find(c => c.id === payer.confessionalFatherId);
        
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            
            {/* Modal Body Container */}
            <div className="bg-[#FDFBF7] max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden relative border border-[#D4AF37]/50 transform scale-100 transition-all duration-300">
              
              {/* Top Bar controls */}
              <div className="flex justify-end p-2 bg-[#800020]">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 hover:bg-white/10 rounded-full text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Voucher Paper Area */}
              <div className="p-8 select-all" id="printable-voucher-card">
                
                {/* Formal Double Gold-Border Styling */}
                <div className="border-4 border-double border-[#D4AF37] p-6 bg-white relative">
                  
                  {/* Decorative corner accents */}
                  <div className="absolute top-1.5 left-1.5 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]"></div>
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]"></div>
                  <div className="absolute bottom-1.5 left-1.5 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]"></div>
                  <div className="absolute bottom-1.5 right-1.5 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]"></div>

                  {/* Header / Seal */}
                  <div className="text-center pb-4 border-b border-[#D4AF37]/40">
                    <span className="text-3xl inline-block mb-1">âœï¸</span>
                    <h2 className="text-sm font-black tracking-wider text-[#800020] uppercase">
                      Ethiopian Orthodox Tewahedo Church
                    </h2>
                    <h3 className="text-[10px] font-bold text-[#800020] uppercase tracking-wide font-serif">
                      ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን
                    </h3>
                    <p className="text-[9px] text-gray-400 mt-1 font-mono">ESTD 1984 á‹“.áˆ. &bull; ADDIS ABABA DIOCESE</p>
                  </div>

                  {/* Voucher Title */}
                  <div className="my-4 text-center">
                    <span className="bg-[#800020] text-[#D4AF37] text-[10px] font-black uppercase px-4 py-1 tracking-widest border border-[#D4AF37] shadow">
                      Official Tithe Receipt &bull; á‹¨áˆ°á‰ áŠ« áˆ˜á‹‹áŒ® á‹°áˆ¨áˆ°áŠ
                    </span>
                  </div>

                  {/* Main Details grid */}
                  <div className="space-y-3 text-xs my-6">
                    <div className="grid grid-cols-2 gap-4 pb-2 border-b border-gray-100">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Civil Name / áˆ™áˆ‰ áˆµáˆ</p>
                        <p className="font-extrabold text-slate-800">{payer.name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Baptismal Name / á‹¨áŠ­áˆ­áˆµá‰µáŠ“ áˆµáˆ</p>
                        <p className="font-black text-[#800020] font-serif">{payer.baptismName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-2 border-b border-gray-100">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Tithe Amount / á‹¨áŠ­áá‹« áˆ˜áŒ áŠ•</p>
                        <p className="font-black text-lg text-emerald-700">{selectedReceipt.amount} ETB</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Payment Channel / áŠ áŒá‰£á‰¥</p>
                        <p className="font-extrabold text-slate-800">{selectedReceipt.channel}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-2 border-b border-gray-100">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Gregorian Date</p>
                        <p className="font-bold text-gray-600 font-mono">{selectedReceipt.gregorianDate}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Ethiopian Date Stamp</p>
                        <p className="font-black text-[#800020] font-serif">{selectedReceipt.ethiopianDate}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Reference Tracking ID</p>
                        <p className="font-mono text-purple-950 font-bold text-[10px]">{selectedReceipt.referenceNumber}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Confessional Father</p>
                        <p className="font-bold text-gray-700">{confPriest?.name || 'Aba Wolde Harrison'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footing message and signature line */}
                  <div className="mt-8 pt-4 border-t border-[#D4AF37]/30 flex justify-between items-end">
                    <div className="text-[8px] text-gray-400 max-w-[240px]">
                      <p className="font-bold">EOTC Qale Awadi Compliance Seal</p>
                      <p className="mt-0.5 leading-snug">
                        This digital voucher serves as official canonical certification of active contribution status for sacramental eligibility under ecclesiastical bylaws.
                      </p>
                    </div>
                    <div className="text-center w-28">
                      <div className="h-6 border-b border-gray-300 font-serif text-[10px] text-purple-800 font-bold italic flex items-center justify-center">
                        Melaku A.
                      </div>
                      <p className="text-[8px] text-gray-400 uppercase mt-0.5 font-bold">Parish Registrar</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons for download / print */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => alert('Sending to local parish voucher printer...')}
                  className="bg-[#800020] hover:bg-[#651A67] text-white font-bold text-xs px-4 py-2 rounded shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Voucher
                </button>
                <button
                  onClick={() => {
                    const printContents = document.getElementById('printable-voucher-card')?.innerHTML;
                    if (!printContents) return;
                    const originalContents = document.body.innerHTML;
                    document.body.innerHTML = printContents;
                    window.print();
                    document.body.innerHTML = originalContents;
                    // Force refresh to restore React bindings
                    window.location.reload();
                  }}
                  className="bg-[#D4AF37] hover:bg-[#B89025] text-purple-950 font-bold text-xs px-4 py-2 rounded shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Open Print View
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs px-4 py-2 rounded transition cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}
      
    </div>
  );
}


