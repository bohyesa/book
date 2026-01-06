
import React, { useState, useEffect, useRef } from 'react';
import { Chapter, Section, ViewState, FontSize } from './types';
import { chapters } from './data';
import TableOfContents from './components/TableOfContents';
import Reader from './components/Reader';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('toc');
  const [currentChapter, setCurrentChapter] = useState<Chapter>(chapters[0]);
  const [currentSection, setCurrentSection] = useState<Section>(chapters[0].sections[0]);
  const [targetParagraphIdx, setTargetParagraphIdx] = useState<number | null>(null);
  const [lastRead, setLastRead] = useState<{ chapterId: string; sectionId: string } | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState<FontSize>('text-lg');
  
  // 종료 확인 관련 상태
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    // 초기 진입 시 히스토리 스택에 'toc' 상태 추가 (뒤로 가기 가로채기용)
    window.history.replaceState({ view: 'toc' }, '');
    
    const timer = setTimeout(() => {
      if ((window as any).removeSplash) (window as any).removeSplash();
    }, 500);

    const savedBookmarks = localStorage.getItem('heavenly_bookmarks_v2');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    
    const savedLastRead = localStorage.getItem('heavenly_last_read');
    if (savedLastRead) setLastRead(JSON.parse(savedLastRead));
    
    const savedFontSize = localStorage.getItem('heavenly_font_size');
    if (savedFontSize) setFontSize(savedFontSize as FontSize);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;

      if (view === 'reader') {
        // Reader에서 뒤로 가기 -> TOC로 이동
        setView('toc');
        setTargetParagraphIdx(null);
      } else if (view === 'toc') {
        // TOC(홈)에서 뒤로 가기 -> 종료 확인 로직
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          // 2초 이내에 다시 누르면 브라우저의 실제 뒤로 가기 실행 (앱 종료 효과)
          window.history.back();
        } else {
          // 첫 번째 뒤로 가기: 토스트 띄우고 히스토리 복구
          lastBackPressTime.current = now;
          setShowExitToast(true);
          setTimeout(() => setShowExitToast(false), 2000);
          
          // 히스토리를 다시 밀어넣어 다음 뒤로 가기를 다시 가로챌 수 있게 함
          window.history.pushState({ view: 'toc' }, '');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('heavenly_bookmarks_v2', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    if (lastRead) localStorage.setItem('heavenly_last_read', JSON.stringify(lastRead));
  }, [lastRead]);

  useEffect(() => {
    localStorage.setItem('heavenly_font_size', fontSize);
  }, [fontSize]);

  const toggleBookmark = (sectionId: string, index: number) => {
    const bookmarkKey = `${sectionId}|${index}`;
    setBookmarks(prev => 
      prev.includes(bookmarkKey) 
        ? prev.filter(id => id !== bookmarkKey) 
        : [...prev, bookmarkKey]
    );
  };

  const handleSelectSection = (chapter: Chapter, section: Section, paragraphIndex: number | null = null) => {
    setCurrentChapter(chapter);
    setCurrentSection(section);
    setTargetParagraphIdx(paragraphIndex);
    setView('reader');
    setLastRead({ chapterId: chapter.id, sectionId: section.id });
    
    // Reader 화면으로 갈 때 히스토리 추가
    window.history.pushState({ view: 'reader' }, '');
  };

  const handleBackToToc = () => {
    if (view === 'reader') window.history.back();
  };

  const handleNextSection = () => {
    const currentChapterIdx = chapters.findIndex(c => c.id === currentChapter.id);
    const currentSectionIdx = currentChapter.sections.findIndex(s => s.id === currentSection.id);
    if (currentSectionIdx < currentChapter.sections.length - 1) {
      handleSelectSection(currentChapter, currentChapter.sections[currentSectionIdx + 1]);
      return;
    } 
    for (let i = currentChapterIdx + 1; i < chapters.length; i++) {
      if (chapters[i].sections.length > 0) {
        handleSelectSection(chapters[i], chapters[i].sections[0]);
        return;
      }
    }
  };

  const handlePrevSection = () => {
    const currentChapterIdx = chapters.findIndex(c => c.id === currentChapter.id);
    const currentSectionIdx = currentChapter.sections.findIndex(s => s.id === currentSection.id);
    if (currentSectionIdx > 0) {
      handleSelectSection(currentChapter, currentChapter.sections[currentSectionIdx - 1]);
      return;
    } 
    for (let i = currentChapterIdx - 1; i >= 0; i--) {
      if (chapters[i].sections.length > 0) {
        handleSelectSection(chapters[i], chapters[i].sections[chapters[i].sections.length - 1]);
        return;
      }
    }
  };

  const continueReading = () => {
    if (lastRead) {
      const chapter = chapters.find(c => c.id === lastRead.chapterId);
      const section = chapter?.sections.find(s => s.id === lastRead.sectionId);
      if (chapter && section) {
        handleSelectSection(chapter, section);
        return;
      }
    }
    handleSelectSection(chapters[0], chapters[0].sections[0]);
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden flex flex-col relative transition-colors duration-300">
      {view === 'toc' ? (
        <TableOfContents 
          chapters={chapters} 
          onSelect={handleSelectSection} 
          lastRead={lastRead}
          onContinue={continueReading}
          bookmarks={bookmarks}
          onToggleBookmark={toggleBookmark}
        />
      ) : (
        <Reader 
          chapter={currentChapter} 
          section={currentSection} 
          targetParagraphIdx={targetParagraphIdx}
          onBack={handleBackToToc}
          onNext={handleNextSection}
          onPrev={handlePrevSection}
          bookmarks={bookmarks}
          onToggleBookmark={toggleBookmark}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
        />
      )}

      {/* 종료 확인 토스트 */}
      <div 
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 pointer-events-none
          ${showExitToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-5 py-2.5 rounded-full text-sm font-medium shadow-2xl backdrop-blur-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">info</span>
          뒤로 가기 버튼을 한번 더 누르시면 종료됩니다.
        </div>
      </div>
    </div>
  );
};

export default App;
