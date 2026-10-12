const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'applications.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Serve index.html as the default page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper function to read applications from file
async function readApplications() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { applications: [] };
        }
        throw error;
    }
}

// Helper function to write applications to file
async function writeApplications(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Calculate BMI
function calculateBMI(heightCm, weightKg) {
    const heightM = heightCm / 100;
    return (weightKg / (heightM * heightM)).toFixed(1);
}

// Generate unique application ID
function generateApplicationId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `APP-${timestamp}-${random}`;
}

// Validate form data
function validateFormData(data) {
    const errors = [];

    // Required fields validation
    const requiredFields = [
        'fullName', 'email', 'phone', 'dob', 'nino',
        'address', 'city', 'county', 'postcode',
        'coverage', 'preexisting', 'height', 'weight', 'smoking'
    ];

    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
            errors.push(`${field} is required`);
        }
    }

    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
    }

    // NI Number validation
    if (data.nino && !/^[A-Z]{2}\d{6}[A-D]$/i.test(data.nino.replace(/\s/g, ''))) {
        errors.push('Invalid National Insurance Number format');
    }

    // Postcode validation
    if (data.postcode && !/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(data.postcode)) {
        errors.push('Invalid UK postcode format');
    }

    // Age validation
    if (data.dob) {
        const dob = new Date(data.dob);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 18) {
            errors.push('Applicant must be at least 18 years old');
        }
    }

    // Height and weight validation
    if (data.height && (data.height < 90 || data.height > 250)) {
        errors.push('Height must be between 90 and 250 cm');
    }
    if (data.weight && (data.weight < 20 || data.weight > 250)) {
        errors.push('Weight must be between 20 and 250 kg');
    }

    // Terms acceptance
    if (!data.terms || data.terms !== 'true') {
        errors.push('Terms and conditions must be accepted');
    }

    return errors;
}

// POST endpoint to submit application
app.post('/api/submit-application', async (req, res) => {
    try {
        const formData = req.body;

        // Validate form data
        const validationErrors = validateFormData(formData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: validationErrors
            });
        }

        // Calculate BMI
        const bmi = calculateBMI(
            parseFloat(formData.height),
            parseFloat(formData.weight)
        );

        // Parse health conditions (comes as array or comma-separated string)
        let healthConditions = [];
        if (formData.conditions) {
            if (Array.isArray(formData.conditions)) {
                healthConditions = formData.conditions;
            } else if (typeof formData.conditions === 'string') {
                healthConditions = formData.conditions.split(',').map(c => c.trim());
            }
        }

        // Create application object
        const application = {
            applicationId: generateApplicationId(),
            submissionDate: new Date().toISOString(),
            status: 'pending',
            personalInfo: {
                fullName: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                dateOfBirth: formData.dob,
                nationalInsuranceNumber: formData.nino.trim().toUpperCase().replace(/\s/g, '')
            },
            address: {
                street: formData.address.trim(),
                city: formData.city.trim(),
                county: formData.county,
                postcode: formData.postcode.trim().toUpperCase()
            },
            coverage: {
                type: formData.coverage,
                preexistingConditions: formData.preexisting === 'yes'
            },
            healthInfo: {
                height: parseFloat(formData.height),
                weight: parseFloat(formData.weight),
                bmi: parseFloat(bmi),
                smokingStatus: formData.smoking,
                conditions: healthConditions,
                medications: formData.medications ? formData.medications.trim() : '',
                surgeries: formData.surgeries ? formData.surgeries.trim() : '',
                familyHistory: formData.familyHistory ? formData.familyHistory.trim() : ''
            },
            termsAccepted: true,
            termsAcceptedDate: new Date().toISOString()
        };

        // Read existing applications
        const data = await readApplications();

        // Add new application
        data.applications.push(application);

        // Write back to file
        await writeApplications(data);

        // Log success
        console.log(`New application submitted: ${application.applicationId}`);
        console.log(`Applicant: ${application.personalInfo.fullName}`);
        console.log(`Email: ${application.personalInfo.email}`);
        console.log(`BMI: ${application.healthInfo.bmi}`);

        // Send success response
        res.json({
            success: true,
            message: 'Application submitted successfully',
            applicationId: application.applicationId,
            submissionDate: application.submissionDate
        });

    } catch (error) {
        console.error('Error processing application:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your application',
            error: error.message
        });
    }
});

// GET endpoint to retrieve all applications (for admin purposes)
app.get('/api/applications', async (req, res) => {
    try {
        const data = await readApplications();
        res.json({
            success: true,
            count: data.applications.length,
            applications: data.applications
        });
    } catch (error) {
        console.error('Error retrieving applications:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving applications',
            error: error.message
        });
    }
});

// GET endpoint to retrieve a specific application by ID
app.get('/api/applications/:id', async (req, res) => {
    try {
        const data = await readApplications();
        const application = data.applications.find(
            app => app.applicationId === req.params.id
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.json({
            success: true,
            application
        });
    } catch (error) {
        console.error('Error retrieving application:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving application',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Health Insurance Backend Server running on http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  POST /api/submit-application - Submit new application`);
    console.log(`  GET  /api/applications - Get all applications`);
    console.log(`  GET  /api/applications/:id - Get specific application`);
    console.log(`  GET  /api/health - Health check`);
});
