
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { type Trade } from "./RecentTrades";
import { cn } from "@/lib/utils";
import { format, setHours, setMinutes, isValid } from "date-fns";
import { CalendarIcon, Folder } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  symbol: z.string().min(1, "Market/Asset is required"),
  pnl: z.coerce.number(),
  entryDate: z.date().optional(),
  exitDate: z.date().optional(),
  tradeType: z.enum(['long', 'short']).optional(),
  session: z.enum(['Asia', 'London', 'NY AM', 'NY PM']).optional(),
  timeframe: z.string().optional(),
  entryPrice: z.coerce.number().optional(),
  exitPrice: z.coerce.number().optional(),
  orderType: z.enum(['Market', 'Limit', 'Stop']).optional(),
  riskPerTrade: z.coerce.number().optional(),
  rewardToRiskRatio: z.coerce.number().optional(),
  entryModel: z.string().optional(),
  news: z.array(z.object({
    type: z.enum(['red', 'orange', 'yellow', 'grey', 'no-news']),
    name: z.string().min(1, "News name is required"),
    time: z.string().min(1, "Time is required"),
  })).optional(),
  mistakesMade: z.string().optional(),
  lessonsLearned: z.string().optional(),
  tradeRating: z.coerce.number().min(1).max(10).int().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

type AddTradeFormProps = {
  onAddTrade?: (trade: FormValues) => void;
  onSave?: (values: FormValues) => void;
  setOpen: (open: boolean) => void;
  initialData?: Partial<Trade & FormValues>;
};

