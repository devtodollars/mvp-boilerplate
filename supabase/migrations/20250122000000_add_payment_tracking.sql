-- Add payment tracking fields to listings table
ALTER TABLE listings 
ADD COLUMN payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'expired', 'cancelled')),
ADD COLUMN payment_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 5.00,
ADD COLUMN payment_currency TEXT DEFAULT 'EUR',
ADD COLUMN payment_method TEXT,
ADD COLUMN payment_reference TEXT,
ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN auto_renew BOOLEAN DEFAULT false,
ADD COLUMN payment_attempts INTEGER DEFAULT 0,
ADD COLUMN next_payment_attempt TIMESTAMP WITH TIME ZONE;

-- Create payments table for detailed payment tracking
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT,
    payment_reference TEXT,
    stripe_payment_intent_id TEXT,
    stripe_customer_id TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient queries
CREATE INDEX idx_payments_listing_id ON payments(listing_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_listings_payment_status ON listings(payment_status);
CREATE INDEX idx_listings_payment_expires_at ON listings(payment_expires_at);

-- Create function to update payment status based on expiration
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if payment has expired
    IF NEW.payment_expires_at IS NOT NULL AND NEW.payment_expires_at < NOW() THEN
        NEW.payment_status = 'expired';
        NEW.active = false;
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update payment status
CREATE TRIGGER trigger_update_payment_status
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status();

-- Create function to get listing payment info
CREATE OR REPLACE FUNCTION get_listing_payment_info(listing_uuid UUID)
RETURNS TABLE(
    listing_id UUID,
    payment_status TEXT,
    payment_expires_at TIMESTAMP WITH TIME ZONE,
    payment_amount DECIMAL(10,2),
    days_remaining INTEGER,
    is_active BOOLEAN,
    can_renew BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.payment_status,
        l.payment_expires_at,
        l.payment_amount,
        CASE 
            WHEN l.payment_expires_at IS NULL THEN NULL
            ELSE GREATEST(0, EXTRACT(DAY FROM (l.payment_expires_at - NOW())))
        END::INTEGER as days_remaining,
        l.active,
        CASE 
            WHEN l.payment_status = 'expired' OR l.payment_status = 'unpaid' THEN true
            ELSE false
        END as can_renew
    FROM listings l
    WHERE l.id = listing_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to extend listing payment
CREATE OR REPLACE FUNCTION extend_listing_payment(
    listing_uuid UUID,
    days_to_add INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
    current_expiry TIMESTAMP WITH TIME ZONE;
    new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current expiry date
    SELECT payment_expires_at INTO current_expiry
    FROM listings
    WHERE id = listing_uuid;
    
    -- Calculate new expiry date
    IF current_expiry IS NULL OR current_expiry < NOW() THEN
        -- If no expiry or expired, start from now
        new_expiry := NOW() + INTERVAL '1 day' * days_to_add;
    ELSE
        -- Extend from current expiry
        new_expiry := current_expiry + INTERVAL '1 day' * days_to_add;
    END IF;
    
    -- Update the listing
    UPDATE listings
    SET 
        payment_expires_at = new_expiry,
        payment_status = 'paid',
        active = true,
        updated_at = NOW()
    WHERE id = listing_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to check and update expired listings (for cron jobs)
CREATE OR REPLACE FUNCTION check_expired_listings()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE listings
    SET 
        payment_status = 'expired',
        active = false,
        updated_at = NOW()
    WHERE 
        payment_expires_at < NOW() 
        AND payment_status = 'paid';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_listing_payment_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION extend_listing_payment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_expired_listings() TO service_role;

-- Add RLS policies for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payments
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY "Users can create their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own payments
CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can do everything" ON payments
    FOR ALL USING (auth.role() = 'service_role'); 