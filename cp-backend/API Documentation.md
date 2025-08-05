# **API Documentation**

* createdby and updatedby are by default in the db tables

## **1\. Get User (API \#1)**

**Endpoint Summary**

* New endpoint: GET /api/user  
* Need to mock these data assuming these will comes from client ITS endpoint

**Header Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| Authorization | "Auth token" | String | Yes |
| Content-Type | "application/json" | String | Yes |

**Request Params**

**Expected API Response**

JSON

```
{
  "code":200,
  "message": "User profile data retrieved successfully"
  "data":{
  "profilePictureUrl": "https://abc/profile-picture.jpg",
  "firstName": "Shannon",
  "lastName": "Prunkl",
  "email": "shannon@proper.insure",
  "phone": "(443) 798-8013",
  "address": {
    "line1": "3183 Orthello Way",
    "line2": "",
    "city": "Santa Clara",
    "state": "CA",
    "postalCode": "95051",
    "country": "USA"
  }
}
}
```

**Error Codes**

| Code | Message |
| ----- | ----- |
| 401 | Unauthorized \- Invalid credentials |
| 404 | User not found |

**Database Table: CustomerProfile** \[Existing Table\]

| Column Name | Data Type | Constraints / Notes |
| :---- | :---- | :---- |
| id | SERIAL | Primary Key. Auto-incrementing integer |
| email | VARCHAR(255) | Required, Unique. The user's primary email address |
| first\_name | VARCHAR(255) | The user's first name |
| last\_name | VARCHAR(255) | The user's last name |
| phone | VARCHAR(50) | The user's phone number |
| profile\_picture\_url | TEXT | URL for the user's profile picture |
| address\_line1 | TEXT | The first line of the user's address |
| address\_line2 | TEXT | The second line of the user's address |
| address\_city | VARCHAR(255) | The city from the user's address |
| address\_state | VARCHAR(255) | The state or province from the user's address |
| address\_postal\_code | VARCHAR(50) | The postal or ZIP code |
| address\_country | VARCHAR(255) | The country from the user's address |

---

## **2\. User Registration (API \#2)**

**Endpoint Summary**

* New endpoint: POST /api/register

**Header Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| Content-Type | "application/json" | String | Yes |

**Request Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| email | me@mitrai.com | String | Yes |
| password | 1234@abc | String | Yes |

**Expected API Response**

JSON

```
{
  "message": "User registration initiated. Please check your email for verification.",
  "userId": "cognito-user-id"
}
```

**Error Codes**

| Code | Message |
| :---- | :---- |
| 400 | Invalid request data (e.g., missing email or password) |
| 409 | User already exists |

**Database Table** \[Uses existing CustomerProfile table\]

---

## **3\. Get All Policies(API \#3)**

**Endpoint Summary**

* New endpoint: GET /api/policies    

**Header Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| Authorization | "Auth token" | String | Yes |
| Content-Type | "application/json" | String | Yes |

**Request Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| \- | \- | \- | \- |

**Expected API Response**

JSON

```
[
  {
    "id": "123",
    "name": "Commercial Property",
    "type": "COMMERCIAL",
    "address": "123 Business Ave, Commerce City, CA 90210",
    "policy": {
      "number": "POL-12345-6789",
      "effectiveDate": "2024-01-15",
      "expirationDate": "2025-01-15",
      "coverageAmount": 1500000.10,
      "deductible": 5000.20,
      "status": "ACTIVE"
    }
  }
]
```

**Error Codes**

**Database Table: Properties** \[New Table Required\]

| Column Name | Data Type | Constraints / Notes |
| :---- | :---- | :---- |
| id | SERIAL | Primary Key. Auto-incrementing integer |
| user\_id | INTEGER | Foreign Key to CustomerProfile.id |
| name | VARCHAR(255) | Required. Property name |
| type | VARCHAR(50) | Required. Property type (COMMERCIAL, RESIDENTIAL, etc.) |
| address | TEXT | Required. Full property address |
| policy\_number | VARCHAR(100) | Policy number |
| effective\_date | DATE | Policy effective date |
| expiration\_date | DATE | Policy expiration date |
| coverage\_amount | DECIMAL(15,2) | Coverage amount |
| deductible | DECIMAL(15,2) | Deductible amount |
| status | VARCHAR(50) | Policy status |

---

## **4\. Get Property by ID (API \#4)**

**Endpoint Summary**

* New endpoint: GET /api/properties/{propertyId}

**Header Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| Authorization | "Auth token" | String | Yes |
| Content-Type | "application/json" | String | Yes |

**Request Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| propertyId | prop\_123 | String | Yes |

**Expected API Response**

JSON

