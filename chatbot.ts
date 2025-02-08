import {
  ActionProvider,
  AgentKit,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  CdpWalletProvider,
  CreateAction,
  erc20ActionProvider,
  Network,
  pythActionProvider,
  walletActionProvider,
  WalletProvider,
  wethActionProvider
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { ethers, Interface, JsonRpcProvider } from 'ethers';
import * as fs from "fs";
import * as readline from "readline";
import { z } from "zod";

import abi from "./abi.json";

const bodyParser = require('body-parser');
const express = require('express')
const app = express()

dotenv.config();

type TransactionRequest = Parameters<CdpWalletProvider["sendTransaction"]>[0]

import { createHelia } from 'helia' // TODO: fix this
import { strings } from '@helia/strings'

/**
 * Stores the provided string on IPFS using Helia and returns the public gateway URL.
 * Note: In a production app, you may want to initialize and reuse the Helia node
 * rather than creating a new one on every call.
 *
 * @param {string} content - The string content to store on IPFS.
 * @returns {Promise<string>} - A promise that resolves to the IPFS gateway URL.
 */
async function storeStringOnIPFS(content) {
  // Create a Helia node (using default in-memory stores)
  const helia = await createHelia()
  // Initialize the strings API for Helia
  const s = strings(helia)
  // Add the string content to IPFS and get the resulting CID
  const cid = await s.add(content)
  // Shut down the node if you no longer need it (optional)
  // await helia.stop()

  // Return the URL for public retrieval via the ipfs.io gateway
  return `https://ipfs.io/ipfs/${cid.toString()}`
}

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check required variables
  const requiredVars = ["OPENAI_API_KEY", "CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY"];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia testnet");
  }
}

function is0x(data: unknown): data is `0x${string}` {
  return data !== undefined && typeof data === "string" && data.startsWith("0x")
}

// Add this right after imports and before any other code
validateEnvironment();

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    let walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
        // Continue without wallet data
      }
    }

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    
    // CUSTOM ActionProvider TO CALL THE SMART CONTRACT
    const iface = new Interface(abi.abi);
    async function storeMessage(metadataUrl) {
      // Encode the call data for store(message)
      const data = iface.encodeFunctionData("createNewTask", [metadataUrl, 100, 1]);

      const to = process.env["CONTRACT_ADDRESS"]
      
      if (!is0x(to) || !is0x(data)) {
        return
      }

      // Prepare the transaction object. You can also add gasLimit, gasPrice, etc.
      const tx: TransactionRequest = {
        to,
        data,
      };
    
      // Send the transaction using AgentKit’s walletProvider.
      // This call will internally sign the transaction (without exposing the private key)
      // and send it to the network.
      let output = ""
      try {
        const txResponse = await walletProvider.sendTransaction(tx);
        console.log("Transaction sent. Hash:", txResponse);

        // Optionally wait for the transaction to be mined:
        const receipt = await walletProvider.waitForTransactionReceipt(txResponse);
        output = "Transaction mined. Receipt: " + receipt

      } catch (error) {
        console.error("Error occurred while sending transaction:", error);
        output = "Error occurred while sending transaction: " + error
      }
      
      return output;
    }

    const SignMessageSchema = z.object({
      message: z.string().describe("Summary of the case"),
    });
    class MyActionProvider extends ActionProvider<WalletProvider> {
        constructor() {
            super("my-action-provider", []);
        }
    
        @CreateAction({
            name: "submitApplication",
            description: "Submit the application for the case",
            schema: SignMessageSchema,
        })
        async myAction(args: z.infer<typeof SignMessageSchema>): Promise<string> {
          const { message } = args;

          const metadataUrl = await storeStringOnIPFS(message)
          
          const result = await storeMessage(metadataUrl).catch(console.error);

          return `The payload signature ${result}`;
        }
    
        supportsNetwork = (network: Network) => true;
    }
    
    const myCustomActionProvider = () => new MyActionProvider();
    
    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        // pythActionProvider(),
        walletActionProvider(),
        // erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        myCustomActionProvider()
      ],
    });

    const tools = await getLangChainTools(agentkit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

    // Create React Agent using the LLM and CDP AgentKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
        empowered to interact onchain using your tools. If you ever need funds, you can request them from the 
        faucet if you are on network ID 'base-sepolia'. If not, you can provide your wallet details and request 
        funds from the user. Before executing your first action, get the wallet details to see what network 
        you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone 
        asks you to do something you can't do with your currently available tools, you must say so, and 
        encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to 
        docs.cdp.coinbase.com for more information. Be concise and helpful with your responses. Refrain from 
        restating your tools' descriptions unless it is explicitly requested.
        You have to behave like a lawyer who's interested in collecting some evidences about a case.
        After a few messages ask the user if you should submit the application. If the user says yes, 
        call the 'submitApplication' smart contract function with an argument: a string 
        containing the summary of the conversation with all the evidences collected written a bit like a lawyer would.
        `,
    });

    // Save wallet data
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}


/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runChatMode(agent: any, config: any) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream({ messages: [new HumanMessage(userInput)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

app.use(bodyParser.json({
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}));

const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/static', express.static('public'))

let AGENT, CONFIG;
async function init(){
  const { agent, config } = await initializeAgent();
  AGENT = agent
  CONFIG = config
}
init()

app.all('/chat', async (req, res) => {
  // res.json({ text: "dio **merda**" });
  
  console.log("Method:", req.method);
  console.log("Args:", req.query);
  console.log("Parsed JSON:", req.body);
  console.log("Raw Data:", req.rawBody);

  const data = req.body;

  if (!data || !data.text) {
    return res.status(200).json({ error: "Invalid request no text provided" });
  }

  let agentOut, output;

  try {
    agentOut = await AGENT.invoke({ messages: [new HumanMessage(data.text)] }, CONFIG);
    output = agentOut.messages[agentOut.messages.length - 1]
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
      output = {content: error.message}
    } else {
      output = {content: "Generic error"}
    }
  }

  res.json({ text: output.content });
  /**/
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
