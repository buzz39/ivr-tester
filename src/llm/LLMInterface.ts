// src/llm/LLMInterface.ts
export interface LLMInterface {
  generateResponse(prompt: string, context: string): Promise<string>;
  decideAction(transcription: string): Promise<Action>;
}

export type ActionType = 'DTMF' | 'SPEAK' | 'HANGUP' | 'WAIT';

export interface Action {
  type: ActionType;
  value?: string; // DTMF tones or text to speak
}
