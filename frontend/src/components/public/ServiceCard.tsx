// src/components/public/ServiceCard.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Circle, Clock, Building2, User } from 'lucide-react';
import type { ChurchService } from '../../data/churchServices';

interface ServiceCardProps {
  service: ChurchService;
  defaultOpen?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article
      className="rounded-2xl border overflow-hidden font-ethiopic transition-all duration-200"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: open ? service.color : '#E8E0D0',
        boxShadow: open ? `0 4px 24px ${service.color}18` : 'none',
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 text-left cursor-pointer"
        aria-expanded={open}
        aria-controls={`service-body-${service.id}`}
      >
        {/* Icon circle */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform"
          style={{
            backgroundColor: `${service.color}14`,
            border: `2px solid ${service.color}30`,
            transform: open ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {service.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg" style={{ color: '#1A1209' }}>
            {service.titleAm}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
            {service.titleEn}
          </p>
        </div>

        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: open ? `${service.color}18` : '#F5F0E8', color: service.color }}
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Body — expands on open */}
      {open && (
        <div
          id={`service-body-${service.id}`}
          className="px-5 pb-6 flex flex-col gap-5 border-t"
          style={{ borderColor: '#F0EBE0' }}
        >
          {/* Description */}
          <p className="text-sm leading-relaxed pt-4" style={{ color: '#4B3A2A' }}>
            {service.descriptionAm}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Who can request */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: '#FDF8F0', border: '1px solid #F0EBE0' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" style={{ color: service.color }} />
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
                  ማን ሊጠይቅ ይችላል
                </p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#1A1209' }}>
                {service.whoCanRequestAm}
              </p>
            </div>

            {/* Processing time */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: '#FDF8F0', border: '1px solid #F0EBE0' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" style={{ color: service.color }} />
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
                  የሂደት ጊዜ
                </p>
              </div>
              <p className="text-sm font-bold" style={{ color: '#1A1209' }}>
                {service.processingTimeAm}
              </p>
            </div>
          </div>

          {/* Documents */}
          {service.documents.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
                የሚያስፈልጉ ሰነዶች
              </p>
              <ul className="flex flex-col gap-2">
                {service.documents.map((doc, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {doc.required ? (
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: service.color }} />
                    ) : (
                      <Circle className="w-4 h-4 shrink-0" style={{ color: '#C8BFA8' }} />
                    )}
                    <span className="text-sm" style={{ color: '#1A1209' }}>{doc.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto shrink-0"
                      style={{
                        backgroundColor: doc.required ? `${service.color}14` : '#F5F0E8',
                        color: doc.required ? service.color : '#9B8E7A',
                      }}
                    >
                      {doc.required ? 'ግዴታ' : 'አማራጭ'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.documents.length === 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'rgba(45,122,78,0.08)', color: '#2d7a4e', border: '1px solid rgba(45,122,78,0.2)' }}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              ምንም ሰነድ አያስፈልግም — ቤተ ክርስቲያን ቀጥታ ቅረቡ
            </div>
          )}

          {/* Office */}
          <div
            className="flex flex-wrap items-start gap-4 rounded-xl p-4"
            style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E0D0' }}
          >
            <div className="flex items-start gap-2 flex-1 min-w-[160px]">
              <Building2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: service.color }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>ኃላፊ ጽ/ቤት</p>
                <p className="text-sm font-bold" style={{ color: '#1A1209' }}>{service.officeAm}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 flex-1 min-w-[160px]">
              <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: service.color }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>የጽ/ቤት ሰዓታት</p>
                <p className="text-sm" style={{ color: '#4B3A2A' }}>{service.officeHoursAm}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
