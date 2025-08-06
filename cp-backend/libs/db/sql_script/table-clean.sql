SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE buildings;
TRUNCATE TABLE chatbot_intents;
TRUNCATE TABLE claims;
TRUNCATE TABLE documents;
TRUNCATE TABLE locations;
TRUNCATE TABLE policies;
TRUNCATE TABLE policy_documents;
TRUNCATE TABLE policy_term_claims;
TRUNCATE TABLE policy_term_details;
TRUNCATE TABLE policy_terms;
TRUNCATE TABLE user;

SET FOREIGN_KEY_CHECKS = 1;