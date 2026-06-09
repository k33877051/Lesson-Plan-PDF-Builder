import crypto from "crypto";

// Use environment variable for encryption key
// In production, this should be a 32-byte key from environment
const getEncryptionKey = (): Buffer => {
  const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (key) {
    // If key is provided, use it (should be 64 hex chars for 32 bytes)
    return Buffer.from(key, "hex");
  }
  // Fallback: generate a random key (only for development - data will be lost on restart)
  return crypto.randomBytes(32);
};

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY = getEncryptionKey();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Return iv:authTag:encrypted format (all hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(":");
  
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}