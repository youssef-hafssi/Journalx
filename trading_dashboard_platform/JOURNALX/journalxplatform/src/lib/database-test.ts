// Simple test to verify database connectivity and table structure
import { supabase } from '@/lib/supabase';

export const testDatabaseConnection = async () => {
  console.log('🧪 Testing database connection...');
  
  try {
    // Test 1: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');
    console.log('✅ User authenticated:', user.id);

    // Test 2: Try to select from trades table to see structure
    console.log('🔍 Checking trades table structure...');
    const { data: tableData, error: selectError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error querying trades table:', selectError);
      return { success: false, error: selectError };
    }
    
    console.log('✅ Trades table accessible, sample data:', tableData);

    // Test 3: Try minimal insert
    console.log('🧪 Testing minimal trade insert...');
    const minimalTrade = {
      user_id: user.id,
      symbol: 'TEST',
      side: 'buy',
      quantity: 1,
      price: 100,
      total: 100,
      status: 'closed'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('trades')
      .insert([minimalTrade])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting minimal trade:', insertError);
      return { success: false, error: insertError };
    }

    console.log('✅ Minimal trade inserted successfully:', insertData);

    // Test 4: Clean up - delete the test trade
    const { error: deleteError } = await supabase
      .from('trades')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn('⚠️ Could not delete test trade:', deleteError);
    } else {
      console.log('🧹 Test trade cleaned up');
    }

    return { success: true, data: insertData };

  } catch (error) {
    console.error('💥 Database test failed:', error);
    return { success: false, error };
  }
};

export const checkTableColumns = async () => {
  try {
    // This will help us see what columns actually exist
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .limit(0); // Just get structure, no data

    console.log('📋 Table query result (should show available columns):', { data, error });
    return { data, error };
  } catch (error) {
    console.error('Error checking table columns:', error);
    return { error };
  }
};
