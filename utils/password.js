const encoder = new TextEncoder();

export async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    const hashed = await crypto.subtle.exportKey("raw", key);
    return {
        hash: btoa(String.fromCharCode(...new Uint8Array(hashed))),
        salt: btoa(String.fromCharCode(...salt)),
    };
}

export async function verifyPassword(password, storedHash, salt) {
    const key = await deriveKey(password, Uint8Array.from(atob(salt), c => c.charCodeAt(0)));
    const hashed = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(hashed))) === storedHash;
}

async function deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"]);
    return await crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