```
{
  "id": "prop_123",
  "name": "Commercial Property",
  "address": "123 Business Ave, Commerce City, CA 90210",
  "policy": {
    "number": "POL-12345-6789",
    "effectiveDate": "2024-01-15",
    "expirationDate": "2025-01-15",
    "status": "Active",
    "terms": [
      {
        "id": "pt1",
        "locationTerms": [
          {
            "locationTermId": "pt1-lt-1",
            "buildingTerms": [
              {
                "id": "pt1-lt-1-b1",
                "coverageDetails": {}
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Error Codes**

**Database Table** \[Uses existing Properties table\]

---

## **5\. Get All Claims (API \#5)**

**Endpoint Summary**

* New endpoint: GET /api/claims  
* not yet created api from client side need to mock the data assuming comes from ITS backend

**Header Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| Authorization | "Auth token" | String | Yes |
| Content-Type | "application/json" | String | Yes |

**Request Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| \- | \- | \- | \- |

**Expected API Response**

JSON

```
[
  {
    "id": "claim_987",
    "number": "CLM-98765-4321",
    "damageType": "WATER_DAMAGE",
    "dateOfLoss": "2024-03-05",
    "progress": "Adjuster Review",
    "address": "123 Business Ave, Commerce City, CA 90210"
    "estimatedDamage": 25000,
    "lastUpdated": "2024-03-10"
  }
]
```

**Error Codes**

**Database Table: Claims** \[New Table Required\]

| Column Name | Data Type | Constraints / Notes |
| :---- | :---- | :---- |
| id | SERIAL | Primary Key. Auto-incrementing integer |
| user\_id | INTEGER | Foreign Key to CustomerProfile.id |
| property\_id | INTEGER | Foreign Key to Properties.id |
| number | VARCHAR(100) | Required. Claim number |
| damage\_type | VARCHAR(255) | Required. Type of damage |
| date\_of\_loss | DATE | Required. Date when loss occurred |
| progress | VARCHAR(100) | Required. Claim status |
| address | TEXT | Required. Full property address |
| estimated\_damage | DECIMAL(15,2) | Estimated damage amount |
| last\_updated | TIMESTAMPTZ | Required. Last update timestamp |

---

## **6\. Get All Documents (API \#6)**

**Endpoint Summary**

* New endpoint: GET /api/documents

**Header Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| Authorization | "Auth token" | String | Yes |
| Content-Type | "application/json" | String | Yes |

**Request Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| type | policy | String | No |

**Expected API Response**

JSON

```
[
  {
    "id": "doc_xyz",
    "name": "Commercial Property Policy.pdf",
    "type": "POLICY",
    "uploadDate": "2024-01-15",
    "downloadUrl": "/api/documents/doc_xyz/download"
  }
]
```

**Error Codes**

**Database Table: Documents** \[New Table Required\]

| Column Name | Data Type | Constraints / Notes |
| :---- | :---- | :---- |
| id | SERIAL | Primary Key. Auto-incrementing integer |
| user\_id | INTEGER | Foreign Key to CustomerProfile.id |
| name | VARCHAR(255) | Required. Document name |
| type | VARCHAR(100) | Required. Document type (policy, claim, assessment) |
| file\_path | TEXT | Required. File storage path |
| upload\_date | TIMESTAMPTZ | Required. Upload timestamp |

---

## **7\. Download Document (API \#7)**

**Endpoint Summary**

* New endpoint: GET /api/documents/{documentId}/download

**Header Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| Authorization | "Auth token" | String | Yes |
| Content-Type | "application/json" | String | Yes |

**Request Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| documentId | doc\_xyz | String | Yes |

**Expected API Response**

```
File content (binary data)
```

**Error Codes**

**Database Table** \[Uses existing Documents table\]

---

```
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "(555) 123-4567",
  "address": "123 Main St, Anytown, USA 12345",
  "profilePictureUrl": "url_to_image"
}
```

**Error Codes**

**Database Table** \[Uses existing CustomerProfile table\]

---

## **10\. Chatbot Intent Processing (API \#10)**

**Endpoint Summary**

* New endpoint: POST /api/chatbot/intents

**Header Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| Authorization | "Auth token" | String | Yes |
| Content-Type | "application/json" | String | Yes |

**Request Params**

| Parameter | Sample value | Type | Required |
| :---- | :---- | :---- | :---- |
| intent | ClaimStatusCheck | String | Yes |
| parameters | {"claimId": "CLM-98765-4321"} | Object | Yes |

**Expected API Response**

JSON

```
{
  "response": "Your claim from March 5, 2024 is currently in Adjuster Review. The assigned adjuster is John Smith, and the estimated resolution date is July 30, 2025. You can view your full claim in the 'Property Claims' section."
}
```

**Error Codes**

**Database Table: ChatbotIntents** \[New Table Required\]

| Column Name | Data Type | Constraints / Notes |
| :---- | :---- | :---- |
| id | SERIAL | Primary Key. Auto-incrementing integer |
| user\_id | INTEGER | Foreign Key to CustomerProfile.id |
| intent | VARCHAR(255) | Required. Intent type |
| parameters | JSONB | Intent parameters |
| response | TEXT | Generated response |
| created\_at | TIMESTAMPTZ | Required. Automatically set to the time of creation |

