// This service relies on the global CryptoJS object loaded from the CDN in index.html
declare const CryptoJS: any;

const SECRET_KEY = 'SivaShieldSecretKeyForLocalStorage';

// Robust text encryption using a JSON structure to store IV and salt
export const encryptText = (text: string, key: string): string | null => {
  try {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    const derivedKey = CryptoJS.PBKDF2(key, salt, {
        keySize: 256 / 32,
        iterations: 1000
    });
    const encrypted = CryptoJS.AES.encrypt(text, derivedKey, { 
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
    });
    return JSON.stringify({
        ct: encrypted.toString(),
        iv: CryptoJS.enc.Hex.stringify(iv),
        s: CryptoJS.enc.Hex.stringify(salt)
    });
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
};

export const decryptText = (jsonStr: string, key: string): string | null => {
  try {
    const data = JSON.parse(jsonStr);
    const salt = CryptoJS.enc.Hex.parse(data.s);
    const iv = CryptoJS.enc.Hex.parse(data.iv);
    const derivedKey = CryptoJS.PBKDF2(key, salt, {
        keySize: 256 / 32,
        iterations: 1000
    });
    const decrypted = CryptoJS.AES.decrypt(data.ct, derivedKey, { 
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC 
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};


// --- Log Encryption ---
export const encryptLog = (data: object): string => {
  return encryptText(JSON.stringify(data), SECRET_KEY) || '';
};

export const decryptLog = <T,>(encryptedData: string): T | null => {
  const decryptedJson = decryptText(encryptedData, SECRET_KEY);
  if (decryptedJson) {
    try {
      return JSON.parse(decryptedJson) as T;
    } catch {
      return null;
    }
  }
  return null;
};

// --- Robust File Encryption ---
// Converts an ArrayBuffer to a WordArray
const arrayBufferToWordArray = (ab: ArrayBuffer): any => {
    const i8a = new Uint8Array(ab);
    const a = [];
    for (let i = 0; i < i8a.length; i += 4) {
        a.push(i8a[i] << 24 | i8a[i + 1] << 16 | i8a[i + 2] << 8 | i8a[i + 3]);
    }
    return CryptoJS.lib.WordArray.create(a, i8a.length);
};

// Converts a WordArray to a Blob
const wordArrayToBlob = (wordArray: any, type: string): Blob => {
    const E = (a: any) => {
        const c = [];
        const d = a.words;
        const e = a.sigBytes;
        for (let a = 0; a < e; a++) {
            const b = d[a >>> 2] >>> 24 - a % 4 * 8 & 255;
            c.push(b)
        }
        return c
    }
    const u8 = new Uint8Array(E(wordArray));
    return new Blob([u8.buffer], { type });
};


export const encryptFile = async (file: File, key: string): Promise<Blob | null> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const wordArray = arrayBufferToWordArray(arrayBuffer);
        const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
        const data = JSON.stringify({ type: file.type, data: encrypted });
        return new Blob([data], { type: 'application/json' });
    } catch (e) {
        console.error("File encryption error", e);
        return null;
    }
}

export const decryptFile = async (file: File, key: string): Promise<Blob | null> => {
    try {
        const jsonStr = await file.text();
        const encryptedData = JSON.parse(jsonStr);
        if (!encryptedData.type || !encryptedData.data) throw new Error("Invalid file format");
        
        const decrypted = CryptoJS.AES.decrypt(encryptedData.data, key);
        return wordArrayToBlob(decrypted, encryptedData.type);
    } catch (e) {
        console.error("File decryption error", e);
        return null;
    }
}
