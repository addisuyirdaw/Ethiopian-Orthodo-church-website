// src/components/IdCardPrinter.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Parishioner } from '../types/models';
import { ArrowLeft, Printer } from 'lucide-react';

const IdCardPrinter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parishioner, setParishioner] = useState<Parishioner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch from API, fallback to mock/local list if not found
    api.get(`/parishioners/${id}`)
      .then((res) => {
        setParishioner(res.data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to local storage or mock search
        const saved = localStorage.getItem('parishioners');
        if (saved) {
          const list: Parishioner[] = JSON.parse(saved);
          const found = list.find(p => p.id === id);
          if (found) {
            setParishioner(found);
            setLoading(false);
            return;
          }
        }
        // Build a temporary mock one for demonstration
        setParishioner({
          id: id || 'MDB-2016-0001',
          firstNameEn: 'Hailemariam',
          lastNameEn: 'Desalegn',
          firstNameAm: 'áŠƒá‹­áˆˆáˆ›áˆ­á‹«áˆ',
          lastNameAm: 'á‹°áˆ³áˆˆáŠ',
          gender: 'MALE',
          phone: '+251911000000',
          address: { subcity: 'Bole', woreda: '03', kebele: '12' },
          communionStatus: 'ACTIVE',
          baptismalName: 'Gebre Kiristos (áŒˆá‰¥áˆ¨ áŠ­áˆ­áˆµá‰¶áˆµ)',
          dateOfBirthGregorian: new Date().toISOString(),
          dateOfBirthEthiopian: '12/04/2008',
        });
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-bg">
        <p className="text-lg font-medium text-slate">Loading ID Card...</p>
      </div>
    );
  }

  if (!parishioner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-bg">
        <p className="text-lg font-medium text-red-600 mb-4">Parishioner not found</p>
        <button onClick={() => navigate('/directory')} className="px-4 py-2 bg-primary text-white rounded">
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-start print:bg-white print:p-0">
      {/* Navigation & Controls - Hidden during print */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 print:hidden">
        <button
          onClick={() => navigate('/directory')}
          className="flex items-center text-primary font-semibold hover:opacity-80"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Directory
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center bg-primary text-white px-4 py-2 rounded shadow hover:bg-opacity-90"
        >
          <Printer className="mr-2 h-5 w-5" /> Print Card
        </button>
      </div>

      {/* ID Card Wrapper with Print Optimization */}
      <div className="print-area flex items-center justify-center">
        <div
          className="w-[3.375in] h-[2.125in] bg-[#FDFBF7] border-4 rounded-xl shadow-xl p-3 flex flex-col justify-between relative overflow-hidden select-none print:shadow-none print:border-2"
          style={{
            borderColor: '#D4AF37', // Gold Accent
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Top Banner */}
          <div className="flex items-start justify-between border-b pb-1" style={{ borderColor: '#E5D3B3' }}>
            <div className="flex flex-col">
              <span className="text-[7.5px] font-bold tracking-tight uppercase" style={{ color: '#800020' }}>
                Ethiopian Orthodox Tewahedo Church
              </span>
              <span className="text-[7px] font-medium leading-none text-gray-700">
                á‹¨áŠ¢á‰µá‹®áŒµá‹« áŠ¦áˆ­á‰¶á‹¶áŠ­áˆµ á‰°á‹‹áˆ•á‹¶ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•
              </span>
              <span className="text-[6.5px] text-gray-500 font-semibold mt-0.5">
                ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን
              </span>
            </div>
            {/* Cross Emblem Placeholder */}
            <div className="w-5 h-5 flex items-center justify-center bg-[#800020] text-white rounded-full text-[10px] font-bold">
              â˜¦
            </div>
          </div>

          {/* Body Section */}
          <div className="flex flex-1 my-1.5 items-center">
            {/* Photo Placeholder */}
            <div className="w-[0.6in] h-[0.75in] bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-[7px] text-gray-400 text-center font-bold mr-2 uppercase">
              Photo
            </div>

            {/* Fields */}
            <div className="flex-1 flex flex-col space-y-0.5 text-slate">
              <div className="leading-tight">
                <span className="text-[5.5px] uppercase text-gray-400 font-semibold block">Full Name / áˆ™áˆ‰ áˆµáˆ</span>
                <span className="text-[9px] font-bold text-gray-800 block">
                  {parishioner.firstNameEn} {parishioner.lastNameEn}
                </span>
                <span className="text-[8px] font-semibold text-gray-700 block">
                  {parishioner.firstNameAm} {parishioner.lastNameAm}
                </span>
              </div>

              <div className="leading-tight">
                <span className="text-[5.5px] uppercase text-gray-400 font-semibold block">Christian Name / á‹¨áŠ­áˆ­áˆµá‰µáŠ“ áˆµáˆ</span>
                <span className="text-[8.5px] font-bold text-[#800020]">
                  {parishioner.baptismalName || 'N/A'}
                </span>
              </div>
            </div>

            {/* QR Code and Status */}
            <div className="flex flex-col items-center justify-center ml-1">
              {/* Simulated QR Code using Canvas/SVG */}
              <div className="w-12 h-12 bg-white p-1 border border-gray-300 rounded flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate">
                  {/* Simplified mock QR grid pattern */}
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

                  <rect x="40" y="10" width="10" height="10" fill="currentColor" />
                  <rect x="50" y="20" width="10" height="10" fill="currentColor" />
                  <rect x="15" y="45" width="10" height="10" fill="currentColor" />
                  <rect x="80" y="50" width="10" height="10" fill="currentColor" />
                </svg>
              </div>
              <span className="text-[5.5px] font-bold text-gray-500 mt-1 uppercase">VERIFIED</span>
            </div>
          </div>

          {/* Footer Card Info */}
          <div className="flex justify-between items-end border-t pt-1" style={{ borderColor: '#E5D3B3' }}>
            <div>
              <span className="text-[5.5px] uppercase text-gray-400 font-semibold block">Member ID</span>
              <span className="text-[8px] font-mono font-bold leading-none text-gray-800">{parishioner.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[5.5px] uppercase text-gray-400 font-semibold block">Issue Date</span>
              <span className="text-[7.5px] font-medium leading-none text-gray-700">
                {parishioner.dateOfBirthEthiopian ? parishioner.dateOfBirthEthiopian : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Styled Print Rules helper styles */}
      <style>{`
        @media print {
          body {
            background-color: transparent !important;
            margin: 0;
            padding: 0;
          }
          .print-area {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default IdCardPrinter;

