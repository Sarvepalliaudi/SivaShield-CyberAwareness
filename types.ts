export enum ModuleId {
  THREAT_ID = 'threat_id',
  PASSWORD = 'password',
  BRUTE_FORCE = 'brute_force',
  RANSOMWARE = 'ransomware',
  AES_DEMO = 'aes_demo',
  CHATBOT = 'chatbot',
  ADMIN = 'admin',
}

export interface Module {
  id: ModuleId;
  titleKey: string;
  descriptionKey: string;
  icon: React.FC<{className?: string}>;
}

export interface LogEntry {
  id: string;
  moduleId: ModuleId;
  timestamp: string;
  data: Record<string, any>;
  userResponse: string;
}

export interface QuizQuestion {
  questionKey: string;
  optionsKey: string[];
  correctOptionIndex: number;
  explanationKey: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}