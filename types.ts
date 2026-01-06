
export interface Section {
  id: string;
  title: string;
  content: string[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  sections: Section[];
}

export type ViewState = 'toc' | 'reader';

export type FontSize = 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl';
