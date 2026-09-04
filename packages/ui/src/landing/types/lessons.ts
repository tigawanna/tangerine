export interface LessonItem {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  title: string;
  description: string;
  markdown: string;
  richtext: string;
  type: string;
  gist?: string;
}

export interface LessonPreviewItem extends Omit<LessonItem, "markdown" | "richtext"> {
  createdLabel: string;
  previewHtml: string | null;
}

export interface LessonsPage {
  page: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
  items: LessonItem[];
}

export interface LessonsPreviewPage extends Omit<LessonsPage, "items"> {
  items: LessonPreviewItem[];
}
