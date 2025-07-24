// This utility handles persistent object URLs for images in a client-side only application

// Keep a registry of persisted URLs to prevent revoking them
const persistedUrlRegistry: Set<string> = new Set();

// Create an object URL that won't be automatically revoked
export function createPersistentObjectURL(file: File): string {
  const url = URL.createObjectURL(file);
  persistedUrlRegistry.add(url);
  return url;
}

// Revoke a URL unless it's been marked as persisted
export function safeRevokeObjectURL(url: string): void {
  if (!persistedUrlRegistry.has(url)) {
    URL.revokeObjectURL(url);
  }
}

// Helper to convert selected file(s) to object URLs
export function filesToObjectURLs(files: FileList | null): string[] {
  if (!files || files.length === 0) return [];
  return Array.from(files).map(file => createPersistentObjectURL(file));
}

// Helper to convert a single file to an object URL
export function fileToObjectURL(file: File | null): string | null {
  if (!file) return null;
  return createPersistentObjectURL(file);
}

// Open a data URL in a new window with proper handling
export function openDataUrlInNewWindow(dataUrl: string, title = 'Image View'): void {
  try {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                background: #1a1a1a;
              }
              img { 
                max-width: 100%; 
                max-height: 100vh; 
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Image" />
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      console.error("Failed to open new window - it may have been blocked by a popup blocker");
    }
  } catch (error) {
    console.error("Error opening data URL in new window:", error);
  }
}
