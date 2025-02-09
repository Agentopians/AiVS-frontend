import { createHelia } from 'helia';
import { strings } from '@helia/strings';

async function initializeHelia() {
  const helia = await createHelia();
  return strings(helia);
}

const sPromise = initializeHelia(); // Store the promise for later use

export async function uploadString(inputString: string): Promise<string> {
  try {
    if (typeof inputString !== 'string') {
      throw new Error('Invalid input: Expected a string.');
    }

    const s = await sPromise; // Wait for Helia to initialize
    const cid = await s.add(inputString);

    return cid.toString();
  } catch (error) {
    console.error('Error uploading string to Helia:', error);
    throw error;
  }
}
