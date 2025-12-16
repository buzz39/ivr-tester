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
  const app = createServer(callManager, tester);

  const server = app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
    console.log(`Callback URI should be configured to: ${config.callbackUri}`);
    console.log(`Dashboard available at http://localhost:${config.port}`);

    // In a real scenario, we might wait for a trigger to start the test.
    // For now, let's auto-start if configured.
    if (config.targetPhoneNumber) {
        console.log(`Auto-starting test call to ${config.targetPhoneNumber}...`);
        tester.run();
    }
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Error: Port ${config.port} is already in use.`);
      console.error(`Please stop the process running on port ${config.port} or update the PORT variable in your .env file.`);
      process.exit(1);
    } else {
      console.error('Server error:', e);
      throw e;
    }
  });
}

main().catch(err => {
  console.error("Fatal error:", err);
});
