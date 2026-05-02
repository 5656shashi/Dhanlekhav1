import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface FuzzRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  url: string;
  body?: any;
  headers?: any;
}

interface FuzzResult {
  id: string;
  timestamp: string;
  target: string;
  input: any;
  status: number;
  response: any;
  isFailure: boolean;
  errorStack?: string;
}

const LOG_FILE = path.join(__dirname, '../../logs/fuzz_results.json');

export class FuzzerService {
  private static isRunning = false;
  private static results: FuzzResult[] = [];

  static async startFuzzing(targetBaseUrl: string) {
    if (this.isRunning) return;
    this.isRunning = true;
    
    logger.info(`Starting fuzzing session against ${targetBaseUrl}`);

    // Define core targets for demonstration
    const targets: FuzzRequest[] = [
      { method: 'POST', url: '/api/v1/auth/send-otp', body: { phone: '9999999999', type: 'LOGIN' } },
      { method: 'POST', url: '/api/v1/auth/verify-otp', body: { phone: '9999999999', code: '123456' } },
      { method: 'POST', url: '/api/v1/nominees', body: { name: 'John Doe', allocationPct: 50, nomineeType: 'INDIVIDUAL' } },
      { method: 'POST', url: '/api/v1/accounts', body: { provider: 'HDFC', providerName: 'Bank' } },
    ];

    // Load existing results if any
    if (fs.existsSync(LOG_FILE)) {
      try {
        this.results = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
      } catch (e) {
        this.results = [];
      }
    }

    while (this.isRunning) {
      for (const target of targets) {
        if (!this.isRunning) break;

        const mutatedBody = this.mutate(target.body);
        const result = await this.executeRequest(targetBaseUrl, { ...target, body: mutatedBody });
        
        this.results.unshift(result);
        if (this.results.length > 50) this.results.pop();

        this.saveResults();
        
        // Jittered delay to simulate natural load
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      }
    }
  }

  static stopFuzzing() {
    this.isRunning = false;
    logger.info('Fuzzing session stopped');
  }

  static getResults() {
    return this.results;
  }

  static getStatus() {
    return { isRunning: this.isRunning, count: this.results.length };
  }

  private static mutate(body: any): any {
    if (!body) return body;
    const newBody = JSON.parse(JSON.stringify(body));
    const keys = Object.keys(newBody);
    if (keys.length === 0) return newBody;

    const keyToMutate = keys[Math.floor(Math.random() * keys.length)];
    const mutationType = Math.floor(Math.random() * 5);
    
    switch (mutationType) {
      case 0: // Type mismatch
        newBody[keyToMutate] = Math.random() > 0.5 ? 999999999 : ['malformed', 'array'];
        break;
      case 1: // Missing field
        delete newBody[keyToMutate];
        break;
      case 2: // Buffer overflow simulation
        newBody[keyToMutate] = 'FUZZ'.repeat(2500);
        break;
      case 3: // Security Injection patterns
        newBody[keyToMutate] = "admin' -- OR 1=1";
        break;
      case 4: // Empty/Null
        newBody[keyToMutate] = null;
        break;
    }
    
    return newBody;
  }

  private static async executeRequest(baseUrl: string, req: FuzzRequest): Promise<FuzzResult> {
    const id = Math.random().toString(36).substring(7);
    const fullUrl = `${baseUrl}${req.url}`;
    
    try {
      const response = await axios({
        method: req.method,
        url: fullUrl,
        data: req.body,
        headers: {
          'Content-Type': 'application/json',
          ...req.headers
        },
        timeout: 3000,
        validateStatus: () => true, 
      });

      return {
        id,
        timestamp: new Date().toISOString(),
        target: req.url,
        input: req.body,
        status: response.status,
        response: response.data,
        isFailure: response.status >= 500,
      };
    } catch (error: any) {
      return {
        id,
        timestamp: new Date().toISOString(),
        target: req.url,
        input: req.body,
        status: 0,
        response: error.message,
        isFailure: true,
        errorStack: error.stack,
      };
    }
  }

  private static saveResults() {
    try {
      fs.writeFileSync(LOG_FILE, JSON.stringify(this.results, null, 2));
    } catch (e) {
      // Quietly fail
    }
  }
}
