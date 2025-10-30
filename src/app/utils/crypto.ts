// We'll use a constant salt for key derivation
const SALT = new Uint8Array([
  132, 43, 86, 195, 227, 139, 44, 151, 222, 78, 90, 123, 192, 167, 201, 55
]);

// Generate a key from a password
async function getKey(password: string = 'your-secure-password-here'): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Function to encrypt data
export async function encryptData(data: string): Promise<{ encrypted: string, iv: string }> {
  try {
    const key = await getKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoder.encode(data)
    );

    // Convert encrypted data and IV to base64 strings for storage
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      encrypted: encryptedBase64,
      iv: ivBase64
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Function to decrypt data
export async function decryptData(encryptedData: string, iv: string): Promise<string> {
  try {
    const key = await getKey();
    const decoder = new TextDecoder();
    
    // Convert base64 strings back to ArrayBuffer
    const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes
      },
      key,
      encryptedBytes
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}