// src/server.ts
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { CallManager } from './acs/CallManager';
import { IvrTester } from './tester/IvrTester';
import { config } from './config';

export const createServer = (callManager: CallManager, tester?: IvrTester) => {
  const app = express();
  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, '../public')));

  app.post('/api/call', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: "phoneNumber is required" });
    }
    if (!tester) {
        return res.status(503).json({ error: "Tester is not initialized" });
    }

    try {
        tester.run(phoneNumber);
        res.status(200).json({ message: "Call initiated" });
    } catch (error) {
        res.status(500).json({ error: "Failed to initiate call" });
    }
  });

  app.post('/api/callbacks', (req, res) => {
    // Azure Call Automation sends CloudEvents.
    // Usually it's an array of events or a single event.
    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      console.log(`Received event: ${event.type}`);
      callManager.handleEvent(event);
    }

    res.status(200).send();
  });

  return app;
};
