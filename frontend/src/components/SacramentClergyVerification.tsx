// src/components/SacramentClergyVerification.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Award, 
  UserCheck, 
  BookOpen, 
  Search, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle, 
  QrCode, 
  Calendar, 
  User, 
  Users, 
  ShieldCheck, 
  Printer, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { ethiopianToGregorian, gregorianToEthiopian } from '../utils/calendarConverter';

// Pre-seeded Mock Data
const INITIAL_BAPTISMS = [
  {
    id: 'BAP-2015-001',
    fullNameEn: 'Hailemariam Tekle',
    fullNameAm: 'Ã¡Å Æ’Ã¡â€¹Â­Ã¡Ë†Ë†Ã¡Ë†â€ºÃ¡Ë†Â­Ã¡â€¹Â«Ã¡Ë†Â Ã¡â€°Â°Ã¡Å Â­Ã¡Ë†Å’',
    christianNameEn: 'Gebre Kiristos',
    christianNameAm: 'Ã¡Å’Ë†Ã¡â€°Â¥Ã¡Ë†Â¨ Ã¡Å Â­Ã¡Ë†Â­Ã¡Ë†ÂµÃ¡â€°Â¶Ã¡Ë†Âµ',
    gender: 'MALE',
    dateOfBirthGreg: '2015-04-12',
    dateOfBaptismGreg: '2015-05-24',
    dateOfBaptismEth: '16/09/2007',
    baptizingPriestId: 'CL-001',
    parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
    fatherNameEn: 'Tekle Wolde',
    motherNameEn: 'Walatta Seyon'
  },
  {
    id: 'BAP-2015-002',
    fullNameEn: 'Walatta Seyon Assefa',
    fullNameAm: 'Ã¡â€¹Ë†Ã¡Ë†Ë†Ã¡â€°Â° Ã¡Å’Â½Ã¡â€¹Â®Ã¡Å â€¢ Ã¡Å Â Ã¡Ë†Â°Ã¡Ââ€¹',
    christianNameEn: 'Walatta Seyon',
    christianNameAm: 'Ã¡â€¹Ë†Ã¡Ë†Ë†Ã¡â€°Â° Ã¡Å’Â½Ã¡â€¹Â®Ã¡Å â€¢',
    gender: 'FEMALE',
    dateOfBirthGreg: '2015-08-01',
    dateOfBaptismGreg: '2015-09-10',
    dateOfBaptismEth: '05/01/2008',
    baptizingPriestId: 'CL-001',
    parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
    fatherNameEn: 'Assefa Kassa',
    motherNameEn: 'Tsehai Hailu'
  },
  {
    id: 'BAP-2016-003',
    fullNameEn: 'Tesfaye Alemu',
    fullNameAm: 'Ã¡â€°Â°Ã¡Ë†ÂµÃ¡Ââ€¹Ã¡â€¹Â¬ Ã¡â€¹â€œÃ¡Ë†Ë†Ã¡Ë†â„¢',
    christianNameEn: 'Hailemariam',
    christianNameAm: 'Ã¡Å Æ’Ã¡â€¹Â­Ã¡Ë†Ë†Ã¡Ë†â€ºÃ¡Ë†Â­Ã¡â€¹Â«Ã¡Ë†Â',
    gender: 'MALE',
    dateOfBirthGreg: '2016-01-10',
    dateOfBaptismGreg: '2016-02-20',
    dateOfBaptismEth: '12/06/2008',
    baptizingPriestId: 'CL-002',
    parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
    fatherNameEn: 'Alemu Belay',
    motherNameEn: 'Kidist Worku'
  }
];

const INITIAL_MARRIAGES = [
  {
    id: 'MAT-2014-001',
    groomName: 'Hailemariam Tekle',
    groomBaptismId: 'BAP-2015-001',
    brideName: 'Walatta Seyon Assefa',
    brideBaptismId: 'BAP-2015-002',
    dateGreg: '2018-06-15',
    dateEth: '08/10/2010',
    blessingPriest: 'Aba Wolde Harrison',
    parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
    status: 'ACTIVE' // ACTIVE, DISSOLVED
  },
  {
    id: 'MAT-2012-002',
    groomName: 'Abebe Kebede',
    groomBaptismId: 'BAP-EXTERNAL-01',
    brideName: 'Tigist Fekadu',
    brideBaptismId: 'BAP-EXTERNAL-02',
    dateGreg: '2012-10-12',
    dateEth: '02/02/2005',
    blessingPriest: 'Qesis Melaku Berhan',
    parishName: 'Debre Libanos Parish',
    status: 'DISSOLVED'
  }
];

const INITIAL_CLERGY = [
  {
    id: 'CL-001',
    fullNameEn: 'Aba Wolde Harrison',
    fullNameAm: 'Ã¡Å Â Ã¡â€°Â£ Ã¡â€¹Ë†Ã¡Ë†ÂÃ¡â€¹Â° Ã¡Ë†ÂÃ¡Ë†ÂªÃ¡Ë†Â°Ã¡Å â€¢',
    title: 'Priest (Ã¡â€°â‚¬Ã¡Ë†Â²Ã¡Ë†Âµ)',
    parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
    status: 'ACTIVE' // ACTIVE, SUSPENDED, RETIRED
  },
  {
    id: 'CL-002',
    fullNameEn: 'Qesis Melaku Berhan',
    fullNameAm: 'Ã¡â€°â‚¬Ã¡Ë†Â²Ã¡Ë†Âµ Ã¡Ë†ËœÃ¡Ë†â€¹Ã¡Å Â© Ã¡â€°Â¥Ã¡Ë†Â­Ã¡Ë†Æ’Ã¡Å â€¢',
    title: 'Priest (Ã¡â€°â‚¬Ã¡Ë†Â²Ã¡Ë†Âµ)',
    parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
    status: 'ACTIVE'
  },
  {
    id: 'CL-003',
    fullNameEn: 'Deacon Yohannes Kassa',
    fullNameAm: 'Ã¡â€¹Â²Ã¡â€¹Â«Ã¡â€°â€ Ã¡Å â€¢ Ã¡â€¹Â®Ã¡Ë†ÂÃ¡Å â€¢Ã¡Ë†Âµ Ã¡Å Â«Ã¡Ë†Â³',
    title: 'Deacon (Ã¡â€¹Â²Ã¡â€¹Â«Ã¡â€°â€ Ã¡Å â€¢)',
    parishName: 'St. George Parish',
    status: 'ACTIVE'
  },
  {
    id: 'CL-004',
    fullNameEn: 'Qesis Tekle Mariam',
    fullNameAm: 'Ã¡â€°â‚¬Ã¡Ë†Â²Ã¡Ë†Âµ Ã¡â€°Â°Ã¡Å Â­Ã¡Ë†Ë† Ã¡Ë†â€ºÃ¡Ë†Â­Ã¡â€¹Â«Ã¡Ë†Â',
    title: 'Priest (Ã¡â€°â‚¬Ã¡Ë†Â²Ã¡Ë†Âµ)',
    parishName: 'á‰¦áˆŒ áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
    status: 'SUSPENDED'
  }
];

