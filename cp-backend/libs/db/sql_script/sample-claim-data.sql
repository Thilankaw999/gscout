-- Sample Claims Data for Testing
-- Author: Insurance Portal Development Team
-- Created on: 2024-12-21
-- Description: Sample data for claims table to test the claims mock API

-- Insert sample claims for customer 'user@example.com'
INSERT INTO claims (
    customer_email,
    policy_term_id,
    damage_type,
    date_of_loss,
    date_filled,
    claim_status,
    address_line1,
    address_line2,
    address_city,
    address_state,
    address_postal_code,
    address_country,
    estimated_damage,
    last_updated,
    created_at,
    updated_at
) VALUES
(
    'twidanagamage@mitrai.com',
    1, -- Assuming policy term ID 1 exists
    'WATER_DAMAGE',
    '2024-03-05',
    '2024-03-08',
    'Adjuster Review',
    '3183 Orthello Way',
    '',
    'Santa Clara',
    'CA',
    '95051',
    'USA',
    25000.00,
    '2024-03-10 14:30:00',
    NOW(),
    NOW()
),
(
    'twidanagamage@mitrai.com',
    2, -- Assuming policy term ID 2 exists
    'FIRE_DAMAGE',
    '2024-02-15',
    '2024-02-18',
    'Damage Assessment',
    '1234 Main Street',
    'Unit 5B',
    'San Jose',
    'CA',
    '95112',
    'USA',
    45000.00,
    '2024-02-20 09:15:00',
    NOW(),
    NOW()
),
(
    'twidanagamage@mitrai.com',
    1, -- Same policy term, different claim
    'STORM_DAMAGE',
    '2024-01-20',
    '2024-01-22',
    'Completed',
    '3183 Orthello Way',
    '',
    'Santa Clara',
    'CA',
    '95051',
    'USA',
    15000.00,
    '2024-01-25 16:45:00',
    NOW(),
    NOW()
);

-- Insert sample claims for customer 'john.doe@example.com'
INSERT INTO claims (
    customer_email,
    policy_term_id,
    damage_type,
    date_of_loss,
    date_filled,
    claim_status,
    address_line1,
    address_line2,
    address_city,
    address_state,
    address_postal_code,
    address_country,
    estimated_damage,
    last_updated,
    created_at,
    updated_at
) VALUES
(
    'jane.doe@proper.insure',
    3, -- Assuming policy term ID 3 exists
    'THEFT',
    '2024-04-10',
    '2024-04-12',
    'Repair Approval',
    '789 Oak Avenue',
    'Apartment 12A',
    'Palo Alto',
    'CA',
    '94301',
    'USA',
    8500.00,
    '2024-04-15 11:20:00',
    NOW(),
    NOW()
),
(
    'jane.doe@proper.insure',
    3, -- Same policy term, different claim
    'VANDALISM',
    '2024-03-25',
    '2024-03-27',
    'Claim Filed',
    '789 Oak Avenue',
    'Apartment 12A',
    'Palo Alto',
    'CA',
    '94301',
    'USA',
    3200.00,
    '2024-03-30 13:10:00',
    NOW(),
    NOW()
);

-- Insert sample claims for customer 'jane.smith@example.com'
INSERT INTO claims (
    customer_email,
    policy_term_id,
    damage_type,
    date_of_loss,
    date_filled,
    claim_status,
    address_line1,
    address_line2,
    address_city,
    address_state,
    address_postal_code,
    address_country,
    estimated_damage,
    last_updated,
    created_at,
    updated_at
) VALUES
(
    'mike.johnson@proper.insure',
    4, -- Assuming policy term ID 4 exists
    'HAIL_DAMAGE',
    '2024-05-01',
    '2024-05-03',
    'Damage Assessment',
    '456 Pine Street',
    '',
    'Mountain View',
    'CA',
    '94041',
    'USA',
    12000.00,
    '2024-05-05 10:30:00',
    NOW(),
    NOW()
); 