const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  try {
    console.log('Applying migrations...')

    // Create notifications table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create notifications table
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('application', 'message', 'application_status')),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

        -- Enable RLS
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

        -- RLS Policies for notifications
        DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
        CREATE POLICY "Users can view their own notifications" ON notifications
          FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
        CREATE POLICY "Users can delete their own notifications" ON notifications
          FOR DELETE USING (auth.uid() = user_id);
      `
    })

    if (tableError) {
      console.error('Error creating notifications table:', tableError)
      return
    }

    console.log('✅ Notifications table created successfully')

    // Create functions and triggers
    const { error: functionsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create function to create application notification
        CREATE OR REPLACE FUNCTION create_application_notification()
        RETURNS TRIGGER AS $$
        DECLARE
          listing_data RECORD;
          applicant_data RECORD;
          owner_id UUID;
        BEGIN
          -- Get listing information
          SELECT user_id INTO owner_id
          FROM listings
          WHERE id = NEW.listing_id;
          
          -- Get applicant information
          SELECT 
            COALESCE(full_name, CONCAT(first_name, ' ', last_name)) as name
          INTO applicant_data
          FROM users
          WHERE id = NEW.user_id;
          
          -- Get listing information
          SELECT property_name
          INTO listing_data
          FROM listings
          WHERE id = NEW.listing_id;
          
          -- Create notification for the listing owner
          INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
          ) VALUES (
            owner_id,
            'application',
            'New application for ' || listing_data.property_name,
            applicant_data.name || ' applied to your property',
            jsonb_build_object(
              'application_id', NEW.id,
              'listing_id', NEW.listing_id,
              'listing_name', listing_data.property_name,
              'applicant_name', applicant_data.name
            )
          );
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create trigger for new applications
        DROP TRIGGER IF EXISTS trigger_create_application_notification ON applications;
        CREATE TRIGGER trigger_create_application_notification
          AFTER INSERT ON applications
          FOR EACH ROW
          EXECUTE FUNCTION create_application_notification();
      `
    })

    if (functionsError) {
      console.error('Error creating functions:', functionsError)
      return
    }

    console.log('✅ Functions and triggers created successfully')

  } catch (error) {
    console.error('Error applying migrations:', error)
  }
}

applyMigrations()
