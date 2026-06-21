/**
 * Types representing the models used in the Keyword Content Downloader.
 */

export interface UrlItem {
  url: string;
  title: string;
  description: string;
  size?: string; // Estimated or pre-calculated size
}

export interface KeywordSearchResults {
  keyword: string;
  urls: UrlItem[];
}

export type DownloadStatus = 'idle' | 'connecting' | 'downloading' | 'completed' | 'failed';

export interface DownloadProgress {
  url: string;
  status: DownloadStatus;
  loaded: number;
  total: number;
  progress: number; // percentage 0 - 100
  error?: string;
  sizeFormatted?: string;
}

export interface DownloadedItem {
  id: string; // url as a unique identifier or hash
  url: string;
  keyword: string;
  title: string;
  content: string;
  sizeBytes: number;
  downloadedAt: string;
}