const AddTradeForm = ({ onAddTrade, setOpen, onSave, initialData }: AddTradeFormProps) => {
    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: initialData || {
        symbol: "",
        pnl: 0,
        news: [],
      },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "news",
    });

    React.useEffect(() => {
        if (initialData) {
            const compatibleInitialData = {
              ...initialData,
              news: initialData.news && Array.isArray(initialData.news)
                ? initialData.news
                : [],
            };
            form.reset(compatibleInitialData);
        }
    }, [initialData, form]);

    function onSubmit(values: FormValues) {
      if (onSave) {
        onSave(values);
      } else if (onAddTrade) {
        onAddTrade(values);
        form.reset();
      }
      toast.success(initialData ? "Trade updated successfully!" : "Trade added successfully!");
      setOpen(false);
    }

    const handleNewsTypeChange = (value: string, index: number) => {
      if (value === 'no-news') {
        form.setValue(`news.${index}.name`, '');
        form.setValue(`news.${index}.time`, '');
      }
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <ScrollArea className="h-[60vh] pr-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {/* Entry Date and Time - Horizontal Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="entryDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-sm font-medium">Entry Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 pr-3 text-left font-normal h-10",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value && isValid(field.value) ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      if (date) {
                                        const oldDate = field.value && isValid(field.value) ? field.value : new Date();
                                        field.onChange(setMinutes(setHours(date, oldDate.getHours()), oldDate.getMinutes()));
                                      }
                                    }}
                                    disabled={(date) => date > new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="entryDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-sm font-medium">Entry Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  value={field.value && isValid(field.value) ? format(field.value, 'HH:mm') : ''}
                                  onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(':').map(v => parseInt(v, 10));
                                    const oldDate = field.value && isValid(field.value) ? field.value : new Date();

                                    if (isNaN(hours)) {
                                      return;
                                    }

                                    const newDateWithHours = setHours(oldDate, hours);
                                    const finalDate = isNaN(minutes) ? newDateWithHours : setMinutes(newDateWithHours, minutes);

                                    field.onChange(finalDate);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Exit Date and Time - Horizontal Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="exitDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-sm font-medium">Exit Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 pr-3 text-left font-normal h-10",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value && isValid(field.value) ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      if (date) {
                                        const oldDate = field.value && isValid(field.value) ? field.value : new Date();
                                        field.onChange(setMinutes(setHours(date, oldDate.getHours()), oldDate.getMinutes()));
                                      }
                                    }}
                                    disabled={(date) => date > new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="exitDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-sm font-medium">Exit Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  value={field.value && isValid(field.value) ? format(field.value, 'HH:mm') : ''}
                                  onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(':').map(v => parseInt(v, 10));
                                    const oldDate = field.value && isValid(field.value) ? field.value : new Date();

                                    if (isNaN(hours)) {
                                      return;
                                    }

                                    const newDateWithHours = setHours(oldDate, hours);
                                    const finalDate = isNaN(minutes) ? newDateWithHours : setMinutes(newDateWithHours, minutes);

                                    field.onChange(finalDate);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Market / Asset</FormLabel>
                              <FormControl>
                                  <Input placeholder="e.g. ES, NQ, EURUSD, AAPL" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tradeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="long">Long</SelectItem>
                              <SelectItem value="short">Short</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="session"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select session" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Asia">Asia</SelectItem>
                              <SelectItem value="London">London</SelectItem>
                              <SelectItem value="NY AM">NY AM</SelectItem>
                              <SelectItem value="NY PM">NY PM</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeframe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timeframe</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeframe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1m">1 Minute</SelectItem>
                              <SelectItem value="2m">2 Minutes</SelectItem>
                              <SelectItem value="3m">3 Minutes</SelectItem>
                              <SelectItem value="5m">5 Minutes</SelectItem>
                              <SelectItem value="15m">15 Minutes</SelectItem>
                              <SelectItem value="30m">30 Minutes</SelectItem>
                              <SelectItem value="1h">1 Hour</SelectItem>
                              <SelectItem value="4h">4 Hours</SelectItem>
                              <SelectItem value="1d">Daily</SelectItem>
                              <SelectItem value="1w">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="entryPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="5100.25"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exit Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="5150.75"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="orderType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="e.g. Market, Limit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Market">Market</SelectItem>
                              <SelectItem value="Limit">Limit</SelectItem>
                              <SelectItem value="Stop">Stop</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="riskPerTrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk per Trade (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="2.0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rewardToRiskRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward-to-Risk Ratio</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="2.5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="pnl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Net P&L ($)</FormLabel>
                                <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="150.75"
                                      {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                  </div>
                  <FormField control={form.control} name="entryModel" render={({ field }) => (<FormItem><FormLabel>Entry Model</FormLabel><FormControl><Textarea placeholder="Input your entry model" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  
                  <div>
                    <FormLabel>News on that day</FormLabel>
                    <div className="space-y-4 mt-2">
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_auto] gap-2 items-end border p-4 rounded-md">
                          <FormField
                            control={form.control}
                            name={`news.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={(value) => {
                                  field.onChange(value);
                                  handleNewsTypeChange(value, index);
                                }} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="red">
                                      <div className="flex items-center">
                                        <Folder className="mr-2 h-4 w-4 text-red-500" /> Red Folder
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="orange">
                                      <div className="flex items-center">
                                        <Folder className="mr-2 h-4 w-4 text-orange-500" /> Orange Folder
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="yellow">
                                      <div className="flex items-center">
                                        <Folder className="mr-2 h-4 w-4 text-yellow-500" /> Yellow Folder
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="grey">
                                      <div className="flex items-center">
                                        <Folder className="mr-2 h-4 w-4 text-gray-500" /> Grey Folder
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="no-news">
                                      <div className="flex items-center">
                                        <Folder className="mr-2 h-4 w-4 text-slate-400" /> No News
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`news.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>News Event</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. FOMC Statement" 
                                    {...field} 
                                    disabled={form.watch(`news.${index}.type`) === 'no-news'}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`news.${index}.time`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="time" 
                                    {...field} 
                                    disabled={form.watch(`news.${index}.type`) === 'no-news'}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => append({ type: 'red', name: '', time: '' })}
                      >
                        Add News Event
                      </Button>
                    </div>
                  </div>

                  <FormField control={form.control} name="mistakesMade" render={({ field }) => (<FormItem><FormLabel>Mistakes Made</FormLabel><FormControl><Textarea placeholder="Any mistakes made?" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="lessonsLearned" render={({ field }) => (<FormItem><FormLabel>Lessons Learned</FormLabel><FormControl><Textarea placeholder="What did you learn?" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField
                    control={form.control}
                    name="tradeRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade Rating</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a rating (1-5)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">⭐️</SelectItem>
                            <SelectItem value="2">⭐️⭐️</SelectItem>
                            <SelectItem value="3">⭐️⭐️⭐️</SelectItem>
                            <SelectItem value="4">⭐️⭐️⭐️⭐️</SelectItem>
                            <SelectItem value="5">⭐️⭐️⭐️⭐️⭐️</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>
              <DialogFooter>
                  <Button type="submit">Save trade</Button>
              </DialogFooter>
            </form>
        </Form>
    );
};

export default AddTradeForm;
