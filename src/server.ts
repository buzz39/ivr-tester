// src/server.ts
import express from 'express';
import bodyParser from 'body-parser';
import { CallManager } from './acs/CallManager';
import { config } from './config';

export const createServer = (callManager: CallManager) => {
  const app = express();
  app.use(bodyParser.json());

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
