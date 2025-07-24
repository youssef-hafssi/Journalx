
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus } from "lucide-react";
import { type Trade } from '@/components/dashboard/RecentTrades';
import AddTradeForm, { type FormValues } from '@/components/dashboard/AddTradeForm';
import { format } from "date-fns";
import { toast } from "sonner";
import { useTrades } from '@/hooks/use-trades';

const AllTrades = () => {
    const { trades, deleteTrade, updateTrade, addTrade } = useTrades();
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [selectedTrade, setSelectedTrade] = React.useState<{ trade: Trade; index: number } | null>(null);
    
    const handleDelete = async (indexToDelete: number) => {
        const tradeToDelete = trades[indexToDelete];
        if (tradeToDelete?.id) {
            console.log('🗑️ Deleting trade from AllTrades page:', {
                id: tradeToDelete.id,
                symbol: tradeToDelete.symbol,
                index: indexToDelete
            });
            
            try {
                await deleteTrade(tradeToDelete.id);
                console.log('✅ Trade deletion completed successfully');
            } catch (error) {
                console.error('❌ Trade deletion failed:', error);
            }
        } else {
            console.warn('⚠️ No trade ID found for deletion at index:', indexToDelete);
        }
    };

    const handleEditClick = (trade: Trade, index: number) => {
        setSelectedTrade({ trade, index });
        setIsEditDialogOpen(true);
    };

    const handleUpdateTrade = async (values: FormValues) => {
        if (!selectedTrade) return;
        const { trade } = selectedTrade;

        const updatedTradeData = {
            ...values,
            id: trade.id, // Preserve the original ID
        };
        
        if (trade.id) {
            await updateTrade(trade.id, updatedTradeData);
        }
        setIsEditDialogOpen(false);
        setSelectedTrade(null);
        toast.success("Trade updated successfully!");
    };

    const handleAddTrade = async (values: FormValues) => {
        console.log('handleAddTrade called with values:', values);
        
        const newTradeData = {
            date: values.exitDate
                ? values.exitDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                : values.entryDate
                  ? values.entryDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                  : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
            symbol: values.symbol,
            pnl: values.pnl,
            ...values,
        };
        
        console.log('Prepared trade data for adding:', newTradeData);
        
        try {
            await addTrade(newTradeData);
            setIsAddDialogOpen(false);
            console.log('Trade successfully added');
        } catch (error) {
            console.error('Failed to add trade:', error);
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 dark:bg-[#1a1a1a]">
    

            <div className="flex items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold">All Trades</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Trade
                </Button>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Exit Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Net P&L</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trades.map((trade, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{trade.symbol}</TableCell>
                                <TableCell>{trade.exitDate ? format(trade.exitDate, 'PP p') : trade.date}</TableCell>
                                <TableCell className="capitalize">{trade.tradeType}</TableCell>
                                <TableCell className={`text-right font-semibold ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEditClick(trade, index)}>
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(index)}>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            {/* Edit Trade Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[80vw] lg:max-w-[60vw]">
                    <DialogHeader>
                        <DialogTitle>Edit Trade</DialogTitle>
                    </DialogHeader>
                    {selectedTrade && (
                        <AddTradeForm
                            onSave={handleUpdateTrade}
                            setOpen={setIsEditDialogOpen}
                            initialData={selectedTrade.trade}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Trade Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[80vw] lg:max-w-[60vw]">
                    <DialogHeader>
                        <DialogTitle>Add New Trade</DialogTitle>
                        <DialogDescription>
                            Enter the details of your trade. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <AddTradeForm
                        onAddTrade={handleAddTrade}
                        setOpen={setIsAddDialogOpen}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AllTrades;
