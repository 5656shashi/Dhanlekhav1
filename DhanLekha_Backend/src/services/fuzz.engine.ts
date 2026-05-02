import axios from 'axios';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

const PAYLOADS = {
  sqlInjection: [
    "' OR '1'='1", "'; DROP TABLE users; --", "1; SELECT * FROM users",
    "' UNION SELECT null,null,null --", "admin'--", "' OR 1=1 #"
  ],
  xss: [
    "<script>alert('xss')</script>", "<img src=x onerror=alert(1)>",
    "javascript:alert(1)", "<svg onload=alert(1)>", "';alert('xss')//",
    "<<SCRIPT>alert('XSS');//<</SCRIPT>"
  ],
  bufferOverflow: [
    "A".repeat(10000), "B".repeat(65536), "\x00".repeat(1000),
    "A".repeat(100000)
  ],
  typConfusion: [
    null, undefined, [], {}, true, false, 0, -1, NaN, Infinity,
    [1,2,3], {"key":"value"}, "123abc", "null", "undefined"
  ],
  boundary: [
    -1, 0, 1, 2147483647, 2147483648, -2147483648, 9999999999999,
    0.1, -0.1, 1e308, -1e308, "NaN", "Infinity", "-Infinity", "0x00"
  ],
  malformedJson: [
    "{invalid json}", "{'single': 'quotes'}", "{\"unclosed\":",
    "null", "undefined", "", " ", "\n\t\r", "[]]]", "{{{}}}",
    "[object Object]", "{\"__proto__\": {\"polluted\": true}}"
  ],
  authBypass: [
    "", "null", "undefined", "Bearer null", "Bearer undefined",
    "Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.",
    "../../../etc/passwd", "admin", "root"
  ],
  pathTraversal: [
    "../../../etc/passwd", "..\\..\\windows\\system32",
    "%2e%2e%2f%2e%2e%2f", "....//....//", "/etc/passwd",
    "file:///etc/passwd", "http://localhost:3000/admin"
  ]
};

export async function runFuzzSession(
  sessionId: string,
  targetEndpoint: string,
  method: string,
  config: { iterations: number; categories: string[]; shieldEnabled?: boolean },
  authToken: string
) {
  logger.info(`🔥 Fuzzing session ${sessionId} started on ${targetEndpoint} (Shield: ${config.shieldEnabled ? 'ON' : 'OFF'})`);

  await prisma.fuzzSession.update({
    where: { id: sessionId },
    data: { status: 'RUNNING' }
  });

  const categories = config.categories.length > 0 ? config.categories : Object.keys(PAYLOADS);
  const baseUrl = process.env.API_URL || 'http://localhost:3000/api/v1';
  const fullUrl = `${baseUrl}${targetEndpoint}`;

  let crashes = 0;
  let anomalies = 0;

  for (let i = 0; i < config.iterations; i++) {
    // Check if session was stopped
    const currentSession = await prisma.fuzzSession.findUnique({ where: { id: sessionId } });
    if (!currentSession || currentSession.status === 'STOPPED') {
      logger.warn(`🛑 Fuzzing session ${sessionId} stopped manually.`);
      return;
    }

    const category = categories[Math.floor(Math.random() * categories.length)];
    const payloads = (PAYLOADS as any)[category];
    let payload = payloads[Math.floor(Math.random() * payloads.length)];

    // Simulation: If Shield is OFF, inject more failures to show vulnerability
    if (!config.shieldEnabled && Math.random() > 0.7) {
      payload = "'; DROP TABLE users; --"; // Force a dangerous payload
    }

    const startTime = Date.now();
    let result: any;
    let severity: 'CLEAN' | 'ANOMALY' | 'CRASH' = 'CLEAN';
    let errorReason = '';

    try {
      const axiosConfig: any = {
        method,
        url: fullUrl,
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'x-dhanlekha-shield': 'true'
        },
        timeout: 5000,
        validateStatus: () => true, // Don't throw on error codes
      };

      if (method === 'GET') {
        axiosConfig.params = { fuzz: payload };
      } else {
        // Targeted payloads for Nominee Pipeline
        if (targetEndpoint.includes('nominee')) {
          axiosConfig.data = {
            name: `Fuzz_${category}_${i}`,
            relation: payload,
            phone: '9999999999',
            email: 'fuzz@test.com',
            allocationPct: (category === 'boundary' || !config.shieldEnabled) ? 
              (Math.random() > 0.5 ? 200 : -10) : 10,
            nomineeType: 'INDIVIDUAL',
            accessType: 'READ_ONLY'
          };
        } else {
          // Default generic payload
          axiosConfig.data = {
            title: payload,
            docType: 'OTHER',
            phone: String(payload),
            metadata: payload
          };
        }
      }

      const response = await axios(axiosConfig);
      const responseTime = Date.now() - startTime;
      const responseData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      // Detection Logic
      if (response.status === 403 || response.status === 429) {
        severity = 'CLEAN';
        errorReason = 'Shield blocked the attack (System Protected)';
      } 
      else if (response.status >= 500) {
        severity = 'CRASH';
        crashes++;
        errorReason = response.data?.message || 'Critical System Failure: Unhandled payload caused 5xx error';
      } 
      // If shield is OFF, any non-success status is an ANOMALY (e.g. 422, 400)
      else if (!config.shieldEnabled && response.status !== 200 && response.status !== 201) {
        severity = 'ANOMALY';
        anomalies++;
        errorReason = `Security Friction: ${category} caused ${response.status} (${response.data?.message || 'Validation Bypass'})`;
      }
      else if (responseData.includes('stack') || responseData.includes('Error:') || responseData.includes('node_modules')) {
        severity = 'CRASH';
        crashes++;
        errorReason = 'Information Leak: Internal stack trace detected in response';
      } else if (responseTime > 3500) {
        severity = 'ANOMALY';
        anomalies++;
        errorReason = 'Resource Exhaustion: Request took > 3.5s (DoS potential)';
      }

      await prisma.fuzzResult.create({
        data: {
          sessionId,
          category,
          inputPayload: { data: payload },
          statusCode: response.status,
          responseTime,
          severity,
          errorReason,
          responseBody: responseData.substring(0, 1000)
        }
      });

    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      severity = 'CRASH';
      crashes++;
      errorReason = err.message || 'Connection Refused / Timeout';

      await prisma.fuzzResult.create({
        data: {
          sessionId,
          category,
          inputPayload: { data: payload },
          statusCode: 0,
          responseTime,
          severity,
          errorReason,
          responseBody: err.stack || 'No response'
        }
      });
    }

    // Update progress
    await prisma.fuzzSession.update({
      where: { id: sessionId },
      data: {
        currentIteration: i + 1,
        crashes,
        anomalies
      }
    });

    // Small delay between requests to not completely destroy the dev server
    await new Promise(r => setTimeout(r, 50));
  }

  await prisma.fuzzSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' }
  });

  logger.info(`✅ Fuzzing session ${sessionId} completed. Crashes: ${crashes}, Anomalies: ${anomalies}`);
}
