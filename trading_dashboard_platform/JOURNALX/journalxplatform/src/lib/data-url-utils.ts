/**
 * Utilities for handling image conversions between File objects and data URLs
 * This ensures images can be stored in localStorage
 */

/**
 * Converts a File object to a base64 data URL
 * @param file The file to convert
 * @returns A promise that resolves with the data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}

/**
 * Converts multiple File objects to base64 data URLs
 * @param files Array of files to convert
 * @returns A promise that resolves with an array of data URLs
 */
export async function filesToDataURLs(files: File[]): Promise<string[]> {
  const promises = files.map(file => fileToDataURL(file));
  return Promise.all(promises);
}

/**
 * Checks if a string is a valid data URL
 * @param url The URL to check
 * @returns True if the URL is a valid data URL
 */
export function isDataURL(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Gets image dimensions from a data URL
 * @param dataURL The data URL to get dimensions from
 * @returns A promise that resolves with the image dimensions
 */
export function getImageDimensions(dataURL: string): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = reject;
    img.src = dataURL;
  });
}
