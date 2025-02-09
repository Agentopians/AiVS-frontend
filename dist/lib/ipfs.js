"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadString = uploadString;
const storage_1 = require("@thirdweb-dev/storage");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize the Thirdweb Storage client
const storage = new storage_1.ThirdwebStorage({
    clientId: process.env.THIRDWEB_CLIENT_ID,
    secretKey: process.env.THIRDWEB_SECRET_KEY,
});
// Upload a string to Thirdweb Storage
function uploadString(inputString) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validate input
            if (typeof inputString !== "string") {
                throw new Error("Invalid input: Expected a string.");
            }
            // Convert the string into a JSON object
            const data = { content: inputString };
            // Upload the data to Thirdweb Storage
            const uri = yield storage.upload(data);
            return uri; // Return the URI (IPFS CID)
        }
        catch (error) {
            console.error("Error uploading string to Thirdweb Storage:", error);
            throw error;
        }
    });
}
//# sourceMappingURL=ipfs.js.map