import React, { useState, useEffect, useRef } from "react";
import { Search, Check, ShieldAlert, Sparkles, X, ChevronRight } from "lucide-react";
import { searchHtsCodes } from "../data/htsMasterDatabase";

export default function HtsAutoCompleteInput({
  value = "",
  onChange,
  onSelect,
  placeholder = "Search description (e.g. automotive parts, beef, steel coils, lumber, tires)...",
  className = "",
  autoFocus = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value && value.trim().length >= 1) {
      const results = searchHtsCodes(value, 8);
      setMatches(results);
      setIsOpen(results.length > 0);
    } else {
      setMatches([]);
      setIsOpen(false);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value && value.trim().length >= 1) {
              const results = searchHtsCodes(value, 8);
              setMatches(results);
              setIsOpen(results.length > 0);
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full px-3 py-2 bg-base-100 border border-slate-200 rounded-xl text-xs text-base-content placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium transition-all ${className}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Matching HTS Popover Dropdown */}
      {isOpen && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-base-100 border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100">
          <div className="px-3 py-2 bg-base-200 border-b border-slate-200 flex items-center justify-between text-[10px] text-base-content font-mono">
            <span className="flex items-center gap-1.5 text-sky-700 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Matching Harmonized Tariff Schedule (HTS) Codes ({matches.length})</span>
            </span>
            <span className="font-sans font-semibold text-slate-400">Click to auto-populate</span>
          </div>

          {matches.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-sky-50/60 transition-colors cursor-pointer flex items-start justify-between gap-3 text-left select-none group"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-50 text-sky-700 border border-sky-200">
                    {item.hts_code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {item.category}
                  </span>
                  {item.fda_required && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      FDA Prior Notice
                    </span>
                  )}
                  {item.is_hazmat && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Hazmat
                    </span>
                  )}
                </div>

                <div className="text-xs font-semibold text-slate-800 group-hover:text-sky-900 leading-snug">
                  {item.description}
                </div>

                <div className="text-[11px] text-base-content flex items-center gap-3 font-mono">
                  <span>Unit: <strong className="text-slate-700">{item.unit || "PCS"}</strong></span>
                  <span>Duty: <strong className="text-slate-700">{item.duty_rate_pct}%</strong></span>
                  <span className="text-emerald-700 font-bold">✓ USMCA 0% Tariff</span>
                  {item.pga && item.pga !== "None" && (
                    <span className="text-indigo-700 font-medium">PGA: {item.pga}</span>
                  )}
                </div>
              </div>

              <div className="text-slate-400 group-hover:text-sky-600 transition-colors pt-1">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
