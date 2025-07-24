import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { type JournalEntry } from '@/types/journal';
import { type Trade } from '@/components/dashboard/RecentTrades';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { FallbackImage } from '@/components/ui/fallback-image';
import { openDataUrlInNewWindow } from '@/lib/image-utils';
import { isDataURL } from '@/lib/data-url-utils';

interface JournalEntryDetailDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: JournalEntry | null;
  trade: Trade | null;
}

const JournalEntryDetailDialog = ({ isOpen, setIsOpen, entry, trade }: JournalEntryDetailDialogProps) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  if (!entry) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedImage(null);
    }
    setIsOpen(open);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{entry.title}</DialogTitle>
            <DialogDescription>{entry.date}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {trade && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm border-b pb-4">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">P&L:</span>
                    <span className={trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Type:</span>
                    <span className="capitalize">{trade.tradeType}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Model:</span>
                    <span>{trade.entryModel}</span>
                </div>
                <Link to="/trades" className="ml-auto flex-shrink-0">
                    <Badge variant="outline" className="whitespace-nowrap">
                        View Trade
                    </Badge>
                </Link>
              </div>
            )}
            <p className="whitespace-pre-wrap">{entry.recap}</p>
            
            {/* Show screenshots and thumbnail images */}
            {(entry.screenshots.length > 0 || entry.thumbnail) && (
              <div>
                <h4 className="font-semibold mb-2">
                  Images ({(entry.screenshots.length > 0 ? entry.screenshots.length : 0) + (entry.thumbnail && !entry.screenshots.includes(entry.thumbnail) ? 1 : 0)})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Show thumbnail first if it exists and is not already in screenshots */}
                  {entry.thumbnail && !entry.screenshots.includes(entry.thumbnail) && (
                    <button
                      onClick={() => {
                        console.log('Selecting thumbnail image');
                        setSelectedImage(entry.thumbnail!);
                      }}
                      className="focus:outline-none rounded-lg overflow-hidden"
                    >
                      <FallbackImage
                        src={entry.thumbnail}
                        alt="thumbnail"
                        className="rounded-lg object-cover w-full aspect-video hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </button>
                  )}
                  
                  {/* Show all screenshots */}
                  {entry.screenshots.map((src, index) => {
                    const isDataUrl = isDataURL(src);
                    console.log(`Screenshot ${index} is data URL: ${isDataUrl}, src length: ${src.length}`);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          console.log(`Selecting screenshot ${index}`);
                          setSelectedImage(src);
                        }}
                        className="focus:outline-none rounded-lg overflow-hidden"
                      >
                        <FallbackImage
                          src={src}
                          alt={`screenshot ${index + 1}`}
                          className="rounded-lg object-cover w-full aspect-video hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedImage} onOpenChange={(open) => {
        if (!open) {
          console.log("Closing enlarged screenshot dialog");
          setSelectedImage(null);
        }
      }}>
        <DialogContent className="max-w-4xl w-auto p-0 border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Enlarged Screenshot</DialogTitle>
            <DialogDescription>A larger view of the selected screenshot.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <FallbackImage 
              src={selectedImage || ''} 
              alt="Selected screenshot" 
              className="w-full h-auto rounded-lg max-h-[80vh]"
            />
            {selectedImage && (
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-14 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Open in new tab"
                onClick={(e) => {
                  // For data URLs, use our custom function
                  if (isDataURL(selectedImage)) {
                    e.preventDefault();
                    openDataUrlInNewWindow(selectedImage, 'Screenshot View');
                  }
                  // For regular URLs, the default behavior works fine
                }}
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JournalEntryDetailDialog;
