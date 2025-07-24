import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type JournalEntry } from '@/types/journal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Trade } from '@/components/dashboard/RecentTrades';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { fileToDataURL, filesToDataURLs } from '@/lib/data-url-utils';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  recap: z.string().min(1, 'Recap is required'),
  tradeId: z.string().optional().or(z.undefined()),
});

type FormValues = z.infer<typeof formSchema>;

interface AddJournalEntryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
  trades: Trade[];
}

const AddJournalEntryDialog = ({ isOpen, setIsOpen, addEntry, trades }: AddJournalEntryDialogProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', recap: '', tradeId: '' },
  });
  
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const submittedRef = useRef(false);

  const onSubmit = (data: FormValues) => {
    // Mark as submitted so we know the dialog was submitted
    submittedRef.current = true;
    
    // Add the entry with all collected data
    addEntry({
      title: data.title,
      recap: data.recap,
      thumbnail: thumbnailUrl || undefined,
      screenshots: screenshotUrls,
      tradeId: data.tradeId && data.tradeId !== "none" ? data.tradeId : undefined,
    });
    
    toast.success('Journal entry added!');
    setIsOpen(false);
  };
  
  const onOpenChange = (open: boolean) => {
    if (!open) {
      // Reset the form and image states for the next time
      form.reset({ title: '', recap: '', tradeId: undefined });
      
      // No need to clean up data URLs
      
      // Reset all state
      setThumbnailUrl(null);
      setScreenshotUrls([]);
      submittedRef.current = false;
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] border-border/20 bg-background/80 shadow-lg backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>Add Journal Entry</DialogTitle>
          <DialogDescription>
            Add a new entry to your trading journal. Document your thoughts and attach screenshots.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tradeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to Trade (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a trade to link" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No trade linked</SelectItem>
                          {trades.map(trade => (
                            <SelectItem key={trade.id} value={trade.id}>
                              {trade.symbol} - {trade.date} - P&L: ${trade.pnl.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. NQ Long 05/20/2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recap</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write a detailed recap of your trade..." {...field} className="min-h-[150px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Thumbnail (Optional)</FormLabel>
                  <FormControl>
                    <ImageUpload
                      label="Upload Thumbnail"
                      onChange={async (file) => {
                        // Convert file to data URL for the selected file
                        if (file) {
                          console.log("New thumbnail selected");
                          try {
                            const dataUrl = await fileToDataURL(file);
                            console.log("Thumbnail converted to data URL");
                            setThumbnailUrl(dataUrl);
                          } catch (error) {
                            console.error("Error converting thumbnail to data URL:", error);
                          }
                        } else {
                          setThumbnailUrl(null);
                        }
                      }}
                      preview={thumbnailUrl}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>Screenshots</FormLabel>
                  <FormControl>
                    <ImageUpload
                      label="Upload Screenshots"
                      multiple={true}
                      onChange={() => {}} // Handle through onPreviewsChange instead
                      onPreviewsChange={(dataUrls) => {
                        console.log(`Received ${dataUrls.length} screenshot data URLs`);
                        // Set the screenshot data URLs
                        setScreenshotUrls(dataUrls);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="submit">Save Entry</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJournalEntryDialog;
