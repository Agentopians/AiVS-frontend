"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agentkit_1 = require("@coinbase/agentkit");
const agentkit_langchain_1 = require("@coinbase/agentkit-langchain");
const messages_1 = require("@langchain/core/messages");
const langgraph_1 = require("@langchain/langgraph");
const prebuilt_1 = require("@langchain/langgraph/prebuilt");
const openai_1 = require("@langchain/openai");
const dotenv = __importStar(require("dotenv"));
const ethers_1 = require("ethers");
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const zod_1 = require("zod");
const ipfs_1 = require("./lib/ipfs");
const abi_json_1 = __importDefault(require("./abi.json"));
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
dotenv.config();
/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment() {
    const missingVars = [];
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
function is0x(data) {
    return data !== undefined && typeof data === "string" && data.startsWith("0x");
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
function initializeAgent() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            // Initialize LLM
            const llm = new openai_1.ChatOpenAI({
                model: "gpt-4o-mini",
            });
            let walletDataStr = null;
            // Read existing wallet data if available
            if (fs.existsSync(WALLET_DATA_FILE)) {
                try {
                    walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
                }
                catch (error) {
                    console.error("Error reading wallet data:", error);
                    // Continue without wallet data
                }
            }
            // Configure CDP Wallet Provider
            const config = {
                apiKeyName: process.env.CDP_API_KEY_NAME,
                apiKeyPrivateKey: (_a = process.env.CDP_API_KEY_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"),
                cdpWalletData: walletDataStr || undefined,
                networkId: process.env.NETWORK_ID || "base-sepolia",
            };
            const walletProvider = yield agentkit_1.CdpWalletProvider.configureWithWallet(config);
            // CUSTOM ActionProvider TO CALL THE SMART CONTRACT
            const iface = new ethers_1.Interface(abi_json_1.default.abi);
            function storeMessage(metadataUrl) {
                return __awaiter(this, void 0, void 0, function* () {
                    // Encode the call data for store(message)
                    const data = iface.encodeFunctionData("createNewTask", [
                        metadataUrl,
                        100, // QUORUM_THRESHOLD_PERCENTAGE
                        "0x01" // Using hex string for the bytes representation
                    ]);
                    const to = process.env["CONTRACT_ADDRESS"];
                    if (!is0x(to) || !is0x(data)) {
                        return;
                    }
                    // Prepare the transaction object. You can also add gasLimit, gasPrice, etc.
                    const tx = {
                        to,
                        data,
                    };
                    // Send the transaction using AgentKit's walletProvider.
                    // This call will internally sign the transaction (without exposing the private key)
                    // and send it to the network.
                    let output = "";
                    try {
                        const txResponse = yield walletProvider.sendTransaction(tx);
                        console.log("Transaction sent. Hash:", txResponse);
                        // Optionally wait for the transaction to be mined:
                        const receipt = yield walletProvider.waitForTransactionReceipt(txResponse);
                        output = "Transaction mined. Receipt: " + receipt;
                    }
                    catch (error) {
                        console.error("Error occurred while sending transaction:", error);
                        output = "Error occurred while sending transaction: " + error;
                    }
                    return output;
                });
            }
            const SignMessageSchema = zod_1.z.object({
                message: zod_1.z.string().describe("Summary of the case"),
            });
            class MyActionProvider extends agentkit_1.ActionProvider {
                constructor() {
                    super("my-action-provider", []);
                    this.supportsNetwork = (network) => true;
                }
                myAction(args) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const { message } = args;
                        const metadataUrl = yield (0, ipfs_1.uploadString)(message);
                        const result = yield storeMessage(metadataUrl).catch(console.error);
                        return `The payload signature ${result}`;
                    });
                }
            }
            __decorate([
                (0, agentkit_1.CreateAction)({
                    name: "submitApplication",
                    description: "Submit the application for the case",
                    schema: SignMessageSchema,
                }),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [void 0]),
                __metadata("design:returntype", Promise)
            ], MyActionProvider.prototype, "myAction", null);
            const myCustomActionProvider = () => new MyActionProvider();
            // Initialize AgentKit
            const agentkit = yield agentkit_1.AgentKit.from({
                walletProvider,
                actionProviders: [
                    (0, agentkit_1.wethActionProvider)(),
                    // pythActionProvider(),
                    (0, agentkit_1.walletActionProvider)(),
                    // erc20ActionProvider(),
                    (0, agentkit_1.cdpApiActionProvider)({
                        apiKeyName: process.env.CDP_API_KEY_NAME,
                        apiKeyPrivateKey: (_b = process.env.CDP_API_KEY_PRIVATE_KEY) === null || _b === void 0 ? void 0 : _b.replace(/\\n/g, "\n"),
                    }),
                    (0, agentkit_1.cdpWalletActionProvider)({
                        apiKeyName: process.env.CDP_API_KEY_NAME,
                        apiKeyPrivateKey: (_c = process.env.CDP_API_KEY_PRIVATE_KEY) === null || _c === void 0 ? void 0 : _c.replace(/\\n/g, "\n"),
                    }),
                    myCustomActionProvider()
                ],
            });
            const tools = yield (0, agentkit_langchain_1.getLangChainTools)(agentkit);
            // Store buffered conversation history in memory
            const memory = new langgraph_1.MemorySaver();
            const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };
            // Create React Agent using the LLM and CDP AgentKit tools
            const agent = (0, prebuilt_1.createReactAgent)({
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
            const exportedWallet = yield walletProvider.exportWallet();
            fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));
            return { agent, config: agentConfig };
        }
        catch (error) {
            console.error("Failed to initialize agent:", error);
            throw error; // Re-throw to be handled by caller
        }
    });
}
/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runChatMode(agent, config) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        console.log("Starting chat mode... Type 'exit' to end.");
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const userInput = yield question("\nPrompt: ");
                if (userInput.toLowerCase() === "exit") {
                    break;
                }
                const stream = yield agent.stream({ messages: [new messages_1.HumanMessage(userInput)] }, config);
                try {
                    for (var _d = true, stream_1 = (e_1 = void 0, __asyncValues(stream)), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                        _c = stream_1_1.value;
                        _d = false;
                        const chunk = _c;
                        if ("agent" in chunk) {
                            console.log(chunk.agent.messages[0].content);
                        }
                        else if ("tools" in chunk) {
                            console.log(chunk.tools.messages[0].content);
                        }
                        console.log("-------------------");
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Error:", error.message);
            }
            process.exit(1);
        }
        finally {
            rl.close();
        }
    });
}
app.use(bodyParser.json({
    verify: (req, res, buf, encoding) => {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
}));
const port = 3000;
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/static', express.static('public'));
let AGENT, CONFIG;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const { agent, config } = yield initializeAgent();
        AGENT = agent;
        CONFIG = config;
    });
}
init();
app.all('/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        agentOut = yield AGENT.invoke({ messages: [new messages_1.HumanMessage(data.text)] }, CONFIG);
        output = agentOut.messages[agentOut.messages.length - 1];
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error:", error.message);
            output = { content: error.message };
        }
        else {
            output = { content: "Generic error" };
        }
    }
    res.json({ text: output.content });
    /**/
}));
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
//# sourceMappingURL=chatbot.js.map