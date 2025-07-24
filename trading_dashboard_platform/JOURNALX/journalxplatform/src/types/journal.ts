
export interface JournalEntry {
  id: string;
  title: string;
  recap: string;
  thumbnail?: string; // a single image URL for the card thumbnail
  screenshots: string[]; // a list of image URLs created with URL.createObjectURL
  date: string;
  tradeId?: string;
}
