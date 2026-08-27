import React, { useState } from 'react';
import { DEFAULT_COUNTRIES } from '../../data/defaultData';
import { CountryCodeItem } from '../../types';
import { Search, Globe, Check, ArrowLeft } from 'lucide-react';

interface CountryCodeViewProps {
  selectedDialCode: string;
  onSelectCountry: (country: CountryCodeItem) => void;
  onBack: () => void;
}

export const CountryCodeView: React.FC<CountryCodeViewProps> = ({
  selectedDialCode,
  onSelectCountry,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = DEFAULT_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#070913] text-slate-200">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <button
          onClick={onBack}
          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Country Code</h2>
          <p className="text-[10px] text-slate-400 font-sans">Default: India (+91)</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-white/5 bg-[#0C1021]/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search country name or code..."
            className="w-full bg-[#070913] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-sans"
            autoFocus
          />
        </div>
      </div>

      {/* Country List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredCountries.map((country) => {
          const isSelected = selectedDialCode === country.dialCode;
          return (
            <button
              key={`${country.code}-${country.dialCode}`}
              onClick={() => {
                onSelectCountry(country);
                onBack();
              }}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-colors text-left ${
                isSelected
                  ? 'bg-blue-600/20 border border-blue-500/50 text-white'
                  : 'bg-transparent hover:bg-white/5 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{country.flag}</span>
                <div>
                  <div className="text-xs font-medium text-white">{country.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{country.code}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400">{country.dialCode}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {filteredCountries.length === 0 && (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            No matching country code found.
          </div>
        )}
      </div>

    </div>
  );
};
