import { Request, Response } from 'express';
import { FuzzerService } from '../services/fuzzer.service';
import { config } from '../config/env';

export const startFuzzing = async (req: Request, res: Response) => {
  // Use local host for testing, or provided host
  const host = req.body.host || `http://localhost:${config.port}`;
  
  // Start async - don't await the loop
  FuzzerService.startFuzzing(host);
  
  res.json({ success: true, message: 'Fuzzing session initiated' });
};

export const stopFuzzing = (req: Request, res: Response) => {
  FuzzerService.stopFuzzing();
  res.json({ success: true, message: 'Fuzzing session stopped' });
};

export const getResults = (req: Request, res: Response) => {
  const results = FuzzerService.getResults();
  res.json(results);
};

export const getStatus = (req: Request, res: Response) => {
  const status = FuzzerService.getStatus();
  res.json(status);
};
