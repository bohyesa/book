
import React, { useState, useRef, useEffect } from 'react';
import { Chapter, Section } from '../types';

interface TableOfContentsProps {
  chapters: Chapter[];
  onSelect: (chapter: Chapter, section: Section, paragraphIndex?: number) => void;
  lastRead: { chapterId: string; sectionId: string } | null;
  onContinue: () => void;
  bookmarks: string[];
  onToggleBookmark: (sectionId: string, index: number) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  chapters, 
  onSelect, 
  lastRead, 
  onContinue, 
  bookmarks,
  onToggleBookmark 
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');
  const [showGuide, setShowGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const lastReadRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    // IOS 여부 확인
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
  }, []);

  // 목록으로 돌아왔을 때 읽던 위치로 자동 스크롤
  useEffect(() => {
    if (activeTab === 'all' && lastRead && lastReadRef.current) {
      const timer = setTimeout(() => {
        lastReadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300); // 레이아웃 렌더링 후 스크롤
      return () => clearTimeout(timer);
    }
  }, [activeTab, lastRead]);

  const handleShare = async () => {
    const shareData = {
      title: '천국의 비밀 계시',
      text: '창조주 참 하나님에 대한 심도 있는 계시와 가르침을 담은 성경 해설 앱입니다.',
      url: window.location.origin + window.location.pathname,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('링크가 클립보드에 복사되었습니다.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('공유 실패:', err);
    }
  };

  const openBlog = () => {
    window.open('https://blog.naver.com/seoulbohyesa', '_blank');
  };

  const getBookmarkData = (bookmarkKey: string) => {
    const [sectionId, indexStr] = bookmarkKey.split('|');
    const index = parseInt(indexStr);
    for (const chapter of chapters) {
      const section = chapter.sections.find(s => s.id === sectionId);
      if (section && section.content[index]) {
        return { chapter, section, text: section.content[index], index };
      }
    }
    return null;
  };

  const lastReadTitle = lastRead 
    ? chapters.find(c => c.id === lastRead.chapterId)?.sections.find(s => s.id === lastRead.sectionId)?.title
    : (chapters[0]?.sections[0]?.title || "시작하기");

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark transition-colors duration-300 relative">
      <header className="p-4 pt-6 flex items-center justify-center relative border-b border-slate-100 dark:border-slate-800/50">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">천국의비밀계시</h1>
        
        <div className="absolute right-4 flex items-center gap-1.5">
          <button 
            onClick={() => setShowGuide(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
            title="홈 화면에 추가"
          >
            <span className="material-symbols-outlined text-[20px]">add_to_home_screen</span>
          </button>

          <button 
            onClick={handleShare}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
            title="공유하기"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>

          <button 
            onClick={openBlog}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white hover:bg-primary/90 transition-all active:scale-90 shadow-md shadow-primary/10"
            title="공식 블로그 이동"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
          </button>
        </div>
      </header>

      {/* 바로가기 가이드 모달 */}
      {showGuide && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowGuide(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-primary p-4 text-white flex items-center gap-2">
              <span className="material-symbols-outlined">install_mobile</span>
              <span className="font-bold">홈 화면에 바로가기 추가</span>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                이 앱을 스마트폰 홈 화면에 설치하여 언제든 편하게 접속하세요.
              </p>
              
              <div className="space-y-3">
                {isIOS ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3 text-sm">
                      <span className="bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                      <p>Safari 하단바 중앙의 <b>[공유 아이콘 <span className="material-symbols-outlined text-[16px] inline align-text-bottom">ios_share</span>]</b>을 누릅니다.</p>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                      <p>메뉴를 아래로 내려 <b>[홈 화면에 추가]</b>를 선택합니다.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3 text-sm">
                      <span className="bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                      <p>브라우저 우측 상단의 <b>[메뉴 아이콘 <span className="material-symbols-outlined text-[16px] inline align-text-bottom">more_vert</span>]</b>을 누릅니다.</p>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <span className="bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                      <p><b>[앱 설치]</b> 또는 <b>[홈 화면에 추가]</b>를 선택합니다.</p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowGuide(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition-colors active:bg-slate-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex bg-slate-200 dark:bg-surface-dark p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'all' 
                ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            전체 목록
          </button>
          <button 
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === 'bookmarks' 
                ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bookmark</span>
            북마크
            {bookmarks.length > 0 && (
              <span className="bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1">
                {bookmarks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-28">
        {activeTab === 'all' ? (
          <div className="space-y-3">
            {chapters.map((chapter) => {
              // 현재 장에 읽던 섹션이 포함되어 있으면 자동으로 열어둠
              const isLastReadInChapter = lastRead?.chapterId === chapter.id;
              
              return (
                <details 
                  key={chapter.id} 
                  open={isLastReadInChapter || (lastRead === null && chapter.number === 0)}
                  className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-primary text-[10px] font-bold uppercase tracking-wider">
                        {chapter.number === 0 ? 'INTRO' : `제${chapter.number}장`}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{chapter.title}</h2>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    <ul className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {chapter.sections.map((section) => {
                        const isCurrent = lastRead?.sectionId === section.id;
                        return (
                          <li key={section.id} ref={isCurrent ? lastReadRef : null}>
                            <button 
                              onClick={() => onSelect(chapter, section)}
                              className="w-full text-left px-5 py-4 text-base font-medium text-slate-700 dark:text-slate-50 hover:bg-primary/5 transition-all flex items-center justify-between"
                            >
                              <span className={isCurrent ? 'font-bold text-primary dark:text-blue-400' : ''}>
                                {section.title}
                              </span>
                              {isCurrent ? (
                                <span className="material-symbols-outlined text-[20px] text-primary dark:text-blue-400">menu_book</span>
                              ) : (
                                <span className="material-symbols-outlined text-[20px] opacity-40 text-slate-400 dark:text-slate-200">chevron_right</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.length > 0 ? (
              bookmarks.map((key) => {
                const data = getBookmarkData(key);
                if (!data) return null;
                return (
                  <div key={key} className="bg-white dark:bg-surface-dark border border-amber-100 dark:border-amber-900/30 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-50 dark:border-amber-900/20">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase">
                          {data.chapter.number === 0 ? 'INTRO' : `제${data.chapter.number}장`} • {data.section.title}
                        </span>
                      </div>
                      <button 
                        onClick={() => onToggleBookmark(data.section.id, data.index)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => onSelect(data.chapter, data.section, data.index)}
                      className="p-4 text-left group active:bg-slate-50 dark:active:bg-slate-800/50"
                    >
                      <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed italic">
                        "{data.text.startsWith('*') ? data.text.substring(2) : data.text}"
                      </p>
                      <div className="mt-3 flex items-center text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        본문 보기 <span className="material-symbols-outlined text-[14px] ml-1">arrow_forward</span>
                      </div>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <span className="material-symbols-outlined text-[48px] opacity-20">bookmark_border</span>
                <p className="text-sm">북마크한 문장이 없습니다.</p>
                <p className="text-xs opacity-60">본문에서 문장을 길게 누르면 북마크가 됩니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent pt-10 pointer-events-none flex justify-center">
        <button 
          onClick={onContinue}
          className="pointer-events-auto w-full max-w-[480px] h-14 bg-[#0d47a1] hover:bg-[#0a3a85] active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 transition-all"
        >
          <span className="material-symbols-outlined">menu_book</span>
          <span className="truncate text-sm sm:text-base px-2">이어보기: {lastReadTitle}</span>
        </button>
      </div>
    </div>
  );
};

export default TableOfContents;
