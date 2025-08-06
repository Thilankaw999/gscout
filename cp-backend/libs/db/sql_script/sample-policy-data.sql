-- Sample Policy Data for Simplified Schema
-- Based on simplified policy schema with policy_terms only containing basic fields
-- Uses same email addresses as sample-claim-data.sql

-- First, let's make sure we have some sample users (these should already exist from user setup)
INSERT INTO user (
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
    'twidanagamage@mitrai.com',
    'Thilanka Widanagamage',
    '+1-555-0101',
    '3183 Orthello Way',
    '',
    'Santa Clara',
    'CA',
    '95051',
    'USA',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    'jane.doe@proper.insure',
    'Jane Doe',
    '+1-555-0102',
    '789 Oak Avenue',
    'Apartment 12A',
    'Palo Alto',
    'CA',
    '94301',
    'USA',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    'mike.johnson@proper.insure',
    'Mike Johnson',
    '+1-555-0103',
    '456 Pine Street',
    '',
    'Mountain View',
    'CA',
    '94041',
    'USA',
    NOW(),
    NOW(),
    'system',
    'system'
)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    phone = VALUES(phone),
    updated_at = NOW();

-- Insert sample policies using simplified schema
INSERT INTO policies (
    policy_chain_id,
    customer_email,
    insured_name,
    type,
    created_at,
    updated_at,
    created_by,
    updated_by
) VALUES 
(
    '123',
    'twidanagamage@mitrai.com',
    'ABC Property Management LLC',
    'Property & General Liability',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    '456',
    'jane.doe@proper.insure',
    'Jane Doe Residential Property',
    'Residential Property Insurance',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    '789',
    'mike.johnson@proper.insure',
    'Mike Johnson Commercial Warehouse',
    'Commercial Property Insurance',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    '101',
    'twidanagamage@mitrai.com',
    'Thilanka Secondary Property',
    'Property & General Liability',
    NOW(),
    NOW(),
    'system',
    'system'
);

-- Get the policy IDs for reference
SET @policy1_id = (SELECT id FROM policies WHERE policy_chain_id = '123');
SET @policy2_id = (SELECT id FROM policies WHERE policy_chain_id = '456');
SET @policy3_id = (SELECT id FROM policies WHERE policy_chain_id = '789');
SET @policy4_id = (SELECT id FROM policies WHERE policy_chain_id = '101');

-- Insert policy terms using simplified schema (no complex fields)
INSERT INTO policy_terms (
    policy_id,
    term_id,
    effective_date,
    expiration_date,
    created_at,
    updated_at,
    created_by,
    updated_by
) VALUES 
-- Policy 1 - Current and Past Terms
(
    @policy1_id,
    'PVR20250506105051',
    '2024-01-15',
    '2025-01-15',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    @policy1_id,
    'PVR20250506105050',
    '2023-01-15',
    '2024-01-15',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    @policy1_id,
    'PVR20250506105049',
    '2022-01-15',
    '2023-01-15',
    NOW(),
    NOW(),
    'system',
    'system'
),
-- Policy 2 - Current and Past Terms
(
    @policy2_id,
    'PVR20250506105052',
    '2024-03-01',
    '2025-03-01',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    @policy2_id,
    'PVR20240506105052',
    '2023-03-01',
    '2024-03-01',
    NOW(),
    NOW(),
    'system',
    'system'
),
-- Policy 3 - Current and Past Terms
(
    @policy3_id,
    'PVR20250506105053',
    '2024-06-01',
    '2025-06-01',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    @policy3_id,
    'PVR20240506105053',
    '2023-06-01',
    '2024-06-01',
    NOW(),
    NOW(),
    'system',
    'system'
),
-- Policy 4 - Current and Past Terms
(
    @policy4_id,
    'PVR20250506105054',
    '2024-09-01',
    '2025-09-01',
    NOW(),
    NOW(),
    'system',
    'system'
),
(
    @policy4_id,
    'PVR20240506105054',
    '2023-09-01',
    '2024-09-01',
    NOW(),
    NOW(),
    'system',
    'system'
);

-- Verify the data with a comprehensive query
SELECT 
    p.policy_chain_id,
    p.customer_email,
    p.insured_name,
    p.type,
    
    -- Terms details
    pt.term_id,
    pt.effective_date,
    pt.expiration_date,
    
    -- Count of terms per policy
    (SELECT COUNT(*) FROM policy_terms pt2 WHERE pt2.policy_id = p.id) as total_terms_count
    
FROM policies p
LEFT JOIN policy_terms pt ON p.id = pt.policy_id
ORDER BY p.policy_chain_id, pt.effective_date DESC;

-- Query to show the API response format
SELECT 
    p.policy_chain_id,
    p.insured_name,
    p.type,
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', pt.term_id,
                'effective_date', DATE_FORMAT(pt.effective_date, '%Y-%m-%d'),
                'expiration_date', DATE_FORMAT(pt.expiration_date, '%Y-%m-%d')
            )
        )
        FROM policy_terms pt
        WHERE pt.policy_id = p.id
        ORDER BY pt.effective_date DESC
    ) as policy_terms
FROM policies p
GROUP BY p.id, p.policy_chain_id, p.insured_name, p.type
ORDER BY p.policy_chain_id;