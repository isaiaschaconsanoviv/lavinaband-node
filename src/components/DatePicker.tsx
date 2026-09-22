'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { es } from 'date-fns/locale';

interface DatePickerProps {
  value: Date | string | null;
  onChange: (date: Date) => void;
  className?: string;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, className = '', placeholder = 'Seleccionar fecha' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDateClick = (day: Date) => {
    onChange(day);
    setIsOpen(false);
  };

  const displayFormat = "dd 'de' MMM, yyyy";

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 bg-zinc-900/40 border border-zinc-700/50 hover:bg-zinc-800/60 rounded-xl text-zinc-300 text-sm font-medium transition-colors flex items-center gap-2 ${className}`}
      >
        <span>📅</span>
        {selectedDate ? format(selectedDate, displayFormat, { locale: es }) : placeholder}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl z-50 w-72 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
              &larr;
            </button>
            <span className="font-semibold text-zinc-100 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button type="button" onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
              &rarr;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-semibold text-zinc-500">
            {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all
                    ${!isCurrentMonth ? 'text-zinc-600' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}
                    ${isTodayDate && !isSelected ? 'border border-blue-500/50 text-blue-400' : ''}
                    ${isSelected ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}