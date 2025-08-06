-- Sample User Data for Mock API
-- Based on user-provided information for testing and development

-- Insert sample user data into the user table (matches schema)
INSERT INTO user (
    id,
    email,
    name,
    phone,
    address_line1,
    address_line2,
    address_city,
    address_state,
    address_postal_code,
    address_country,
    created_at,
    updated_at,
    created_by,
    updated_by
) VALUES (
    -- User ID
    1,
    
    -- Customer Email
    'shannon@proper.insure',
    
    -- Personal Information
    'Shannon Prunkl',
    '(443) 798-8013',
    
    -- Address Information
    '3183 Orthello Way',
    '',
    'Santa Clara',
    'CA',
    '95051',
    'USA',
    
    -- Audit Fields
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    -- User ID
    2,
    
    -- Customer Email for testing
    'twidanagamage@mitrai.com',
    
    -- Personal Information
    'Tharaka Widanagamage',
    '(555) 123-4567',
    
    -- Address Information
    '123 Test Street',
    'Apt 101',
    'Test City',
    'CA',
    '12345',
    'USA',
    
    -- Audit Fields
    '2023-02-20 09:15:00',
    '2024-11-15 16:45:00',
    'system',
    'system'
);

-- Insert additional sample users (optional)
INSERT INTO user (
    id,
    email,
    name,
    phone,
    address_line1,
    address_line2,
    address_city,
    address_state,
    address_postal_code,
    address_country,
    created_at,
    updated_at,
    created_by,
    updated_by
) VALUES 
(
    3,
    'john.doe@proper.insure',
    'John Doe',
    '(555) 123-4567',
    '456 Maple Street',
    'Apt 202',
    'Boston',
    'MA',
    '02101',
    'USA',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    4,
    'jane.smith@proper.insure',
    'Jane Smith',
    '(408) 987-6543',
    '789 Oak Avenue',
    '',
    'San Jose',
    'CA',
    '95110',
    'USA',
    NOW(),
    NOW(),
    'system',
    'system'
);

-- Verify the inserted user data
SELECT 
    id,
    email,
    name,
    phone,
    CONCAT(address_line1, 
           CASE WHEN address_line2 != '' THEN CONCAT(', ', address_line2) ELSE '' END, 
           ', ', address_city, ', ', address_state, ' ', address_postal_code) AS full_address
FROM user 
WHERE id IN (1, 2); 