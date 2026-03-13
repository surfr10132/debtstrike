import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const cwd = process.cwd();
  const envPath = join(cwd, '.env.local');
  const envExists = existsSync(envPath);
  let envContent = '';
  if (envExists) {
    try {
      const raw = readFileSync(envPath, 'utf-8');
      // Just show first line key name, not value
      envContent = raw.split('\n').map(l => {
        if (l.includes('=')) {
          const [key] = l.split('=');
          return `${key}=<redacted>`;
        }
        return l;
      }).join(' | ');
    } catch (e: unknown) {
      envContent = `read error: ${e}`;
    }
  }

  // Check all env vars that start with common prefixes
  const relevantEnvKeys = Object.keys(process.env).filter(k =>
    k.includes('ANTHROPIC') || k.includes('STRIPE') || k.includes('NEXT_PUBLIC')
  );

  return NextResponse.json({
    hasKey: !!process.env.ANTHROPIC_API_KEY,
    keyPreview: process.env.ANTHROPIC_API_KEY?.substring(0, 20) ?? 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    cwd,
    envFileExists: envExists,
    envFileRedacted: envContent,
    relevantEnvKeys,
  });
}
