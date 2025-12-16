// src/acs/CallManager.ts
import { CallAutomationClient, CallConnection, CallMedia, CallInvite, CallMediaRecognizeSpeechOptions, DtmfTone } from "@azure/communication-call-automation";
import { PhoneNumberIdentifier } from "@azure/communication-common";
import { config } from "../config";
import { EventEmitter } from 'events';

export class CallManager extends EventEmitter {
  private client: CallAutomationClient;
  private callConnection: CallConnection | undefined;
  private callMedia: CallMedia | undefined;
  private targetParticipant: PhoneNumberIdentifier | undefined;

  constructor() {
    super();
    this.client = new CallAutomationClient(config.connectionString);
  }

  async startCall(targetPhoneNumber: string) {
    console.log(`Starting call to ${targetPhoneNumber}...`);
    const target: PhoneNumberIdentifier = { phoneNumber: targetPhoneNumber };
    this.targetParticipant = target;

    // CallInvite requires targetParticipant
    const callInvite: CallInvite = { targetParticipant: target };

    let options: CallInvite = callInvite;

    if (config.sourcePhoneNumber) {
        const source: PhoneNumberIdentifier = { phoneNumber: config.sourcePhoneNumber };
        options = {
            targetParticipant: target,
            sourceCallIdNumber: source
        };
    }

    try {
        const response = await this.client.createCall(options, config.callbackUri);
        this.callConnection = response.callConnection;
        this.callMedia = this.callConnection.getCallMedia();
        console.log(`Call initiated. CallConnectionId: ${response.callConnectionProperties.callConnectionId}`);
        return response.callConnectionProperties.callConnectionId;
    } catch (error) {
        console.error("Failed to start call:", error);
        throw error;
    }
  }

  async hangUp() {
    if (this.callConnection) {
      await this.callConnection.hangUp(true);
      console.log("Call hung up.");
    }
  }

  async sendDtmf(tones: string[]) {
    if (!this.callMedia || !this.targetParticipant) return;

    // Convert string tones to DtmfTone enum
    const dtmfTones: DtmfTone[] = tones.map(t => {
        switch(t) {
            case '0': return 'Zero';
            case '1': return 'One';
            case '2': return 'Two';
            case '3': return 'Three';
            case '4': return 'Four';
            case '5': return 'Five';
            case '6': return 'Six';
            case '7': return 'Seven';
            case '8': return 'Eight';
            case '9': return 'Nine';
            case '*': return 'Asterisk';
            case '#': return 'Pound';
            case 'A': return 'A';
            case 'B': return 'B';
            case 'C': return 'C';
            case 'D': return 'D';
            default: return 'Zero'; // Fallback
        }
    }) as unknown as DtmfTone[];

    // Use sendDtmfTones method
    await this.callMedia.sendDtmfTones(dtmfTones, this.targetParticipant);
  }

  async playText(text: string) {
    if (!this.callMedia) return;
    // CallAutomation supports playToAll
    await this.callMedia.playToAll([{ text: text, kind: "textSource" }]);
  }

  async startRecognizing() {
    if (!this.callMedia || !this.targetParticipant) return;
    console.log("Start recognizing...");

    const recognizeOptions: CallMediaRecognizeSpeechOptions = {
        kind: "callMediaRecognizeSpeechOptions",
        endSilenceTimeoutInSeconds: 1
    };

    try {
        await this.callMedia.startRecognizing(this.targetParticipant, recognizeOptions);
    } catch (error) {
        console.error("Error starting recognition:", error);
    }
  }

  // Method to handle incoming events from webhook
  handleEvent(event: any) {
      // Dispatch events to listeners
      if (event.type === "Microsoft.Communication.RecognizeCompleted") {
          this.emit('recognizeCompleted', event.data);
      } else if (event.type === "Microsoft.Communication.RecognizeFailed") {
          this.emit('recognizeFailed', event.data);
      } else if (event.type === "Microsoft.Communication.CallConnected") {
          this.emit('callConnected', event.data);
      } else if (event.type === "Microsoft.Communication.CallDisconnected") {
          this.emit('callDisconnected', event.data);
      } else if (event.type === "Microsoft.Communication.PlayCompleted") {
          this.emit('playCompleted', event.data);
      } else if (event.type === "Microsoft.Communication.PlayFailed") {
          this.emit('playFailed', event.data);
      } else if (event.type === "Microsoft.Communication.SendDtmfTonesCompleted") {
          this.emit('sendDtmfCompleted', event.data);
      } else if (event.type === "Microsoft.Communication.SendDtmfTonesFailed") {
          this.emit('sendDtmfFailed', event.data);
      }
  }
}
