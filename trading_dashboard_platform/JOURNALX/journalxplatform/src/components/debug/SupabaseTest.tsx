import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const SupabaseTest = () => {
  const testConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      
      // Test 1: Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth test:', { user, authError });
      
      if (authError) {
        toast.error(`Auth error: ${authError.message}`);
        return;
      }
      
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      
      toast.success(`User authenticated: ${user.email}`);
      
      // Test 2: Try to insert a simple trade
      const testTrade = {
        user_id: user.id,
        symbol: 'TEST',
        side: 'buy',
        quantity: 1,
        price: 100,
        fee: 0,
        total: 100,
        status: 'closed',
        pnl: 10
      };
      
      console.log('Inserting test trade:', testTrade);
      
      const { data, error } = await supabase
        .from('trades')
        .insert([testTrade])
        .select()
        .single();
      
      console.log('Insert result:', { data, error });
      
      if (error) {
        toast.error(`Database error: ${error.message}`);
        console.error('Database error details:', error);
      } else {
        toast.success('Test trade inserted successfully!');
        console.log('Test trade inserted:', data);
      }
      
    } catch (error) {
      console.error('Test failed:', error);
      toast.error(`Test failed: ${error.message}`);
    }
  };
  
  const testFetch = async () => {
    try {
      console.log('Testing fetch trades...');
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .limit(5);
        
      console.log('Fetch result:', { data, error });
      
      if (error) {
        toast.error(`Fetch error: ${error.message}`);
      } else {
        toast.success(`Fetched ${data?.length || 0} trades`);
        console.log('Fetched trades:', data);
      }
    } catch (error) {
      console.error('Fetch test failed:', error);
      toast.error(`Fetch test failed: ${error.message}`);
    }
  };
  
  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Supabase Debug Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} variant="outline">
          Test Database Connection & Insert
        </Button>
        <Button onClick={testFetch} variant="outline">
          Test Fetch Trades
        </Button>
        <p className="text-sm text-muted-foreground">
          Check the browser console for detailed logs
        </p>
      </CardContent>
    </Card>
  );
};

export default SupabaseTest;
