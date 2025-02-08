import { create } from 'ipfs-http-client';
import axios from 'axios';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

const INFURA_API_KEY = process.env.INFURA_API_KEY;
// Create an IPFS client instance
const ipfsClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  // headers: {
  //   authorization: `Basic ${Buffer.from(INFURA_API_KEY as string).toString('base64')}`,
  // },
});

/**
 * Uploads a string to IPFS.
 * @param inputString - The string to upload.
 * @returns A Promise that resolves to the IPFS hash (CID) of the uploaded string.
 */
export async function uploadStringToInfura(inputString: string): Promise<string> {
  try {
    // Validate that the input is a string
    if (typeof inputString !== 'string') {
      throw new Error('Invalid input: Expected a string.');
    }

    // Convert the string to a Buffer
    const stringBuffer = Buffer.from(inputString);

    // Add the string data to IPFS
    const result = await ipfsClient.add(stringBuffer);

    // Return the IPFS hash (Content Identifier - CID)
    return result.cid.toString();
  } catch (error) {
    console.error('Error uploading string to IPFS:', error);
    throw error;
  }
}


const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
  throw new Error('Please set PINATA_API_KEY and PINATA_SECRET_KEY in your .env file');
}

/**
 * Uploads a string to Pinata.
 * @param inputString - The string to upload.
 * @returns A Promise that resolves to the IPFS hash (CID) of the uploaded string.
 */
async function uploadStringToPinata(inputString: string): Promise<string> {
  try {
    if (typeof inputString !== 'string') {
      throw new Error('Invalid input: Expected a string.');
    }

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      { keyValues: inputString }, // Wrap the string in an object for compatibility
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading string to Pinata:', error);
    throw error;
  }
}

export default uploadStringToPinata;