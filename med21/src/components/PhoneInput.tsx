import React, { useState, useEffect } from 'react';

const COUNTRIES = [
  { code: '+971', name: 'UAE', digits: 9 },
  { code: '+966', name: 'KSA', digits: 9 },
  { code: '+974', name: 'Qatar', digits: 8 },
  { code: '+973', name: 'Bahrain', digits: 8 },
  { code: '+968', name: 'Oman', digits: 8 },
  { code: '+965', name: 'Kuwait', digits: 8 },
  { code: '+20', name: 'Egypt', digits: 10 },
  { code: '+1', name: 'US/CA', digits: 10 },
  { code: '+44', name: 'UK', digits: 10 },
  { code: '+91', name: 'India', digits: 10 },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  error?: string;
  className?: string;
  inputClassName?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export default function PhoneInput({
  value,
  onChange,
  error,
  className = '',
  inputClassName = '',
  label = 'Mobile Number',
  required = false,
  placeholder,
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('+971');
  const [digits, setDigits] = useState('');

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  const maxDigits = selectedCountry.digits;

  useEffect(() => {
    if (value) {
      const match = value.match(/^(\+\d+)\s*(.*)$/);
      if (match) {
        const code = match[1];
        const d = match[2].replace(/\D/g, '');
        const country = COUNTRIES.find(c => c.code === code);
        if (country) {
          setCountryCode(code);
          setDigits(d.slice(0, country.digits));
          return;
        }
      }
      setDigits(value.replace(/\D/g, '').slice(0, maxDigits));
    }
  }, []);

  const emit = (code: string, d: string) => {
    onChange(d ? `${code} ${d}` : '');
  };

  const handleDigitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDigits = e.target.value.replace(/\D/g, '').slice(0, maxDigits);
    setDigits(newDigits);
    emit(countryCode, newDigits);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    const newCountry = COUNTRIES.find(c => c.code === newCode);
    const truncated = digits.slice(0, newCountry?.digits || 9);
    setDigits(truncated);
    emit(newCode, truncated);
  };

  return (
    <div className={className}>
      <div className="relative flex items-center">
        <select
          value={countryCode}
          onChange={handleCountryChange}
          className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 border-r-0 rounded-l-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.code} ({c.name})</option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={maxDigits}
          placeholder={placeholder || (selectedCountry.code === '+971' ? '5X XXX XXXX' : `${'X'.repeat(maxDigits)}`)}
          value={digits}
          onChange={handleDigitChange}
          className={`flex-1 min-w-0 text-xs border rounded-r-xl p-3 focus:outline-hidden focus:ring-1 ${
            error
              ? 'border-red-500 focus:ring-red-500 bg-red-50/5'
              : 'border-slate-200 focus:ring-emerald-500'
          } ${inputClassName}`}
        />
      </div>
    </div>
  );
}
