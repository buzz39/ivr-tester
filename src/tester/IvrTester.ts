// src/tester/IvrTester.ts
import { CallManager } from "../acs/CallManager";
import { LLMInterface } from "../llm/LLMInterface";
import { config } from "../config";

export class IvrTester {
  private callManager: CallManager;
  private llm: LLMInterface;
  private isRunning: boolean = false;

  constructor(callManager: CallManager, llm: LLMInterface) {
    this.callManager = callManager;
    this.llm = llm;

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.callManager.on('callConnected', async (data) => {
      console.log('Call Connected! Waiting for initial prompt...');
      // Start listening to the IVR
      await this.callManager.startRecognizing();
    });

    this.callManager.on('callDisconnected', (data) => {
      console.log('Call Disconnected.');
      this.isRunning = false;
    });

    // Handle PlayCompleted to resume listening after speaking
    this.callManager.on('playCompleted', async (data) => {
         console.log('Playback completed. Resuming recognition...');
         await this.callManager.startRecognizing();
    });

     // Handle PlayFailed
    this.callManager.on('playFailed', async (data) => {
        console.error('Playback failed. Resuming recognition anyway...');
        await this.callManager.startRecognizing();
    });

    // Handle SendDtmfCompleted
    this.callManager.on('sendDtmfCompleted', async (data) => {
        console.log('DTMF sent. Resuming recognition...');
        await this.callManager.startRecognizing();
    });

     // Handle SendDtmfFailed
    this.callManager.on('sendDtmfFailed', async (data) => {
         console.error('DTMF send failed. Resuming recognition anyway...');
         await this.callManager.startRecognizing();
    });

    this.callManager.on('recognizeCompleted', async (data) => {
      console.log('Recognize Completed:', data);
      const transcription = data.speechResult?.text;

      if (!transcription) {
          console.log("No transcription received, retrying recognition...");
          await this.callManager.startRecognizing();
          return;
      }

      console.log(`IVR Said: "${transcription}"`);

      // Ask LLM what to do
      const action = await this.llm.decideAction(transcription);
      console.log('LLM Decided:', action);

      switch (action.type) {
        case 'DTMF':
            if (action.value) {
                const tones = action.value.split('');
                await this.callManager.sendDtmf(tones);
                // Waiting for sendDtmfCompleted event to loop back
            } else {
                 // No tones, just listen again
                 await this.callManager.startRecognizing();
            }
            break;
        case 'SPEAK':
            if (action.value) {
                await this.callManager.playText(action.value);
                // Waiting for playCompleted event to loop back
            } else {
                await this.callManager.startRecognizing();
            }
            break;
        case 'HANGUP':
            await this.callManager.hangUp();
            return;
        case 'WAIT':
            // Just listen again
            await this.callManager.startRecognizing();
            break;
        default:
             await this.callManager.startRecognizing();
             break;
      }
    });

    this.callManager.on('recognizeFailed', async (data) => {
        console.error('Recognize Failed:', data);
        // Retry?
        if (this.isRunning) {
             // Maybe wait a bit?
             setTimeout(async () => {
                 await this.callManager.startRecognizing();
             }, 1000);
        }
    });
  }

  async run(phoneNumber?: string) {
    this.isRunning = true;
    const target = phoneNumber || config.targetPhoneNumber;
    if (!target) {
        console.error("No target phone number provided.");
        this.isRunning = false;
        return;
    }
    try {
      await this.callManager.startCall(target);
    } catch (e) {
      console.error("Failed to run test:", e);
      this.isRunning = false;
    }
  }
}