export const SacramentClergyVerification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'baptism' | 'matrimony' | 'clergy'>('baptism');

  // Database States loaded from real API on mount
  const [baptisms, setBaptisms] = useState<any[]>([]);
  const [marriages, setMarriages] = useState<any[]>([]);
  const [clergy, setClergy] = useState<any[]>([]);

  useEffect(() => {
    const fetchSacraments = async () => {
      try {
        const res = await api.get('/sacraments', { params: { limit: 100 } });
        const allRecords = res.data.data ?? res.data ?? [];
        
        // Map backend sacramentalRecords to frontend shape
        const mappedBaptisms = allRecords
          .filter((r: any) => r.type === 'BAPTISM')
          .map((r: any) => {
            const meta = r.calendarMetadata || {};
            return {
              id: r.id,
              fullNameEn: meta.fullNameEn || r.targetUser?.fullName || 'Anonymous Member',
              fullNameAm: meta.fullNameAm || '',
              christianNameEn: r.christianName.split(' / ')[0] || r.christianName,
              christianNameAm: r.christianName.split(' / ')[1] || r.christianName,
              gender: meta.gender || 'MALE',
              dateOfBirthGreg: meta.dateOfBirthGreg || '',
              dateOfBaptismGreg: r.eventDateUtc ? r.eventDateUtc.split('T')[0] : '',
              dateOfBaptismEth: meta.ethiopic || '',
              baptizingPriestId: r.celebrantPriestId,
              parishName: r.institution?.nameEn || 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
              fatherNameEn: r.sponsorName || meta.fatherNameEn || '',
              motherNameEn: meta.motherNameEn || ''
            };
          });

        const mappedMarriages = allRecords
          .filter((r: any) => r.type === 'MARRIAGE')
          .map((r: any) => {
            const meta = r.calendarMetadata || {};
            return {
              id: r.id,
              groomName: meta.groomName || '',
              groomBaptismId: meta.groomBaptismId || '',
              brideName: meta.brideName || '',
              brideBaptismId: meta.brideBaptismId || '',
              dateGreg: r.eventDateUtc ? r.eventDateUtc.split('T')[0] : '',
              dateEth: meta.ethiopic || '',
              blessingPriest: r.celebrantPriest?.fullName || meta.blessingPriest || '',
              parishName: r.institution?.nameEn || 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
              status: r.isCanonicalVerified ? 'ACTIVE' : 'ACTIVE'
            };
          });

        setBaptisms(mappedBaptisms);
        setMarriages(mappedMarriages);
      } catch (err) {
        console.error('Failed to load sacraments', err);
      }
    };

    const fetchClergyList = async () => {
      try {
        const res = await api.get('/clergy');
        const list = res.data.data ?? res.data ?? [];
        setClergy(list.map((c: any) => ({
          id: c.id,
          fullNameEn: c.ordainedNameEn || c.fullName,
          fullNameAm: c.ordainedNameAm || c.fullName,
          title: c.rank || 'Priest',
          parishName: c.institution?.nameEn || 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
          status: c.isActive ? 'ACTIVE' : 'SUSPENDED'
        })));
      } catch (err) {
        console.error('Failed to load clergy', err);
      }
    };

    fetchSacraments();
    fetchClergyList();
  }, []);

  // Calendar Widget State
  const [calGreg, setCalGreg] = useState('2026-09-11');
  const [calEth, setCalEth] = useState('01/01/2019');

  // Sync Calendar inputs
  const handleGregChange = (val: string) => {
    setCalGreg(val);
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const eth = gregorianToEthiopian(d);
        setCalEth(eth);
      }
    } catch (_) {}
  };

  // -------------------------------------------------------------
  // TAB 1: BAPTISM REGISTRY STATES & LOGIC
  // -------------------------------------------------------------
  const [baptismSearch, setBaptismSearch] = useState('');
  const [selectedBaptism, setSelectedBaptism] = useState<any>(baptisms[0] || null);

  const [bapForm, setBapForm] = useState({
    fullNameEn: '',
    fullNameAm: '',
    christianNameEn: '',
    christianNameAm: '',
    gender: 'MALE',
    dateOfBirthGreg: '',
    dateOfBaptismGreg: '',
    baptizingPriestId: 'CL-001',
    parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
    fatherNameEn: '',
    motherNameEn: ''
  });

  const handleCreateBaptism = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bapForm.fullNameEn || !bapForm.fullNameAm) {
      alert('Full Name in English and Amharic is required');
      return;
    }

    // Amharic validation helper
    const checkAmharic = (str: string) => /^[\u1200-\u137F\s]*$/.test(str);
    if (!checkAmharic(bapForm.fullNameAm) || !checkAmharic(bapForm.christianNameAm)) {
      alert('Amharic fields must contain only Ethiopic characters (Ã¡Ë†â‚¬-Ã¡ÂÂ)');
      return;
    }

    // Convert date of baptism
    let ethBaptismStr = '01/01/2016';
    try {
      if (bapForm.dateOfBaptismGreg) {
        ethBaptismStr = gregorianToEthiopian(new Date(bapForm.dateOfBaptismGreg));
      }
    } catch (_) {}

    const christianName = `${bapForm.christianNameEn} / ${bapForm.christianNameAm}`;
    const payload = {
      type: 'BAPTISM',
      christianName,
      celebrantPriestId: bapForm.baptizingPriestId,
      sponsorName: bapForm.fatherNameEn || 'None',
      eventDateUtc: bapForm.dateOfBaptismGreg ? new Date(bapForm.dateOfBaptismGreg).toISOString() : new Date().toISOString(),
      calendarMetadata: {
        ethiopic: ethBaptismStr,
        fullNameEn: bapForm.fullNameEn,
        fullNameAm: bapForm.fullNameAm,
        gender: bapForm.gender,
        dateOfBirthGreg: bapForm.dateOfBirthGreg,
        fatherNameEn: bapForm.fatherNameEn,
        motherNameEn: bapForm.motherNameEn
      }
    };

    try {
      const res = await api.post('/sacraments', payload);
      const created = res.data.data ?? res.data;
      
      // Update local state by prepending
      const newBap = {
        id: created.id,
        fullNameEn: bapForm.fullNameEn,
        fullNameAm: bapForm.fullNameAm,
        christianNameEn: bapForm.christianNameEn,
        christianNameAm: bapForm.christianNameAm,
        gender: bapForm.gender,
        dateOfBirthGreg: bapForm.dateOfBirthGreg,
        dateOfBaptismGreg: bapForm.dateOfBaptismGreg,
        dateOfBaptismEth: ethBaptismStr,
        baptizingPriestId: bapForm.baptizingPriestId,
        parishName: bapForm.parishName,
        fatherNameEn: bapForm.fatherNameEn,
        motherNameEn: bapForm.motherNameEn
      };
      
      setBaptisms([newBap, ...baptisms]);
      setSelectedBaptism(newBap);
      
      // Reset form
      setBapForm({
        fullNameEn: '',
        fullNameAm: '',
        christianNameEn: '',
        christianNameAm: '',
        gender: 'MALE',
        dateOfBirthGreg: '',
        dateOfBaptismGreg: '',
        baptizingPriestId: clergy[0]?.id || 'CL-001',
        parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
        fatherNameEn: '',
        motherNameEn: ''
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record baptism record in the database.');
    }
  };

  const filteredBaptisms = baptisms.filter((b: any) => {
    const term = baptismSearch.toLowerCase();
    return (
      b.fullNameEn.toLowerCase().includes(term) ||
      b.fullNameAm.includes(term) ||
      b.christianNameEn.toLowerCase().includes(term) ||
      b.christianNameAm.includes(term) ||
      b.id.toLowerCase().includes(term)
    );
  });

  // -------------------------------------------------------------
  // TAB 2: MATRIMONIAL VETTING STATES & LOGIC
  // -------------------------------------------------------------
  const [groomSearch, setGroomSearch] = useState('');
  const [brideSearch, setBrideSearch] = useState('');
  const [vettingResult, setVettingResult] = useState<{
    status: 'IDLE' | 'APPROVED' | 'BLOCKED' | 'WARNING';
    message: string;
    details?: string[];
  }>({ status: 'IDLE', message: '' });

  const [matrimonyForm, setMatrimonyForm] = useState({
    groomName: '',
    groomBaptismId: '',
    brideName: '',
    brideBaptismId: '',
    dateGreg: '',
    blessingPriest: 'Aba Wolde Harrison',
    parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•'
  });

  const handleVerifyVetting = () => {
    const errors: string[] = [];
    let isGroomInReg = false;
    let isBrideInReg = false;

    // Check 1: Existence in Baptism Registry
    if (matrimonyForm.groomBaptismId) {
      isGroomInReg = baptisms.some((b: any) => b.id === matrimonyForm.groomBaptismId);
    }
    if (matrimonyForm.brideBaptismId) {
      isBrideInReg = baptisms.some((b: any) => b.id === matrimonyForm.brideBaptismId);
    }

    if (!isGroomInReg && matrimonyForm.groomBaptismId !== 'BAP-EXTERNAL-01') {
      errors.push('Groom is not registered in the official Baptism database. Spiritual standing must be verified manually.');
    }
    if (!isBrideInReg && matrimonyForm.brideBaptismId !== 'BAP-EXTERNAL-02') {
      errors.push('Bride is not registered in the official Baptism database. Spiritual standing must be verified manually.');
    }

    // Check 2: Active marriage detection
    const activeGroomMarriages = marriages.filter(
      (m: any) => m.status === 'ACTIVE' && (m.groomBaptismId === matrimonyForm.groomBaptismId || m.groomName === matrimonyForm.groomName)
    );
    const activeBrideMarriages = marriages.filter(
      (m: any) => m.status === 'ACTIVE' && (m.brideBaptismId === matrimonyForm.brideBaptismId || m.brideName === matrimonyForm.brideName)
    );

    if (activeGroomMarriages.length > 0) {
      const p = activeGroomMarriages[0].parishName;
      setVettingResult({
        status: 'BLOCKED',
        message: `Ã¢Å¡Â Ã¯Â¸Â CANONICAL BLOCKER: Existing marriage detected in ${p}.`,
        details: [`Groom has an active matrimonial bond since ${activeGroomMarriages[0].dateGreg}.`]
      });
      return;
    }

    if (activeBrideMarriages.length > 0) {
      const p = activeBrideMarriages[0].parishName;
      setVettingResult({
        status: 'BLOCKED',
        message: `Ã¢Å¡Â Ã¯Â¸Â CANONICAL BLOCKER: Existing marriage detected in ${p}.`,
        details: [`Bride has an active matrimonial bond since ${activeBrideMarriages[0].dateGreg}.`]
      });
      return;
    }

    if (errors.length > 0) {
      setVettingResult({
        status: 'WARNING',
        message: 'Ã¢Å¡Â Ã¯Â¸Â Standing Warning Check',
        details: errors
      });
      return;
    }

    setVettingResult({
      status: 'APPROVED',
      message: 'Ã¢Å“â€¦ ELIGIBILITY APPROVED: No canonical blocker or registry discrepancies detected. Matrimony is permitted.'
    });
  };

  const handleRegisterMarriage = async () => {
    if (vettingResult.status !== 'APPROVED' && vettingResult.status !== 'WARNING') {
      alert('Vetting check is required before registering a matrimony.');
      return;
    }

    let ethStr = '01/01/2016';
    try {
      if (matrimonyForm.dateGreg) {
        ethStr = gregorianToEthiopian(new Date(matrimonyForm.dateGreg));
      }
    } catch (_) {}

    // Find the priest user ID matching the name
    const selectedCleric = clergy.find((c: any) => c.fullNameEn === matrimonyForm.blessingPriest);
    const celebrantPriestId = selectedCleric?.id || clergy[0]?.id;

    if (!celebrantPriestId) {
      alert('Must select a valid blessing priest.');
      return;
    }

    const payload = {
      type: 'MARRIAGE',
      christianName: 'Matrimonial Union',
      celebrantPriestId,
      sponsorName: 'Holy Synod Vetted',
      eventDateUtc: matrimonyForm.dateGreg ? new Date(matrimonyForm.dateGreg).toISOString() : new Date().toISOString(),
      calendarMetadata: {
        ethiopic: ethStr,
        groomName: matrimonyForm.groomName,
        groomBaptismId: matrimonyForm.groomBaptismId,
        brideName: matrimonyForm.brideName,
        brideBaptismId: matrimonyForm.brideBaptismId
      }
    };

    try {
      const res = await api.post('/sacraments', payload);
      const created = res.data.data ?? res.data;

      const newM = {
        id: created.id,
        groomName: matrimonyForm.groomName,
        groomBaptismId: matrimonyForm.groomBaptismId || 'N/A',
        brideName: matrimonyForm.brideName,
        brideBaptismId: matrimonyForm.brideBaptismId || 'N/A',
        dateGreg: matrimonyForm.dateGreg || new Date().toISOString().split('T')[0],
        dateEth: ethStr,
        blessingPriest: matrimonyForm.blessingPriest,
        parishName: matrimonyForm.parishName,
        status: 'ACTIVE'
      };

      setMarriages([newM, ...marriages]);
      setVettingResult({ status: 'IDLE', message: '' });
      
      // Reset form
      setMatrimonyForm({
        groomName: '',
        groomBaptismId: '',
        brideName: '',
        brideBaptismId: '',
        dateGreg: '',
        blessingPriest: clergy[0]?.fullNameEn || 'Aba Wolde Harrison',
        parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•'
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record marriage record in the database.');
    }
  };

  const handleDissolveMarriage = (id: string) => {
    // Keep local dissolve wrapper for now
    if (confirm('Are you sure you want to mark this marriage as DISSOLVED / ANNULLED?')) {
      setMarriages(marriages.map((m: any) => m.id === id ? { ...m, status: 'DISSOLVED' } : m));
    }
  };

  // -------------------------------------------------------------
  // TAB 3: CLERGY standing STATES & LOGIC
  // -------------------------------------------------------------
  const [clergySearch, setClergySearch] = useState('');
  const [scanningClericId, setScanningClericId] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);

  const handleScanCleric = async () => {
    if (!scanningClericId) {
      setScanResult('NOT_FOUND');
      return;
    }
    try {
      const res = await api.get(`/clergy/verify/${scanningClericId.trim()}`);
      const data = res.data.data ?? res.data;
      
      setScanResult({
        id: data.clergyId,
        fullNameEn: data.clergyId,
        status: data.verified ? 'ACTIVE' : 'SUSPENDED',
        parishName: 'á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ˜á‹µáŠƒáŠ”á‹“áˆˆáˆ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•',
        title: data.message || 'Clergy member standing verified'
      });
    } catch (err: any) {
      setScanResult({
        id: scanningClericId,
        fullNameEn: 'Clergy Member Not Authorized',
        status: 'SUSPENDED',
        parishName: 'Standing check failed',
        title: err.response?.data?.message || 'Verification Error'
      });
    }
  };

  const handleUpdateClergyStatus = (id: string, newStatus: string) => {
    setClergy(clergy.map((c: any) => c.id === id ? { ...c, status: newStatus } : c));
    if (scanResult && scanResult.id === id) {
      setScanResult({ ...scanResult, status: newStatus });
    }
  };

  const filteredClergy = clergy.filter((c: any) => {
    const term = clergySearch.toLowerCase();
    return (
      c.fullNameEn.toLowerCase().includes(term) ||
      c.fullNameAm.includes(term) ||
      c.id.toLowerCase().includes(term) ||
      c.parishName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDFBF7]" style={{ color: '#1F2937' }}>
      {/* Header Banner */}
      <header className="bg-[#800020] text-[#D4AF37] shadow-lg border-b-4 border-[#D4AF37]">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-3xl font-semibold">Ã¢ËœÂ¦</span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wide">\u12f0\u1265\u1228 \u1265\u122d\u1203\u1295 \u1218\u12f5\u1283\u1294\u12d3\u1208\u121d</h1>
              <p className="text-xs text-white/80 font-medium">\u1264\u1270 \u12ad\u122d\u1235\u1272\u12eb\u1295 \u2014 \u12e8\u1208\u12d8\u12f0 \u1290\u12e8\u1310 \u121d\u12dd\u1308\u1265</p>
            </div>
          </div>
          
          {/* Calendar Widget Widget inside header */}
          <div className="mt-4 md:mt-0 bg-black/20 p-2.5 rounded-lg border border-[#D4AF37]/50 flex items-center space-x-3 text-white text-xs">
            <Calendar className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <span className="block text-gray-300 uppercase tracking-wider text-[9px] font-bold">Gregorian Date</span>
              <input 
                type="date" 
                value={calGreg} 
                onChange={(e) => handleGregChange(e.target.value)}
                className="bg-transparent font-medium border-0 focus:ring-0 p-0 text-white w-28 text-xs outline-none" 
              />
            </div>
            <div className="border-l border-white/20 pl-3">
              <span className="block text-gray-300 uppercase tracking-wider text-[9px] font-bold">Ethiopian Calendar</span>
              <span className="text-[#D4AF37] font-semibold text-xs leading-normal block pt-0.5">{calEth} Ã¡â€¹â€œ.Ã¡Ë†Â</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs bar */}
      <div className="bg-[#800020]/5 border-b border-[#E5D3B3] flex justify-center">
        <nav className="flex space-x-1 p-2 max-w-4xl w-full">
          <button
            onClick={() => setActiveTab('baptism')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${
              activeTab === 'baptism'
                ? 'bg-[#800020] text-white shadow-md'
                : 'text-[#800020] hover:bg-[#800020]/10'
            }`}
          >
            <BookOpen className="mr-2 h-4 w-4" /> Baptism Registry
          </button>
          <button
            onClick={() => setActiveTab('matrimony')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${
              activeTab === 'matrimony'
                ? 'bg-[#800020] text-white shadow-md'
                : 'text-[#800020] hover:bg-[#800020]/10'
            }`}
          >
            <Users className="mr-2 h-4 w-4" /> Matrimonial Vetting
          </button>
          <button
            onClick={() => setActiveTab('clergy')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${
              activeTab === 'clergy'
                ? 'bg-[#800020] text-white shadow-md'
                : 'text-[#800020] hover:bg-[#800020]/10'
            }`}
          >
            <ShieldCheck className="mr-2 h-4 w-4" /> Clergy standing
          </button>
        </nav>
      </div>

      {/* Main content grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* TAB 1: BAPTISM REGISTRY */}
        {activeTab === 'baptism' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Intake and list */}
            <div className="lg:col-span-7 space-y-8">
              {/* Intake Form */}
              <div className="bg-white rounded-xl shadow-md border border-[#E5D3B3] overflow-hidden">
                <div className="bg-[#800020] text-[#D4AF37] px-6 py-4 flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  <h2 className="font-bold text-lg">New Baptism Entry</h2>
                </div>
                <form onSubmit={handleCreateBaptism} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Full Name (English)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hailemariam Tekle"
                      value={bapForm.fullNameEn}
                      onChange={(e) => setBapForm({ ...bapForm, fullNameEn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Full Name (Amharic - Unicode)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ã¡Å Æ’Ã¡â€¹Â­Ã¡Ë†Ë†Ã¡Ë†â€ºÃ¡Ë†Â­Ã¡â€¹Â«Ã¡Ë†Â Ã¡â€°Â°Ã¡Å Â­Ã¡Ë†Å’"
                      value={bapForm.fullNameAm}
                      onChange={(e) => setBapForm({ ...bapForm, fullNameAm: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Gender</label>
                    <select 
                      value={bapForm.gender}
                      onChange={(e) => setBapForm({ ...bapForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white"
                    >
                      <option value="MALE">Male (Ã¡â€°Â°Ã¡â€°Â£Ã¡â€¹â€¢Ã¡â€°Âµ)</option>
                      <option value="FEMALE">Female (Ã¡Å Â Ã¡Å â€¢Ã¡Ë†ÂµÃ¡â€°Âµ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Christian Name (English)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Gebre Kiristos"
                      value={bapForm.christianNameEn}
                      onChange={(e) => setBapForm({ ...bapForm, christianNameEn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Christian Name (Amharic - Ã¡Ë†ÂµÃ¡Ë†Ëœ Ã¡Å Â­Ã¡Ë†Â­Ã¡Ë†ÂµÃ¡â€°ÂµÃ¡Å â€œ)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ã¡Å’Ë†Ã¡â€°Â¥Ã¡Ë†Â¨ Ã¡Å Â­Ã¡Ë†Â­Ã¡Ë†ÂµÃ¡â€°Â¶Ã¡Ë†Âµ"
                      value={bapForm.christianNameAm}
                      onChange={(e) => setBapForm({ ...bapForm, christianNameAm: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Date of Birth (Gregorian)</label>
                    <input 
                      type="date"
                      value={bapForm.dateOfBirthGreg}
                      onChange={(e) => setBapForm({ ...bapForm, dateOfBirthGreg: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Date of Baptism (Gregorian)</label>
                    <input 
                      type="date"
                      value={bapForm.dateOfBaptismGreg}
                      onChange={(e) => setBapForm({ ...bapForm, dateOfBaptismGreg: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Baptizing Priest</label>
                    <select 
                      value={bapForm.baptizingPriestId}
                      onChange={(e) => setBapForm({ ...bapForm, baptizingPriestId: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white"
                    >
                      {clergy.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.fullNameEn} ({c.title})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Parish Name</label>
                    <input 
                      type="text" 
                      value={bapForm.parishName}
                      disabled
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg bg-gray-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Father's Name (EN)</label>
                    <input 
                      type="text"
                      value={bapForm.fatherNameEn}
                      onChange={(e) => setBapForm({ ...bapForm, fatherNameEn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Mother's Name (EN)</label>
                    <input 
                      type="text"
                      value={bapForm.motherNameEn}
                      onChange={(e) => setBapForm({ ...bapForm, motherNameEn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5D3B3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                  <div className="col-span-2 pt-2">
                    <button 
                      type="submit" 
                      className="w-full py-3 bg-[#800020] hover:bg-[#800020]/90 text-white rounded-lg font-bold shadow-md transition-all"
                    >
                      Save Baptism Record
                    </button>
                  </div>
                </form>
              </div>

              {/* Records List */}
              <div className="bg-white rounded-xl shadow-md border border-[#E5D3B3] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="font-bold text-lg text-[#800020]">Active Baptism Database</h3>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search name or Serial ID..."
                      value={baptismSearch}
                      onChange={(e) => setBaptismSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-[#E5D3B3] rounded-lg text-sm w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#800020]/5 text-xs text-gray-500 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3 text-left">Serial ID</th>
                        <th className="px-4 py-3 text-left">Name (English/Amharic)</th>
                        <th className="px-4 py-3 text-left">Christian Name (Amharic)</th>
                        <th className="px-4 py-3 text-left">Baptism Date (Eth)</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {filteredBaptisms.map((b: any) => (
                        <tr 
                          key={b.id} 
                          onClick={() => setSelectedBaptism(b)}
                          className={`cursor-pointer transition-colors ${
                            selectedBaptism?.id === b.id ? 'bg-[#D4AF37]/10' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-xs">{b.id}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900 block">{b.fullNameEn}</span>
                            <span className="text-gray-500 text-xs">{b.fullNameAm}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-[#800020] block">{b.christianNameAm}</span>
                            <span className="text-gray-400 text-xs uppercase">{b.christianNameEn}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-medium">{b.dateOfBaptismEth}</td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBaptism(b);
                              }}
                              className="text-xs font-semibold px-2 py-1 text-[#800020] bg-[#800020]/10 hover:bg-[#800020]/20 rounded-md"
                            >
                              View Card
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredBaptisms.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-gray-400 font-medium">No baptism records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Certificate Renderer */}
            <div className="lg:col-span-5">
              {selectedBaptism ? (
                <div className="sticky top-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center">
                      <Award className="h-5 w-5 mr-1 text-[#D4AF37]" />
                      Eco-Certificate Preview
                    </h3>
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center text-xs font-bold px-3 py-1.5 bg-[#800020] text-white hover:bg-opacity-95 rounded shadow-sm"
                    >
                      <Printer className="mr-1 h-3.5 w-3.5" /> Print Holy Certificate
                    </button>
                  </div>

                  {/* Printable Ecclesiastical Certificate Certificate */}
                  <div 
                    className="w-full aspect-[1/1.414] bg-[#FDFBF7] border-[12px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
                    style={{
                      borderColor: '#D4AF37', // Gold frame
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                      borderStyle: 'double'
                    }}
                  >
                    {/* Corner Ornaments */}
                    <div className="absolute top-2 left-2 text-[#D4AF37] text-lg select-none">Ã¢Å“Â¥</div>
                    <div className="absolute top-2 right-2 text-[#D4AF37] text-lg select-none">Ã¢Å“Â¥</div>
                    <div className="absolute bottom-2 left-2 text-[#D4AF37] text-lg select-none">Ã¢Å“Â¥</div>
                    <div className="absolute bottom-2 right-2 text-[#D4AF37] text-lg select-none">Ã¢Å“Â¥</div>

                    {/* Header */}
                    <div className="text-center space-y-1">
                      <span className="text-xl font-bold text-[#800020] block">Ã¢ËœÂ¦</span>
                      <h4 className="text-[11px] font-bold text-[#800020] tracking-wider uppercase leading-none">
                        Ã¡â€¹Â¨Ã¡Å Â¢Ã¡â€°ÂµÃ¡â€¹Â®Ã¡Å’ÂµÃ¡â€¹Â« Ã¡Å Â¦Ã¡Ë†Â­Ã¡â€°Â¶Ã¡â€¹Â¶Ã¡Å Â­Ã¡Ë†Âµ Ã¡â€°Â°Ã¡â€¹â€¹Ã¡Ë†â€¢Ã¡â€¹Â¶ Ã¡â€°Â¤Ã¡â€°Â° Ã¡Å Â­Ã¡Ë†Â­Ã¡Ë†ÂµÃ¡â€°Â²Ã¡â€¹Â«Ã¡Å â€¢
                      </h4>
                      <h4 className="text-[9px] font-bold text-gray-600 tracking-wider uppercase leading-none">
                        Ethiopian Orthodox Tewahedo Church
                      </h4>
                      <span className="text-[8px] text-gray-400 font-semibold block border-b pb-1 max-w-xs mx-auto">
                        á‹°á‰¥áˆ¨ á‰¥áˆ­áˆƒáŠ• áˆ€áŒˆáˆ¨ áˆµá‰¥áŠ¨á‰µ
                      </span>
                    </div>

                    {/* Title */}
                    <div className="text-center my-3">
                      <h5 className="text-base font-bold text-[#D4AF37] leading-none">Ã¡â€¹Â¨Ã¡Å’Â¥Ã¡Ë†ÂÃ¡â€°â‚¬Ã¡â€°Âµ Ã¡Ë†ÂÃ¡Ë†ÂµÃ¡Å Â­Ã¡Ë†Â­ Ã¡â€¹Ë†Ã¡Ë†Â¨Ã¡â€°â‚¬Ã¡â€°Âµ</h5>
                      <h5 className="text-[9px] font-extrabold tracking-wider text-[#800020] uppercase">Certificate of Holy Baptism</h5>
                    </div>

                    {/* Body */}
                    <div className="text-left space-y-2 text-[10px] text-gray-700 leading-relaxed px-2 flex-1">
                      <p className="border-b border-[#E5D3B3] py-1">
                        <span className="font-bold text-gray-400 uppercase text-[8px] block">Christian Name (Ã¡Ë†ÂµÃ¡Ë†Ëœ Ã¡Å Â­Ã¡Ë†Â­Ã¡Ë†ÂµÃ¡â€°ÂµÃ¡Å â€œ)</span>
                        <span className="font-bold text-[#800020] text-sm">{selectedBaptism.christianNameAm}</span> / <span className="font-medium text-gray-800">{selectedBaptism.christianNameEn}</span>
                      </p>
                      
                      <p className="border-b border-[#E5D3B3] py-1">
                        <span className="font-bold text-gray-400 uppercase text-[8px] block">Secular Name (Ã¡â€¹Â¨Ã¡â€¹â€œÃ¡Ë†Ë†Ã¡Ë†Â Ã¡Ë†ÂµÃ¡Ë†Â)</span>
                        <span className="font-bold text-gray-900 text-xs">{selectedBaptism.fullNameAm}</span> / <span className="font-medium text-gray-800">{selectedBaptism.fullNameEn}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-2 border-b border-[#E5D3B3] py-1">
                        <div>
                          <span className="font-bold text-gray-400 uppercase text-[8px] block">Gender (Ã¡Å’Â¾Ã¡â€°Â³)</span>
                          <span className="font-semibold text-gray-800">{selectedBaptism.gender === 'MALE' ? 'MALE (Ã¡â€°Â°Ã¡â€°Â£Ã¡â€¹â€¢Ã¡â€°Âµ)' : 'FEMALE (Ã¡Å Â Ã¡Å â€¢Ã¡Ë†ÂµÃ¡â€°Âµ)'}</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-400 uppercase text-[8px] block">Baptism Date (Ã¡â€¹Â¨Ã¡Å’Â¥Ã¡Ë†ÂÃ¡â€°â‚¬Ã¡â€°Âµ Ã¡â€°â‚¬Ã¡Å â€¢)</span>
                          <span className="font-semibold text-gray-800">{selectedBaptism.dateOfBaptismEth} Ã¡â€¹â€œ.Ã¡Ë†Â</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-b border-[#E5D3B3] py-1">
                        <div>
                          <span className="font-bold text-gray-400 uppercase text-[8px] block">Father (Ã¡Å Â Ã¡â€°Â£Ã¡â€°Âµ)</span>
                          <span className="font-medium text-gray-800">{selectedBaptism.fatherNameEn || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-400 uppercase text-[8px] block">Mother (Ã¡Å Â¥Ã¡Å â€œÃ¡â€°Âµ)</span>
                          <span className="font-medium text-gray-800">{selectedBaptism.motherNameEn || 'N/A'}</span>
                        </div>
                      </div>

                      <p className="border-b border-[#E5D3B3] py-1">
                        <span className="font-bold text-gray-400 uppercase text-[8px] block">Baptizing Priest / Blessing Minister</span>
                        <span className="font-semibold text-gray-800">
                          {clergy.find((c: any) => c.id === selectedBaptism.baptizingPriestId)?.fullNameEn || 'Aba Wolde Harrison'}
                        </span>
                      </p>

                      <p className="py-1">
                        <span className="font-bold text-gray-400 uppercase text-[8px] block">Verified Parish Registry</span>
                        <span className="font-semibold text-gray-800">{selectedBaptism.parishName}</span>
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-[#D4AF37] pt-2 flex items-center justify-between mt-2">
                      <div className="text-left">
                        <span className="text-[7px] uppercase font-bold text-gray-400 block">Certificate Serial ID</span>
                        <span className="text-[10px] font-mono font-bold text-[#800020]">{selectedBaptism.id}</span>
                      </div>
                      
                      {/* Security Verification QR */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-white p-1 border border-gray-300 rounded flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full text-[#800020]">
                            <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                            <rect x="5" y="5" width="20" height="20" fill="white" />
                            <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                            <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                            <rect x="75" y="5" width="20" height="20" fill="white" />
                            <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                            <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                            <rect x="5" y="75" width="20" height="20" fill="white" />
                            <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                            <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                            <rect x="45" y="45" width="10" height="10" fill="white" />

                            <rect x="35" y="15" width="10" height="15" fill="currentColor" />
                            <rect x="55" y="10" width="10" height="10" fill="currentColor" />
                            <rect x="15" y="50" width="15" height="10" fill="currentColor" />
                            <rect x="80" y="50" width="10" height="15" fill="currentColor" />
                          </svg>
                        </div>
                        <span className="text-[6px] font-bold text-gray-500 mt-0.5">SECURE VERIFIED</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md border border-[#E5D3B3] p-12 text-center text-gray-400">
                  <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Select a baptism record from the database list to render their Ecclesiastical Certificate.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MATRIMONIAL VETTING */}
        {activeTab === 'matrimony' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Vetting form & alerts */}
            <div className="lg:col-span-6 space-y-8">
              <div className="bg-white rounded-xl shadow-md border border-[#E5D3B3] overflow-hidden">
                <div className="bg-[#800020] text-[#D4AF37] px-6 py-4 flex items-center">
                  <UserCheck className="mr-2 h-5 w-5" />
                  <h2 className="font-bold text-lg">Pre-Marital Canonical Vetting</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Under EOTC Canon Law, a pre-marital standing check must occur to guarantee that both parties are baptized Orthodox Christians and that neither party possesses an active matrimonial bond.
                  </p>
                  
                  {/* Groom Form */}
                  <div className="border-l-4 border-[#800020] pl-4 space-y-3">
                    <span className="text-xs font-extrabold uppercase text-[#800020] tracking-wider">Groom (Ã¡Ë†â„¢Ã¡Ë†Â½Ã¡Ë†Â«Ã¡â€¹Â)</span>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Groom Name</label>
                      <input 
                        type="text" 
                        placeholder="Groom Name"
                        value={matrimonyForm.groomName}
                        onChange={(e) => setMatrimonyForm({ ...matrimonyForm, groomName: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#E5D3B3] rounded focus:outline-none focus:ring-1 focus:ring-[#800020] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Groom Baptism ID / Serial Number</label>
                      <select 
                        value={matrimonyForm.groomBaptismId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = baptisms.find((b: any) => b.id === val);
                          setMatrimonyForm({
                            ...matrimonyForm,
                            groomBaptismId: val,
                            groomName: found ? found.fullNameEn : matrimonyForm.groomName
                          });
                        }}
                        className="w-full px-3 py-1.5 border border-[#E5D3B3] rounded focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white text-sm"
                      >
                        <option value="">Select groom from registry...</option>
                        {baptisms.filter((b: any) => b.gender === 'MALE').map((b: any) => (
                          <option key={b.id} value={b.id}>{b.fullNameEn} ({b.id})</option>
                        ))}
                        <option value="BAP-EXTERNAL-01">Non-registered Groom (External standing)</option>
                      </select>
                    </div>
                  </div>

                  {/* Bride Form */}
                  <div className="border-l-4 border-[#D4AF37] pl-4 space-y-3">
                    <span className="text-xs font-extrabold uppercase text-[#D4AF37] tracking-wider">Bride (Ã¡Ë†â„¢Ã¡Ë†Â½Ã¡Ë†ÂªÃ¡â€°Âµ)</span>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Bride Name</label>
                      <input 
                        type="text" 
                        placeholder="Bride Name"
                        value={matrimonyForm.brideName}
                        onChange={(e) => setMatrimonyForm({ ...matrimonyForm, brideName: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#E5D3B3] rounded focus:outline-none focus:ring-1 focus:ring-[#800020] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Bride Baptism ID / Serial Number</label>
                      <select 
                        value={matrimonyForm.brideBaptismId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = baptisms.find((b: any) => b.id === val);
                          setMatrimonyForm({
                            ...matrimonyForm,
                            brideBaptismId: val,
                            brideName: found ? found.fullNameEn : matrimonyForm.brideName
                          });
                        }}
                        className="w-full px-3 py-1.5 border border-[#E5D3B3] rounded focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white text-sm"
                      >
                        <option value="">Select bride from registry...</option>
                        {baptisms.filter((b: any) => b.gender === 'FEMALE').map((b: any) => (
                          <option key={b.id} value={b.id}>{b.fullNameEn} ({b.id})</option>
                        ))}
                        <option value="BAP-EXTERNAL-02">Non-registered Bride (External standing)</option>
                      </select>
                    </div>
                  </div>

                  {/* General Marriage Info */}
                  <div className="grid grid-cols-2 gap-4 border-t pt-4 border-gray-100">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Blessing Priest</label>
                      <select 
                        value={matrimonyForm.blessingPriest}
                        onChange={(e) => setMatrimonyForm({ ...matrimonyForm, blessingPriest: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#E5D3B3] rounded focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white text-xs"
                      >
                        {clergy.filter((c: any) => c.status === 'ACTIVE').map((c: any) => (
                          <option key={c.id} value={c.fullNameEn}>{c.fullNameEn}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Matrimonial Date</label>
                      <input 
                        type="date"
                        value={matrimonyForm.dateGreg}
                        onChange={(e) => setMatrimonyForm({ ...matrimonyForm, dateGreg: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#E5D3B3] rounded focus:outline-none focus:ring-1 focus:ring-[#800020] text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex space-x-2">
                    <button 
                      type="button" 
                      onClick={handleVerifyVetting}
                      className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-opacity-95 text-[#800020] font-extrabold rounded-lg text-sm shadow transition-all border border-[#800020]/20"
                    >
                      Verify Eligibility
                    </button>
                    <button 
                      type="button" 
                      onClick={handleRegisterMarriage}
                      disabled={vettingResult.status !== 'APPROVED' && vettingResult.status !== 'WARNING'}
                      className={`flex-1 py-2.5 text-white font-extrabold rounded-lg text-sm shadow transition-all ${
                        vettingResult.status === 'APPROVED' || vettingResult.status === 'WARNING'
                          ? 'bg-[#800020] hover:bg-[#800020]/90 cursor-pointer'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Register Matrimony
                    </button>
                  </div>
                </div>
              </div>

              {/* Vetting Notification Board */}
              {vettingResult.status !== 'IDLE' && (
                <div className={`p-5 rounded-xl border shadow-sm ${
                  vettingResult.status === 'APPROVED' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : vettingResult.status === 'BLOCKED'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-start space-x-3">
                    {vettingResult.status === 'APPROVED' ? (
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
                    )}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-sm tracking-wide">{vettingResult.message}</h4>
                      {vettingResult.details && vettingResult.details.length > 0 && (
                        <ul className="list-disc pl-5 text-xs space-y-1 text-gray-700">
                          {vettingResult.details.map((d, idx) => (
                            <li key={idx} className="font-medium">{d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Registered Marriage List */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-xl shadow-md border border-[#E5D3B3] p-6">
                <h3 className="font-bold text-lg text-[#800020] mb-4">Matrimonial Holy Registry</h3>
                <div className="space-y-4">
                  {marriages.map((m: any) => (
                    <div 
                      key={m.id} 
                      className={`p-4 rounded-lg border transition-all ${
                        m.status === 'ACTIVE' 
                          ? 'border-[#D4AF37]/50 bg-[#FDFBF7]' 
                          : 'border-gray-200 bg-gray-50 opacity-75'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-block px-2 py-0.5 bg-[#800020]/10 text-[#800020] text-[9.5px] font-bold rounded uppercase tracking-wider mb-2">
                            {m.id}
                          </span>
                          <span className={`inline-block px-2 py-0.5 text-[9.5px] font-bold rounded uppercase tracking-wider mb-2 ml-2 ${
                            m.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        {m.status === 'ACTIVE' && (
                          <button 
                            onClick={() => handleDissolveMarriage(m.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-bold"
                          >
                            Annul Union
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs mt-1">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-gray-400">Groom</span>
                          <span className="font-bold text-gray-800 text-sm">{m.groomName}</span>
                          <span className="block text-[10px] text-gray-500 font-mono mt-0.5">{m.groomBaptismId}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-gray-400">Bride</span>
                          <span className="font-bold text-gray-800 text-sm">{m.brideName}</span>
                          <span className="block text-[10px] text-gray-500 font-mono mt-0.5">{m.brideBaptismId}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#E5D3B3]/40 flex justify-between items-center text-[10px] text-gray-500">
                        <span>Blessed by: <strong className="text-gray-700">{m.blessingPriest}</strong></span>
                        <span>Date: <strong className="text-gray-700">{m.dateEth} (Eth)</strong></span>
                      </div>
                    </div>
                  ))}
                  {marriages.length === 0 && (
                    <div className="text-center py-8 text-gray-400">No marriage records found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CLERGY DIRECTORY */}
        {activeTab === 'clergy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Clergy List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-xl shadow-md border border-[#E5D3B3] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="font-bold text-lg text-[#800020]">Parish Standing Directory</h3>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search name, title, or parish..."
                      value={clergySearch}
                      onChange={(e) => setClergySearch(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-[#E5D3B3] rounded-lg text-sm w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClergy.map((c: any) => (
                    <div 
                      key={c.id} 
                      className={`p-4 rounded-xl border flex justify-between items-start transition-all cursor-pointer hover:shadow-sm ${
                        c.status === 'ACTIVE' 
                          ? 'border-[#D4AF37]/50 bg-[#FDFBF7]' 
                          : c.status === 'SUSPENDED'
                          ? 'border-red-200 bg-red-50/30'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => {
                        setScanningClericId(c.id);
                        setScanResult(c);
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">{c.id}</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            c.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : c.status === 'SUSPENDED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {c.status === 'ACTIVE' ? 'Active / Ã¡â€°Â Ã¡Å Â Ã¡Å’Ë†Ã¡Ë†ÂÃ¡Å’ÂÃ¡Ë†Å½Ã¡â€°Âµ Ã¡Ë†â€¹Ã¡â€¹Â­' : c.status === 'SUSPENDED' ? 'Suspended / Ã¡â€°Â Ã¡â€¹â€¢Ã¡Å’Ë†Ã¡â€¹Â³ Ã¡Ë†â€¹Ã¡â€¹Â­' : 'Retired'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-900">{c.fullNameEn}</h4>
                        <h4 className="text-xs text-gray-600 font-semibold">{c.fullNameAm}</h4>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{c.title} Ã¢â‚¬Â¢ {c.parishName}</p>
                      </div>
                      
                      {/* Bishop status change simulation */}
                      <div className="flex flex-col space-y-1">
                        <select 
                          value={c.status}
                          onChange={(e) => handleUpdateClergyStatus(c.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-bold p-1 border rounded bg-white"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="SUSPENDED">Suspended</option>
                          <option value="RETIRED">Retired</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {filteredClergy.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-400">No clergy records match the search.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Simulated Card Verifier scanner */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl shadow-md border border-[#E5D3B3] p-6 sticky top-6">
                <h3 className="font-bold text-lg text-[#800020] mb-3 flex items-center">
                  <QrCode className="h-5 w-5 mr-1.5 text-[#D4AF37]" />
                  Standing verification
                </h3>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  Enter a Cleric ID number or select one from the directory to verify canonical standing and ecclesiastic status.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Cleric ID / Scan Value</label>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        placeholder="e.g. CL-001"
                        value={scanningClericId}
                        onChange={(e) => setScanningClericId(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-[#E5D3B3] rounded text-sm uppercase font-mono"
                      />
                      <button 
                        onClick={handleScanCleric}
                        className="px-4 py-1.5 bg-[#800020] hover:bg-opacity-95 text-white font-bold text-xs rounded transition-all"
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  {/* Verification Result Display */}
                  {scanResult && (
                    <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col items-center text-center">
                      {scanResult === 'NOT_FOUND' ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xl font-bold mx-auto">
                            Ã¢Å“â€¢
                          </div>
                          <h4 className="font-bold text-red-600">CLERGY MEMBER NOT FOUND</h4>
                          <p className="text-xs text-gray-500">The provided Cleric ID has no entry in the Medhanialem Standing Directory.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 w-full">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl font-bold ${
                            scanResult.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-700' 
                              : scanResult.status === 'SUSPENDED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            Ã¢ËœÂ¦
                          </div>
                          <div>
                            <span className="block text-[10px] font-mono text-gray-400 uppercase">{scanResult.id}</span>
                            <h4 className="font-bold text-base text-gray-900 leading-tight">{scanResult.fullNameEn}</h4>
                            <h5 className="text-sm text-gray-600 font-semibold leading-normal">{scanResult.fullNameAm}</h5>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">{scanResult.title}</p>
                          </div>

                          {/* Big Status Badge */}
                          <div className={`py-3 px-4 rounded-lg font-extrabold text-sm border ${
                            scanResult.status === 'ACTIVE' 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : scanResult.status === 'SUSPENDED'
                              ? 'bg-red-50 border-red-200 text-red-800 animate-pulse'
                              : 'bg-gray-50 border-gray-200 text-gray-800'
                          }`}>
                            {scanResult.status === 'ACTIVE' && 'Active (Ã¡â€°Â Ã¡Å Â Ã¡Å’Ë†Ã¡Ë†ÂÃ¡Å’ÂÃ¡Ë†Å½Ã¡â€°Âµ Ã¡Ë†â€¹Ã¡â€¹Â­)'}
                            {scanResult.status === 'SUSPENDED' && 'Suspended (Ã¡â€°Â Ã¡â€¹â€¢Ã¡Å’Ë†Ã¡â€¹Â³ Ã¡Ë†â€¹Ã¡â€¹Â­)'}
                            {scanResult.status === 'RETIRED' && 'Retired (Ã¡â€°Â Ã¡Å Â­Ã¡â€°Â¥Ã¡Ë†Â­ Ã¡â€¹Â«Ã¡Ë†Â¨Ã¡Ââ€°)'}
                          </div>

                          <p className="text-[10.5px] text-gray-500 leading-normal border-t pt-3 mt-3">
                            This verification represents real-time credentials authorized by the Diocesan Bishop for parish administration.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SacramentClergyVerification;


