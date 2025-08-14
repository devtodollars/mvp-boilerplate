// Optional client-side encryption utilities
// Use this for extra sensitive documents

export class DocumentEncryption {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  private static async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async encryptFile(file: File, userPassword?: string): Promise<{
    encryptedData: ArrayBuffer
    key: string
    iv: Uint8Array
    salt?: Uint8Array
  }> {
    const fileBuffer = await file.arrayBuffer()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    let key: CryptoKey
    let salt: Uint8Array | undefined

    if (userPassword) {
      // Use password-based encryption
      salt = crypto.getRandomValues(new Uint8Array(16))
      key = await this.deriveKeyFromPassword(userPassword, salt)
    } else {
      // Use random key
      key = await this.generateKey()
    }

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      fileBuffer
    )

    // Export key for storage (you'd want to encrypt this key with user's master key)
    const exportedKey = await crypto.subtle.exportKey('raw', key)
    const keyString = Array.from(new Uint8Array(exportedKey))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return {
      encryptedData,
      key: keyString,
      iv,
      salt
    }
  }

  static async decryptFile(
    encryptedData: ArrayBuffer,
    keyString: string,
    iv: Uint8Array,
    userPassword?: string,
    salt?: Uint8Array
  ): Promise<ArrayBuffer> {
    let key: CryptoKey

    if (userPassword && salt) {
      // Derive key from password
      key = await this.deriveKeyFromPassword(userPassword, salt)
    } else {
      // Import key directly
      const keyBytes = new Uint8Array(
        keyString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      )
      key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        'AES-GCM',
        false,
        ['decrypt']
      )
    }

    return await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    )
  }
}

// Example usage in your component:
/*
// Before upload:
const { encryptedData, key, iv } = await DocumentEncryption.encryptFile(file)
// Store the encrypted data, save key/iv securely (encrypted with user's master key)

// For download:
const decryptedData = await DocumentEncryption.decryptFile(encryptedData, key, iv)
const decryptedFile = new Blob([decryptedData], { type: originalMimeType })
*/