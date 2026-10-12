# Health Insurance Application System

A complete health insurance application system with frontend form validation, backend data processing, and automated risk assessment.

## Features

- **Frontend**
  - Comprehensive health insurance application form
  - Real-time form validation with visual feedback
  - Responsive design with dark mode support
  - BMI calculation with unit conversion (metric/imperial)
  - Height units: cm or feet/inches
  - Weight units: kg, lbs, or stone/pounds
  - Health conditions tracking with "Other" option
  - Support for Individual, Spouse, and Family coverage
  - Check existing application status

- **Backend**
  - Express.js REST API
  - Automated risk assessment and application evaluation
  - Automatic approval, rejection, or referral based on risk factors
  - Dynamic insurance quote generation for approved applications
  - Form data validation (frontend and backend)
  - JSON file storage with update capability
  - Application ID generation
  - CORS support
  - Multi-person risk evaluation for family coverage

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
  surgeries, familyHistory, terms,
  // For spouse coverage:
  spouse_fullName, spouse_nino, spouse_dob, spouse_height, spouse_weight, spouse_smoking, spouse_preexisting, spouse_conditions,
  // For family coverage:
  numDependents, dependent0_fullName, dependent0_nino, dependent0_dob, etc.
}

Response: {
  success: true,
  applicationId: "APP-1234567890-123",
  submissionDate: "2024-01-01T12:00:00.000Z",
  status: "approved|rejected|referred",
  evaluationDetails: {
    riskScore: 2.5,
    reasons: ["Low risk profile"]
  },
  quote: {
    monthlyPremium: 60,
    annualPremium: 720,
    annualPremiumWithDiscount: 662,
    annualSavings: 58,
    riskCategory: "Low",
    coverageType: "individual",
    numPeople: 1
  }
}
```

### Check Application
```
GET /api/check-application?fullName=John%20Doe&nino=AB123456C

Response: {
  success: true,
  application: {...}
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
      "lastUpdated": "2024-01-02T10:00:00.000Z",
      "status": "approved|rejected|referred",
      "evaluationDetails": {
        "riskScore": 2.5,
        "reasons": ["Low risk profile"],
        "evaluatedAt": "2024-01-01T12:00:00.000Z"
      },
      "quote": {
        "monthlyPremium": 60,
        "annualPremium": 720,
        "annualPremiumWithDiscount": 662,
        "annualSavings": 58,
        "riskCategory": "Low",
        "coverageType": "individual",
        "numPeople": 1
      },
      "personalInfo": {...},
      "address": {...},
      "coverage": {...},
      "healthInfo": {...},
      "spouse": {...},
      "dependents": [...],
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
- County (dropdown with UK counties)
- Postcode

### Coverage Options
- **Individual**: Single person coverage
- **Individual + Spouse**: Coverage for applicant and spouse
- **Family**: Coverage for applicant and multiple family members

### Health Information
- Height with unit selection (cm or feet/inches)
- Weight with unit selection (kg, lbs, or stone/pounds)
- Smoking Status (Never, Former, Current)
- Existing Health Conditions (multiple checkboxes including "Other" with text input)
- Current Medications (optional)
- Past Surgeries/Hospitalizations (optional)
- Family Medical History (optional, primary applicant only)

### Spouse/Family Member Information (when applicable)
- Full Name
- National Insurance Number
- Date of Birth
- Height and Weight
- Smoking Status
- Pre-existing Conditions
- Health Conditions
- Current Medications (optional)
- Past Surgeries/Hospitalizations (optional)

## Validation Rules

- **Email**: Valid email format
- **Phone**: 10-11 digits
- **NI Number**: Format AB123456C (validated for all applicants)
- **Postcode**: Valid UK postcode format
- **Age**: Must be 18+ (for primary applicant)
- **Height**: 
  - Metric: 90-250 cm
  - Imperial: 3-8 feet, 0-11 inches
- **Weight**: 
  - Metric: 20-250 kg
  - Imperial: 44-551 lbs or 3-40 stone with 0-13 pounds
- **Terms**: Must be accepted
- **Other Condition**: Minimum 3 characters when "Other" is selected

## Risk Assessment & Pricing

The system automatically evaluates applications based on multiple risk factors:

### Risk Factors
- **Age**: Higher risk for ages 50+ and 65+
- **BMI**: Underweight (<18.5), Overweight (25-30), Obese (30+)
- **Smoking Status**: Current smokers (high risk), Former smokers (low risk)
- **Pre-existing Conditions**: Presence of any conditions
- **High-Risk Conditions**: Cancer, Heart Disease, Stroke, Kidney Disease
- **Medium-Risk Conditions**: Diabetes, High Blood Pressure, COPD, Sleep Apnea
- **Multiple Conditions**: 3+ conditions increase risk
- **"Other" Conditions**: Automatically triggers referral or rejection

### Decision Logic
- **Approved**: Low risk score (<4), no high-risk conditions
- **Referred**: Medium risk score (4-7), multiple medium-risk conditions, or "other" condition with low overall risk
- **Rejected**: High risk score (≥8), high-risk conditions, or "other" condition with high overall risk

### Pricing (Approved Applications Only)
- **Base Rates**: Individual £50/month, Spouse £85/month, Family £120/month
- **Family Adjustment**: +£25/month per additional family member beyond 2
- **Risk Multipliers**: 
  - Low risk (0-2): 1.0x
  - Medium-Low (2-4): 1.2x
  - Medium (4-6): 1.5x
  - Medium-High (6-8): 2.0x
- **Annual Discount**: 8% savings when paying annually

## User Interface Features

- **Dark Mode**: Toggle between light and dark themes with persistent preference
- **Unit Conversion**: Real-time conversion between metric and imperial units
- **Responsive Design**: Mobile-friendly layout
- **Visual Feedback**: Color-coded validation states (green for valid, red for invalid)
- **Smooth Animations**: Transitions and hover effects for better UX
- **Status Pages**: Separate success pages for approved, rejected, and referred applications
- **Application Lookup**: Check existing application status by name and NI number

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Data Storage**: JSON file system
- **Validation**: Custom validators on both frontend and backend
- **Styling**: CSS Variables for theming, CSS Grid and Flexbox for layout

## License

ISC
