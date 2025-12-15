export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppMode {
  CINEMA = 'CINEMA',
  CHILL = 'CHILL'
}

export interface VideoConfig {
  url: string;
  type: 'youtube' | 'mp4' | 'embed';
}

export type ConnectionRole = 'HOST' | 'GUEST';

export type SyncActionType = 
  | 'VIDEO_CHANGE' 
  | 'HAND_HOLD' 
  | 'HAND_RELEASE'
  | 'PLAY'
  | 'PAUSE'
  | 'SEEK'
  | 'BUFFER_START'
  | 'BUFFER_END'
  | 'SUBTITLE_CHANGE'
  | 'SEND_GIFT';

export interface SyncEvent {
  type: SyncActionType;
  payload: any;
}

export interface SubtitleStyle {
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
}