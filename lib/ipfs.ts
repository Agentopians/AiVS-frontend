import { ThirdwebStorage } from "@thirdweb-dev/storage";

// Initialize the Thirdweb Storage client
const storage = new ThirdwebStorage();

// Upload a string to Thirdweb Storage
export async function uploadString(inputString: string): Promise<string> {
  try {
    // Validate input
    if (typeof inputString !== "string") {
      throw new Error("Invalid input: Expected a string.");
    }

    // Convert the string into a JSON object
    const data = { content: inputString };

    // Upload the data to Thirdweb Storage
    const uri = await storage.upload(data);

    return uri; // Return the URI (IPFS CID)
  } catch (error) {
    console.error("Error uploading string to Thirdweb Storage:", error);
    throw error;
  }
}
