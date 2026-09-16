import React from 'react';
import { LanguageCode } from '../types';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="relative inline-block text-right" id="lang-selector-container">
      <div className="flex items-center gap-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-lg border border-neutral-200 text-sm transition-all duration-200 shadow-sm">
        <Globe size={15} className="text-neutral-500" id="icon-globe-lang" />
        <select
          id="select-language-dropdown"
          value={currentLanguage}
          onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
          className="bg-transparent border-none outline-none font-medium cursor-pointer py-0.5"
        >
          <option value="ar">العربية (RTL)</option>
          <option value="en">English (LTR)</option>
          <option value="ur">اردو (RTL)</option>
        </select>
      </div>
    </div>
  );
}
