// src/llm/OpenAIClient.ts
import OpenAI from 'openai';
import { LLMInterface, Action } from './LLMInterface';
import { config } from '../config';

export class OpenAIClient implements LLMInterface {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openAiApiKey,
    });
  }

  async generateResponse(prompt: string, context: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: prompt }
      ]
    });
    return response.choices[0].message.content || '';
  }

  async decideAction(transcription: string): Promise<Action> {
    const systemPrompt = `
You are an IVR testing assistant. Your job is to navigate an IVR system.
You will receive the transcription of what the IVR system said.
You need to decide what action to take.
The available actions are:
- DTMF: Press keys (e.g. "1", "123").
- SPEAK: Speak a phrase (e.g. "My account number is 123").
- HANGUP: Hang up the call.
- WAIT: Wait for more audio (if the prompt seems incomplete).

Output the action in JSON format:
{
  "type": "DTMF" | "SPEAK" | "HANGUP" | "WAIT",
  "value": "string value if needed"
}

Example:
IVR: "Press 1 for sales, press 2 for support."
Action: {"type": "DTMF", "value": "1"}

IVR: "Please say your name."
Action: {"type": "SPEAK", "value": "John Doe"}
`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcription }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    try {
      return JSON.parse(content) as Action;
    } catch (e) {
      console.error('Failed to parse LLM response', e);
      return { type: 'WAIT' };
    }
  }
}
