import React, { useState, useRef, useEffect } from 'react';
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

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  recap: z.string().min(1, 'Recap is required'),
  tradeId: z.string().optional().or(z.undefined()),
});

type FormValues = z.infer<typeof formSchema>;

interface EditJournalEntryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: JournalEntry | null;
  updateEntry: (entryId: string, updates: Partial<JournalEntry>) => Promise<JournalEntry | undefined>;
  trades: Trade[];
}

const EditJournalEntryDialog: React.FC<EditJournalEntryDialogProps> = ({
  isOpen,
  setIsOpen,
  entry,
  updateEntry,
  trades,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      recap: '',
      tradeId: undefined,
    },
  });
  
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const submittedRef = useRef(false);

  // Update form when entry changes
  useEffect(() => {
    if (entry) {
      form.reset({
        title: entry.title,
        recap: entry.recap,
        tradeId: entry.tradeId || undefined, // Use undefined instead of empty string
      });
      setThumbnailUrl(entry.thumbnail || null);
      setScreenshotUrls(entry.screenshots || []);
    }
  }, [entry, form]);

  const onSubmit = async (data: FormValues) => {
    if (!entry) return;
    
    try {
      submittedRef.current = true;
      
      const updates: Partial<JournalEntry> = {
        title: data.title,
        recap: data.recap,
        thumbnail: thumbnailUrl || undefined,
        screenshots: screenshotUrls,
        tradeId: data.tradeId && data.tradeId !== "none" ? data.tradeId : undefined,
      };
      
      await updateEntry(entry.id, updates);
      toast.success('Journal entry updated!');
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      toast.error('Failed to update journal entry');
    }
  };

  const onOpenChange = (open: boolean) => {
    if (!open && !submittedRef.current) {
      // Reset form when closing without submitting
      form.reset();
      setThumbnailUrl(null);
      setScreenshotUrls([]);
    }
    submittedRef.current = false;
    setIsOpen(open);
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] border-border/20 bg-background/80 shadow-lg backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>Edit Journal Entry</DialogTitle>
          <DialogDescription>
            Update your journal entry. Modify your thoughts and screenshots.
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
                          {trades.map((trade) => (
                            <SelectItem key={trade.id} value={trade.id}>
                              {trade.symbol} - {trade.side} - {new Date(trade.entryDate).toLocaleDateString()}
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
                        <Input placeholder="Enter journal entry title" {...field} />
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
                        <Textarea 
                          placeholder="Write your journal entry recap here..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Thumbnail</FormLabel>
                  <FormControl>
                    <ImageUpload
                      label="Upload Thumbnail"
                      multiple={false}
                      onChange={() => {}}
                      onPreviewChange={(dataUrl) => {
                        console.log('Received thumbnail data URL');
                        setThumbnailUrl(dataUrl);
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
                      onChange={() => {}}
                      onPreviewsChange={(dataUrls) => {
                        console.log(`Received ${dataUrls.length} screenshot data URLs`);
                        setScreenshotUrls(dataUrls);
                      }}
                      previews={screenshotUrls}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Entry</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditJournalEntryDialog;
