
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chapter, Section, FontSize } from '../types';
import { chapters } from '../data';

interface ReaderProps {
  chapter: Chapter;
  section: Section;
  targetParagraphIdx: number | null;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  bookmarks: string[];
  onToggleBookmark: (sectionId: string, index: number) => void;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
}

const Reader: React.FC<ReaderProps> = ({ 
  chapter, 
  section, 
  targetParagraphIdx,
  onBack, 
  onNext, 
  onPrev,
  bookmarks,
  onToggleBookmark,
  fontSize,
  onFontSizeChange
}) => {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const [pressingIdx, setPressingIdx] = useState<number | null>(null);
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);

  const progressPercent = useMemo(() => {
    const allSections = chapters.flatMap(c => c.sections);
    const totalCount = allSections.length;
    if (totalCount === 0) return 0;
    
    const currentIndex = allSections.findIndex(s => s.id === section.id);
    return Math.max(5, ((currentIndex + 1) / totalCount) * 100);
  }, [section.id]);

  useEffect(() => {
    if (targetParagraphIdx !== null) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`para-${targetParagraphIdx}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [section.id, targetParagraphIdx]);

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    if ('touches' in e) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      touchStartPos.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    }

    setPressingIdx(index);
    longPressTimer.current = window.setTimeout(() => {
      onToggleBookmark(section.id, index);
      setPressingIdx(null);
      if (navigator.vibrate) navigator.vibrate(40);
    }, 1000);
  };

  const handlePressMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;

    const currentX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const currentY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = Math.abs(currentX - touchStartPos.current.x);
    const dy = Math.abs(currentY - touchStartPos.current.y);

    if (dx > 8 || dy > 8) {
      cancelPress();
    }
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressingIdx(null);
    touchStartPos.current = null;
  };

  const handleContentClick = () => {
    if (showFontMenu) {
      setShowFontMenu(false);
    }
  };

  const fontOptions: { label: string; value: FontSize; icon: string }[] = [
    { label: '작게', value: 'text-base', icon: 'text_fields' },
    { label: '보통', value: 'text-lg', icon: 'text_fields' },
    { label: '크게', value: 'text-xl', icon: 'text_fields' },
    { label: '아주 크게', value: 'text-2xl', icon: 'text_fields' },
  ];

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark transition-colors duration-300 overflow-hidden select-none">
      <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>
          
          <div className="flex flex-col items-center flex-1 mx-2 overflow-hidden">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate w-full text-center">
              {chapter.number === 0 ? '' : `제${chapter.number}장 `}{chapter.title}
            </h1>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate w-full text-center">
              {section.title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowFontMenu(!showFontMenu);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                showFontMenu ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">text_fields</span>
            </button>
          </div>
        </div>
        
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-primary transition-all duration-700 ease-in-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {showFontMenu && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-surface-dark shadow-xl border-b border-slate-200 dark:border-slate-800 p-4 animate-slide-up z-50">
            <div className="flex items-center justify-between gap-2">
              {fontOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFontSizeChange(opt.value);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    fontSize === opt.value 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={`material-symbols-outlined`} style={{ fontSize: opt.value === 'text-base' ? '18px' : opt.value === 'text-lg' ? '22px' : opt.value === 'text-xl' ? '26px' : '30px' }}>
                    {opt.icon}
                  </span>
                  <span className="text-[10px] font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 pb-32"
        onClick={handleContentClick}
      >
        <div className="mb-8 text-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            {section.title.split('. ')[1] || section.title}
          </h2>
          <div className="w-10 h-1 bg-primary/40 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-6">
          {section.content.map((para, idx) => {
            const isBookmarked = bookmarks.includes(`${section.id}|${idx}`);
            const isPressing = pressingIdx === idx;

            return (
              <p 
                key={idx}
                id={`para-${idx}`}
                onMouseDown={(e) => handlePressStart(e, idx)}
                onMouseMove={handlePressMove}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onTouchStart={(e) => handlePressStart(e, idx)}
                onTouchMove={handlePressMove}
                onTouchEnd={cancelPress}
                onContextMenu={(e) => e.preventDefault()}
                style={{ WebkitTouchCallout: 'none' }}
                className={`${fontSize} leading-[1.8] text-slate-800 dark:text-slate-200 break-keep transition-all duration-200 rounded-lg p-2 -mx-2 relative cursor-pointer active:scale-[0.99] touch-pan-y
                  ${isBookmarked ? 'bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 shadow-sm' : ''}
                  ${isPressing ? 'bg-primary/10 scale-[1.01]' : ''}
                  ${para === '예수 그리스도의 대언자' ? 'text-center font-bold mt-12 mb-8' : ''}`}
              >
                {para.startsWith('*') ? (
                  <span className="flex items-start">
                    <span className="text-primary font-bold mr-1.5 mt-0.5">*</span>
                    <span>{para.substring(2)}</span>
                  </span>
                ) : para}
                
                {isBookmarked && (
                  <span className="absolute -right-1 -top-1 material-symbols-outlined text-[14px] text-amber-500 fill-[1]">bookmark</span>
                )}
              </p>
            );
          })}
        </div>

        {/* 북마크 안내 가이드 */}
        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span className="text-xs font-medium italic">문장을 길게 누르면 북마크가 됩니다.</span>
          </div>
          <div className="h-10"></div>
        </div>
      </main>

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 pointer-events-none z-30">
        <div className="max-w-md mx-auto flex items-center justify-between pointer-events-auto">
          <button 
            onClick={onPrev}
            className="group flex items-center gap-3 pl-3 pr-5 py-3 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 active:scale-90 transition-all"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">PREV</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">이전</span>
            </div>
          </button>

          <button 
            onClick={onBack}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">list</span>
            <span className="text-[10px] font-bold mt-0.5">목록</span>
          </button>

          <button 
            onClick={onNext}
            className="group flex items-center gap-3 pl-5 pr-3 py-3 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 active:scale-90 transition-all"
          >
            <div className="flex flex-col items-end leading-none">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">NEXT</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">다음</span>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reader;
