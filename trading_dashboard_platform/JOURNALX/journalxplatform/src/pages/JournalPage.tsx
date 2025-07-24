
import React from 'react';
import { Button } from '@/components/ui/button';
import AddJournalEntryDialog from '@/components/journal/AddJournalEntryDialog';
import EditJournalEntryDialog from '@/components/journal/EditJournalEntryDialog';
import { type JournalEntry } from '@/types/journal';
import { FileImage, Edit, Trash2, MoreVertical } from 'lucide-react';
import { type Trade } from '@/components/dashboard/RecentTrades';
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import JournalEntryDetailDialog from '@/components/journal/JournalEntryDetailDialog';
import { FallbackImage } from '@/components/ui/fallback-image';
import { useJournalEntries } from '@/hooks/use-journal-entries';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface JournalPageProps {
  trades: Trade[];
}

const JournalPage = ({ trades }: JournalPageProps) => {
  const { entries, addEntry, updateEntry, deleteEntry } = useJournalEntries();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null);
  const [entryToEdit, setEntryToEdit] = React.useState<JournalEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = React.useState<JournalEntry | null>(null);

  const handleAddEntry = async (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    console.log('🎯 JournalPage handleAddEntry called with:', entry);
    try {
      await addEntry(entry);
      setIsAddDialogOpen(false);
      console.log('✅ Journal entry successfully added');
    } catch (error) {
      console.error('❌ Failed to add journal entry:', error);
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEntryToEdit(entry);
    setIsEditDialogOpen(true);
  };

  const handleUpdateEntry = async (entryId: string, updates: Partial<JournalEntry>) => {
    try {
      const result = await updateEntry(entryId, updates);
      setIsEditDialogOpen(false);
      setEntryToEdit(null);
      return result;
    } catch (error) {
      console.error('❌ Failed to update journal entry:', error);
      throw error;
    }
  };

  const handleDeleteEntry = async (entry: JournalEntry) => {
    try {
      await deleteEntry(entry.id);
      setEntryToDelete(null);
      toast.success('Journal entry deleted successfully!');
    } catch (error) {
      console.error('❌ Failed to delete journal entry:', error);
      toast.error('Failed to delete journal entry');
    }
  };

  const linkedTradeForSelected = selectedEntry ? trades.find(t => t.id === selectedEntry.tradeId) : null;

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 dark:bg-[#1a1a1a]">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Journal</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>Add Entry</Button>
        </div>
      </div>
      <AddJournalEntryDialog 
        isOpen={isAddDialogOpen} 
        setIsOpen={setIsAddDialogOpen} 
        addEntry={handleAddEntry} 
        trades={trades}
      />

      <JournalEntryDetailDialog
        isOpen={!!selectedEntry}
        setIsOpen={(isOpen) => {
          if (!isOpen) {
            setSelectedEntry(null);
          }
        }}
        entry={selectedEntry}
        trade={linkedTradeForSelected}
      />

      <EditJournalEntryDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        entry={entryToEdit}
        updateEntry={handleUpdateEntry}
        trades={trades}
      />

      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{entryToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => entryToDelete && handleDeleteEntry(entryToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
        {entries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {entries.map(entry => {
              const linkedTrade = entry.tradeId ? trades.find(t => t.id === entry.tradeId) : null;
              // Use the thumbnail if available, or the first screenshot
              // First try the thumbnail, then the first screenshot, otherwise null
              const thumbnailSrc = entry.thumbnail || (entry.screenshots.length > 0 ? entry.screenshots[0] : null);
              
              // Add logging to help diagnose issues
              console.log("Journal entry:", entry.id, 
                "has thumbnail:", !!entry.thumbnail, 
                "screenshot count:", entry.screenshots.length,
                "thumbnail type:", entry.thumbnail ? (entry.thumbnail.startsWith('data:') ? 'data URL' : 'other URL') : 'none');

              return (
                <Card
                  key={entry.id}
                  className="cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-transform duration-300 flex flex-col group overflow-hidden relative"
                  onClick={() => setSelectedEntry(entry)}
                >
                  {/* Dropdown Menu */}
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEntry(entry);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEntryToDelete(entry);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {thumbnailSrc ? (
                    <div className="w-full h-32 overflow-hidden">
                      <FallbackImage
                        src={thumbnailSrc}
                        alt={entry.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center">
                      <FileImage className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <CardHeader className="flex-grow p-4">
                    <CardTitle className="text-lg line-clamp-2">{entry.title}</CardTitle>
                    <CardDescription>{entry.date}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {linkedTrade && (
                      <Badge variant="outline" className="whitespace-nowrap">
                        Linked Trade: {linkedTrade.symbol}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center h-[calc(100vh-200px)]">
              <FileImage className="h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No journal entries yet</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Click "Add Entry" to create your first journal entry.
              </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalPage;
