// src/components/OnboardingWizard.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { api } from '../api/client';
import { isValidEthiopic } from '../validation/ethiopicName';
import { isValidPhone } from '../validation/phone';
import { ethiopianToGregorian } from '../utils/calendarConverter';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { LoadingSpinner } from './LoadingSpinner';
import { Check as CheckIcon } from 'lucide-react';

interface FormData {
  // Personal Info
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  firstNameAm: string;
  middleNameAm?: string;
  lastNameAm: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  subcity: string;
  woreda: string;
  kebele: string;
  // Spiritual Info
  baptismalName?: string;
  spiritualFatherId?: string;
  communionStatus: 'ACTIVE' | 'IRREGULAR' | 'NONE';
  // Ethiopian birthdate
  ethDay: number;
  ethMonth: number;
  ethYear: number;
  // Family connections
  familyLinks: Array<{ relation: 'Spouse' | 'Child' | 'Parent'; parishionerId: string }>;
}

interface OnboardingWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [priests, setPriests] = useState<any[]>([]);
  const { queueSubmission, syncStatus } = useOfflineSync();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      gender: 'MALE',
      communionStatus: 'ACTIVE',
      ethDay: 1,
      ethMonth: 1,
      ethYear: 2015,
      familyLinks: [],
    },
  });

  // Fetch active clergy list to populate the spiritual father dropdown
  useEffect(() => {
    const fetchPriests = async () => {
      try {
        const res = await api.get('/clergy');
        setPriests(res.data.data ?? res.data ?? []);
      } catch (err) {
        console.error('Failed to load spiritual fathers', err);
      }
    };
    fetchPriests();
  }, []);

  const onSubmit = async (data: FormData) => {
    // Transform Ethiopian date to Gregorian ISO string
    const gregorianDate = ethiopianToGregorian(data.ethDay, data.ethMonth, data.ethYear);
    const payload = {
      ...data,
      dateOfBirthGregorian: gregorianDate.toISOString(),
      dateOfBirthEthiopian: `${String(data.ethDay).padStart(2, '0')}/${String(data.ethMonth).padStart(2, '0')}/${data.ethYear}`,
    };
    // Attempt online submission, fallback to offline queue
    try {
      await api.post('/parishioners', payload);
      if (onSuccess) onSuccess();
    } catch (e) {
      // network error – queue for later sync
      queueSubmission(payload);
      if (onSuccess) onSuccess();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ color: '#800020' }}>
              Personal Information
            </h2>
            <Controller
              name="firstNameEn"
              control={control}
              rules={{ required: 'English first name required' }}
              render={({ field }) => (
                <input placeholder="First Name (EN)" className="w-full p-2 border rounded" {...field} />
              )}
            />
            <Controller
              name="middleNameEn"
              control={control}
              render={({ field }) => (
                <input placeholder="Middle Name (EN)" className="w-full p-2 border rounded" {...field} />
              )}
            />
            <Controller
              name="lastNameEn"
              control={control}
              rules={{ required: 'English last name required' }}
              render={({ field }) => (
                <input placeholder="Last Name (EN)" className="w-full p-2 border rounded" {...field} />
              )}
            />
            <Controller
              name="firstNameAm"
              control={control}
              rules={{
                required: 'Amharic first name required',
                validate: (v) => isValidEthiopic(v) || 'Invalid Ethiopic characters',
              }}
              render={({ field }) => (
                <input placeholder="First Name (AM)" className="w-full p-2 border rounded" {...field} />
              )}
            />
            <Controller
              name="middleNameAm"
              control={control}
              rules={{
                validate: (v) => !v || isValidEthiopic(v) || 'Invalid Ethiopic characters',
              }}
              render={({ field }) => (
                <input placeholder="Middle Name (AM)" className="w-full p-2 border rounded" {...field} />
              )}
            />
            <Controller
              name="lastNameAm"
              control={control}
              rules={{
                required: 'Amharic last name required',
                validate: (v) => isValidEthiopic(v) || 'Invalid Ethiopic characters',
              }}
              render={({ field }) => (
                <input placeholder="Last Name (AM)" className="w-full p-2 border rounded" {...field} />
              )}
            />
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <select className="w-full p-2 border rounded" {...field}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              )}
            />
            <Controller
              name="phone"
              control={control}
              rules={{
                required: 'Phone required',
                validate: (v) => isValidPhone(v) || 'Invalid Ethiopian phone format',
              }}
              render={({ field }) => (
                <input placeholder="Phone (+251...)" className="w-full p-2 border rounded" {...field} />
              )}
            />
            <Controller
              name="email"
              control={control}
              rules={{
                pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Invalid email' },
              }}
              render={({ field }) => (
                <input placeholder="Email (optional)" className="w-full p-2 border rounded" {...field} />
              )}
            />
            <div className="grid grid-cols-3 gap-2">
              <Controller
                name="subcity"
                control={control}
                render={({ field }) => (
                  <input placeholder="Subcity" className="p-2 border rounded" {...field} />
                )}
              />
              <Controller
                name="woreda"
                control={control}
                render={({ field }) => (
                  <input placeholder="Woreda" className="p-2 border rounded" {...field} />
                )}
              />
              <Controller
                name="kebele"
                control={control}
                render={({ field }) => (
                  <input placeholder="Kebele" className="p-2 border rounded" {...field} />
                )}
              />
            </div>
             <div className="flex justify-end space-x-2 mt-4">
              {onCancel && (
                <button
                  type="button"
                  className="px-4 py-2 border rounded cursor-pointer hover:bg-white/5 transition text-gray-400"
                  style={{ borderColor: 'var(--eotc-border)' }}
                  onClick={onCancel}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="px-5 py-2 rounded-lg text-sm font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
                onClick={() => setStep(2)}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 2:
        const ethDay = watch('ethDay');
        const ethMonth = watch('ethMonth');
        const ethYear = watch('ethYear');
        let gregorianPreview = '';
        try {
          const g = ethiopianToGregorian(ethDay, ethMonth, ethYear);
          gregorianPreview = g.toISOString().split('T')[0];
        } catch (_) {}
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ color: '#800020' }}>Spiritual Information</h2>
            <Controller
              name="baptismalName"
              control={control}
              render={({ field }) => (
                <input placeholder="Baptismal Name" className="w-full p-2 border rounded" {...field} />
              )}
            />
            <Controller
              name="spiritualFatherId"
              control={control}
              render={({ field }) => (
                <select className="w-full p-2 border rounded" {...field} style={{ color: 'inherit', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <option value="" style={{ backgroundColor: 'var(--eotc-surface)' }}>Select Spiritual Father — የንስሐ አባት ምረጥ</option>
                  {priests.map((p: any) => (
                    <option key={p.id} value={p.id} style={{ backgroundColor: 'var(--eotc-surface)' }}>
                      {p.ordainedNameEn || p.fullName} ({p.rank})
                    </option>
                  ))}
                </select>
              )}
            />
            <Controller
              name="communionStatus"
              control={control}
              render={({ field }) => (
                <select className="w-full p-2 border rounded" {...field}>
                  <option value="ACTIVE">Active</option>
                  <option value="IRREGULAR">Irregular</option>
                  <option value="NONE">None</option>
                </select>
              )}
            />
            <div className="grid grid-cols-3 gap-2">
              <Controller
                name="ethDay"
                control={control}
                rules={{ required: true, min: 1, max: 30 }}
                render={({ field }) => (
                  <input type="number" placeholder="Day" className="p-2 border rounded" {...field} />
                )}
              />
              <Controller
                name="ethMonth"
                control={control}
                rules={{ required: true, min: 1, max: 13 }}
                render={({ field }) => (
                  <input type="number" placeholder="Month" className="p-2 border rounded" {...field} />
                )}
              />
              <Controller
                name="ethYear"
                control={control}
                rules={{ required: true, min: 1900 }}
                render={({ field }) => (
                  <input type="number" placeholder="Year" className="p-2 border rounded" {...field} />
                )}
              />
            </div>
            {gregorianPreview && (
              <p className="text-sm text-gray-600">
                Gregorian equivalent: <span className="font-medium">{gregorianPreview}</span>
              </p>
            )}
            <div className="flex justify-between mt-4">
              <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="px-4 py-2 bg-primary text-white rounded" onClick={() => setStep(3)}>
                Next
              </button>
            </div>
          </div>
        );
      case 3:
        const familyLinks = watch('familyLinks');
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ color: '#800020' }}>Family Connections</h2>
            {familyLinks.map((link, idx) => (
              <div key={idx} className="flex space-x-2 items-center">
                <select
                  className="p-2 border rounded"
                  value={link.relation}
                  onChange={(e) => {
                    const newLinks = [...familyLinks];
                    newLinks[idx].relation = e.target.value as any;
                    // @ts-ignore
                    control.setValue('familyLinks', newLinks);
                  }}
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                </select>
                <input
                  placeholder="Parishioner ID"
                  className="p-2 border rounded flex-1"
                  value={link.parishionerId}
                  onChange={(e) => {
                    const newLinks = [...familyLinks];
                    newLinks[idx].parishionerId = e.target.value;
                    // @ts-ignore
                    control.setValue('familyLinks', newLinks);
                  }}
                />
                <button
                  type="button"
                  className="p-2 text-red-600"
                  onClick={() => {
                    const newLinks = familyLinks.filter((_, i) => i !== idx);
                    // @ts-ignore
                    control.setValue('familyLinks', newLinks);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="px-3 py-1 bg-accent text-white rounded"
              onClick={() => {
                const newLinks = [...familyLinks, { relation: 'Spouse', parishionerId: '' }];
                // @ts-ignore
                control.setValue('familyLinks', newLinks);
              }}
            >
              Add Connection
            </button>
            <div className="flex justify-between mt-4">
              <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? <LoadingSpinner /> : <CheckIcon className="h-4 w-4 mr-1" />}
                Submit
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form className="max-w-3xl mx-auto p-4" onSubmit={handleSubmit(onSubmit)}>
      {renderStep()}
      {syncStatus && <p className="mt-2 text-sm text-gray-500">Sync status: {syncStatus}</p>}
    </form>
  );
};
