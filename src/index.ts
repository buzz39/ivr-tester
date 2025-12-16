// src/index.ts
import { config } from './config';
import { CallManager } from './acs/CallManager';
import { OpenAIClient } from './llm/OpenAIClient';
import { IvrTester } from './tester/IvrTester';
import { createServer } from './server';

async function main() {
  console.log('Starting Azure ACS IVR Tester...');

  const callManager = new CallManager();
  const llm = new OpenAIClient();
  const tester = new IvrTester(callManager, llm);
  const app = createServer(callManager);

  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
    console.log(`Callback URI should be configured to: ${config.callbackUri}`);

    // In a real scenario, we might wait for a trigger to start the test.
    // For now, let's auto-start if configured.
    if (config.targetPhoneNumber) {
        tester.run();
    } else {
        console.log("Please set TARGET_PHONE_NUMBER in .env to start the test.");
    }
  });
}

main().catch(err => {
  console.error("Fatal error:", err);
});
