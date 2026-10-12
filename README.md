# Health Insurance Application System

A complete health insurance application system with frontend form validation and backend data processing.

## Features

- **Frontend**
  - Comprehensive health insurance application form
  - Real-time form validation
  - Responsive design
  - BMI calculation
  - Health conditions tracking

- **Backend**
  - Express.js REST API
  - Form data validation
  - JSON file storage
  - Application ID generation
  - CORS support

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the backend server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

3. Open the application:
   - Open `index.html` in your browser, or
   - Navigate to `http://localhost:3000` if using the server

## API Endpoints

### Submit Application
```
POST /api/submit-application
Content-Type: application/json

Body: {
  fullName, email, phone, dob, nino,
  address, city, county, postcode,
  coverage, preexisting, height, weight,
  smoking, conditions, medications,
  surgeries, familyHistory, terms
}

Response: {
  success: true,
  applicationId: "APP-1234567890-123",
  submissionDate: "2024-01-01T12:00:00.000Z"
}
```

### Get All Applications
```
GET /api/applications

Response: {
  success: true,
  count: 10,
  applications: [...]
}
```

### Get Specific Application
```
GET /api/applications/:id

Response: {
  success: true,
  application: {...}
}
```

### Health Check
```
GET /api/health

Response: {
  status: "ok",
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

## Data Storage

Applications are stored in `applications.json` with the following structure:

```json
{
  "applications": [
    {
      "applicationId": "APP-1234567890-123",
      "submissionDate": "2024-01-01T12:00:00.000Z",
      "status": "pending",
      "personalInfo": {...},
      "address": {...},
      "coverage": {...},
      "healthInfo": {...},
      "termsAccepted": true
    }
  ]
}
```

## Form Fields

### Personal Information
- Full Name
- Email Address
- Phone Number
- Date of Birth
- National Insurance Number

### Address
- Street Address
- Town/City
- County
- Postcode

### Coverage
- Coverage Type (Individual, Family, Individual + Spouse, Individual + Children)
- Pre-existing Conditions (Yes/No)

### Health Information
- Height (cm)
- Weight (kg)
- Smoking Status
- Existing Health Conditions (checkboxes)
- Current Medications
- Past Surgeries/Hospitalizations
- Family Medical History

## Validation Rules

- Email: Valid email format
- Phone: 10-11 digits
- NI Number: Format AB123456C
- Postcode: Valid UK postcode format
- Age: Must be 18+
- Height: 90-250 cm
- Weight: 20-250 kg
- Terms: Must be accepted

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Data Storage**: JSON file system
- **Validation**: Custom validators on both frontend and backend

## License

ISC
