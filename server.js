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

// Evaluate a single person's risk
function evaluatePerson(age, bmi, smoking, preexisting, healthConditions, personLabel) {
    const reasons = [];
    let riskScore = 0;

    // Check for "other" condition - never approve, only reject or refer
    const hasOtherCondition = healthConditions.some(condition => 
        condition.toLowerCase().includes('other:')
    );
    let otherConditionPenalty = 0;
    if (hasOtherCondition) {
        otherConditionPenalty = 3;
        reasons.push(`${personLabel}: Other health condition requires manual review`);
    }

    // Age evaluation
    if (age > 65) {
        riskScore += 2;
        reasons.push(`${personLabel}: Age over 65`);
    } else if (age > 50) {
        riskScore += 1;
        reasons.push(`${personLabel}: Age over 50`);
    }

    // BMI evaluation
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) {
        riskScore += 2;
        reasons.push(`${personLabel}: BMI below healthy range (underweight)`);
    } else if (bmiValue >= 30) {
        riskScore += 2;
        reasons.push(`${personLabel}: BMI indicates obesity`);
    } else if (bmiValue >= 25) {
        riskScore += 1;
        reasons.push(`${personLabel}: BMI indicates overweight`);
    }

    // Smoking status
    if (smoking === 'current') {
        riskScore += 3;
        reasons.push(`${personLabel}: Current smoker`);
    } else if (smoking === 'former') {
        riskScore += 1;
        reasons.push(`${personLabel}: Former smoker`);
    }

    // Pre-existing conditions
    if (preexisting === 'yes') {
        riskScore += 2;
        reasons.push(`${personLabel}: Has pre-existing conditions`);
    }

    // High-risk health conditions
    const highRiskConditions = ['cancer', 'heart_disease', 'stroke', 'kidney_disease'];
    const mediumRiskConditions = ['diabetes', 'high_blood_pressure', 'copd', 'sleep_apnea'];
    
    let hasHighRisk = false;
    let mediumRiskCount = 0;

    healthConditions.forEach(condition => {
        if (highRiskConditions.includes(condition)) {
            hasHighRisk = true;
            riskScore += 3;
            reasons.push(`${personLabel}: High-risk condition: ${condition.replace('_', ' ')}`);
        } else if (mediumRiskConditions.includes(condition)) {
            mediumRiskCount++;
            riskScore += 1;
            reasons.push(`${personLabel}: Medium-risk condition: ${condition.replace('_', ' ')}`);
        }
    });

    // Multiple conditions increase risk
    if (healthConditions.length >= 3) {
        riskScore += 2;
        reasons.push(`${personLabel}: Multiple health conditions`);
    }

    // Add "other" condition penalty to risk score
    riskScore += otherConditionPenalty;

    return { riskScore, reasons, hasHighRisk, hasOtherCondition, mediumRiskCount };
}

// Evaluate application and determine status
function evaluateApplication(formData, bmi, healthConditions) {
    const allReasons = [];
    let totalRiskScore = 0;
    let hasAnyHighRisk = false;
    let hasAnyOtherCondition = false;
    let totalMediumRiskCount = 0;
    let numPeople = 1;

    // Evaluate primary applicant
    const dob = new Date(formData.dob);
    const age = new Date().getFullYear() - dob.getFullYear();
    const primaryEval = evaluatePerson(age, bmi, formData.smoking, formData.preexisting, healthConditions, 'Primary applicant');
    
    totalRiskScore += primaryEval.riskScore;
    allReasons.push(...primaryEval.reasons);
    hasAnyHighRisk = hasAnyHighRisk || primaryEval.hasHighRisk;
    hasAnyOtherCondition = hasAnyOtherCondition || primaryEval.hasOtherCondition;
    totalMediumRiskCount += primaryEval.mediumRiskCount;

    // Evaluate spouse for spouse coverage
    if (formData.coverage === 'spouse' && formData.spouse_age) {
        numPeople += 1;
        
        const spouseAge = parseInt(formData.spouse_age) || 0;
        const spouseHeight = parseFloat(formData.spouse_height) || 0;
        const spouseWeight = parseFloat(formData.spouse_weight) || 0;
        const spouseBmi = calculateBMI(spouseHeight, spouseWeight);
        const spouseSmoking = formData.spouse_smoking || 'never';
        const spousePreexisting = formData.spouse_preexisting || 'no';
        
        // Parse spouse health conditions
        let spouseConditions = [];
        if (formData.spouse_conditions) {
            if (Array.isArray(formData.spouse_conditions)) {
                spouseConditions = formData.spouse_conditions;
            } else if (typeof formData.spouse_conditions === 'string') {
                spouseConditions = formData.spouse_conditions.split(',').map(c => c.trim()).filter(c => c);
            }
        }

        const spouseEval = evaluatePerson(spouseAge, spouseBmi, spouseSmoking, spousePreexisting, spouseConditions, 'Spouse');
        
        totalRiskScore += spouseEval.riskScore;
        allReasons.push(...spouseEval.reasons);
        hasAnyHighRisk = hasAnyHighRisk || spouseEval.hasHighRisk;
        hasAnyOtherCondition = hasAnyOtherCondition || spouseEval.hasOtherCondition;
        totalMediumRiskCount += spouseEval.mediumRiskCount;
    }

    // Evaluate dependents for family coverage
    if (formData.coverage === 'family' && formData.numDependents) {
        const numDependents = parseInt(formData.numDependents);
        numPeople += numDependents;

        for (let i = 0; i < numDependents; i++) {
            const depAge = parseInt(formData[`dependent${i}_age`]) || 0;
            const depHeight = parseFloat(formData[`dependent${i}_height`]) || 0;
            const depWeight = parseFloat(formData[`dependent${i}_weight`]) || 0;
            const depBmi = calculateBMI(depHeight, depWeight);
            const depSmoking = formData[`dependent${i}_smoking`] || 'never';
            const depPreexisting = formData[`dependent${i}_preexisting`] || 'no';
            
            // Parse dependent health conditions
            let depConditions = [];
            if (formData[`dependent${i}_conditions`]) {
                if (Array.isArray(formData[`dependent${i}_conditions`])) {
                    depConditions = formData[`dependent${i}_conditions`];
                } else if (typeof formData[`dependent${i}_conditions`] === 'string') {
                    depConditions = formData[`dependent${i}_conditions`].split(',').map(c => c.trim()).filter(c => c);
                }
            }

            const depEval = evaluatePerson(depAge, depBmi, depSmoking, depPreexisting, depConditions, `Dependent ${i + 1}`);
            
            totalRiskScore += depEval.riskScore;
            allReasons.push(...depEval.reasons);
            hasAnyHighRisk = hasAnyHighRisk || depEval.hasHighRisk;
            hasAnyOtherCondition = hasAnyOtherCondition || depEval.hasOtherCondition;
            totalMediumRiskCount += depEval.mediumRiskCount;
        }
    }

    // Calculate average risk score
    const averageRiskScore = totalRiskScore / numPeople;
    const roundedAvgRisk = Math.round(averageRiskScore * 10) / 10;

    // Add summary reason
    if (numPeople > 1) {
        allReasons.unshift(`Family coverage: ${numPeople} people, average risk score: ${roundedAvgRisk}`);
    }

    // Decision logic - if any "other" condition exists, never approve
    if (hasAnyOtherCondition) {
        if (averageRiskScore >= 6 || hasAnyHighRisk) {
            return { status: 'rejected', reasons: allReasons, riskScore: roundedAvgRisk };
        } else {
            return { status: 'referred', reasons: allReasons, riskScore: roundedAvgRisk };
        }
    }
    
    // Normal evaluation without "other" condition
    if (averageRiskScore >= 8 || hasAnyHighRisk) {
        return { status: 'rejected', reasons: allReasons, riskScore: roundedAvgRisk };
    } else if (averageRiskScore >= 4 || totalMediumRiskCount >= 2) {
        return { status: 'referred', reasons: allReasons, riskScore: roundedAvgRisk };
    } else {
        return { status: 'approved', reasons: ['Low risk profile'], riskScore: roundedAvgRisk };
    }
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

    // Family coverage validation
    if (data.coverage === 'family') {
        if (!data.numDependents || parseInt(data.numDependents) < 1) {
            errors.push('Number of dependents is required for family coverage');
        }
        
        const numDependents = parseInt(data.numDependents) || 0;
        for (let i = 0; i < numDependents; i++) {
            if (!data[`dependent${i}_age`]) {
                errors.push(`Age is required for dependent ${i + 1}`);
            }
            if (!data[`dependent${i}_height`]) {
                errors.push(`Height is required for dependent ${i + 1}`);
            }
            if (!data[`dependent${i}_weight`]) {
                errors.push(`Weight is required for dependent ${i + 1}`);
            }
            if (!data[`dependent${i}_smoking`]) {
                errors.push(`Smoking status is required for dependent ${i + 1}`);
            }
            if (!data[`dependent${i}_preexisting`]) {
                errors.push(`Pre-existing conditions status is required for dependent ${i + 1}`);
            }
        }
    }

    // Spouse coverage validation
    if (data.coverage === 'spouse') {
        if (!data.spouse_age) {
            errors.push('Spouse age is required');
        }
        if (!data.spouse_height) {
            errors.push('Spouse height is required');
        }
        if (!data.spouse_weight) {
            errors.push('Spouse weight is required');
        }
        if (!data.spouse_smoking) {
            errors.push('Spouse smoking status is required');
        }
        if (!data.spouse_preexisting) {
            errors.push('Spouse pre-existing conditions status is required');
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

    // Pre-existing conditions validation
    if (data.preexisting === 'yes') {
        // Parse health conditions
        let healthConditions = [];
        if (data.conditions) {
            if (Array.isArray(data.conditions)) {
                healthConditions = data.conditions;
            } else if (typeof data.conditions === 'string') {
                healthConditions = data.conditions.split(',').map(c => c.trim()).filter(c => c);
            }
        }
        
        if (healthConditions.length === 0) {
            errors.push('Please select at least one health condition when pre-existing conditions is "Yes"');
        }
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

        // Evaluate application
        const evaluation = evaluateApplication(formData, bmi, healthConditions);

        // Build spouse data for spouse coverage
        let spouseData = null;
        if (formData.coverage === 'spouse' && formData.spouse_age) {
            const spouseHeight = parseFloat(formData.spouse_height);
            const spouseWeight = parseFloat(formData.spouse_weight);
            const spouseBmi = calculateBMI(spouseHeight, spouseWeight);
            
            let spouseConditions = [];
            if (formData.spouse_conditions) {
                if (Array.isArray(formData.spouse_conditions)) {
                    spouseConditions = formData.spouse_conditions;
                } else if (typeof formData.spouse_conditions === 'string') {
                    spouseConditions = formData.spouse_conditions.split(',').map(c => c.trim()).filter(c => c);
                }
            }

            spouseData = {
                age: parseInt(formData.spouse_age),
                height: spouseHeight,
                weight: spouseWeight,
                bmi: parseFloat(spouseBmi),
                smokingStatus: formData.spouse_smoking,
                preexistingConditions: formData.spouse_preexisting === 'yes',
                conditions: spouseConditions,
                medications: formData.spouse_medications ? formData.spouse_medications.trim() : '',
                surgeries: formData.spouse_surgeries ? formData.spouse_surgeries.trim() : '',
                familyHistory: formData.spouse_familyHistory ? formData.spouse_familyHistory.trim() : ''
            };
        }

        // Build dependents array for family coverage
        const dependents = [];
        if (formData.coverage === 'family' && formData.numDependents) {
            const numDependents = parseInt(formData.numDependents);
            for (let i = 0; i < numDependents; i++) {
                const depHeight = parseFloat(formData[`dependent${i}_height`]);
                const depWeight = parseFloat(formData[`dependent${i}_weight`]);
                const depBmi = calculateBMI(depHeight, depWeight);
                
                let depConditions = [];
                if (formData[`dependent${i}_conditions`]) {
                    if (Array.isArray(formData[`dependent${i}_conditions`])) {
                        depConditions = formData[`dependent${i}_conditions`];
                    } else if (typeof formData[`dependent${i}_conditions`] === 'string') {
                        depConditions = formData[`dependent${i}_conditions`].split(',').map(c => c.trim()).filter(c => c);
                    }
                }

                dependents.push({
                    dependentNumber: i + 1,
                    age: parseInt(formData[`dependent${i}_age`]),
                    height: depHeight,
                    weight: depWeight,
                    bmi: parseFloat(depBmi),
                    smokingStatus: formData[`dependent${i}_smoking`],
                    preexistingConditions: formData[`dependent${i}_preexisting`] === 'yes',
                    conditions: depConditions,
                    medications: formData[`dependent${i}_medications`] ? formData[`dependent${i}_medications`].trim() : '',
                    surgeries: formData[`dependent${i}_surgeries`] ? formData[`dependent${i}_surgeries`].trim() : '',
                    familyHistory: formData[`dependent${i}_familyHistory`] ? formData[`dependent${i}_familyHistory`].trim() : ''
                });
            }
        }

        // Create application object
        const application = {
            applicationId: generateApplicationId(),
            submissionDate: new Date().toISOString(),
            status: evaluation.status,
            evaluationDetails: {
                riskScore: evaluation.riskScore,
                reasons: evaluation.reasons,
                evaluatedAt: new Date().toISOString()
            },
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
                preexistingConditions: formData.preexisting === 'yes',
                numDependents: formData.coverage === 'family' ? parseInt(formData.numDependents) : 0
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
            spouse: spouseData,
            dependents: dependents,
            termsAccepted: true,
            termsAcceptedDate: new Date().toISOString()
        };

        // Read existing applications
        const data = await readApplications();

        // Check if application with same National Insurance Number already exists
        const normalizedNino = formData.nino.trim().toUpperCase().replace(/\s/g, '');
        const existingIndex = data.applications.findIndex(
            app => app.personalInfo.nationalInsuranceNumber === normalizedNino
        );

        let isUpdate = false;
        if (existingIndex !== -1) {
            // Update existing application, preserve original ID and submission date
            const originalId = data.applications[existingIndex].applicationId;
            const originalSubmissionDate = data.applications[existingIndex].submissionDate;
            
            application.applicationId = originalId;
            application.submissionDate = originalSubmissionDate;
            application.lastUpdated = new Date().toISOString();
            
            data.applications[existingIndex] = application;
            isUpdate = true;
        } else {
            // Add new application
            data.applications.push(application);
        }

        // Write back to file
        await writeApplications(data);

        // Log success
        console.log(`Application ${isUpdate ? 'updated' : 'submitted'}: ${application.applicationId}`);
        console.log(`Applicant: ${application.personalInfo.fullName}`);
        console.log(`Email: ${application.personalInfo.email}`);
        console.log(`NI Number: ${application.personalInfo.nationalInsuranceNumber}`);
        console.log(`BMI: ${application.healthInfo.bmi}`);
        console.log(`Status: ${application.status.toUpperCase()}`);
        console.log(`Risk Score: ${evaluation.riskScore}`);
        console.log(`Reasons: ${evaluation.reasons.join(', ')}`);

        // Send success response
        res.json({
            success: true,
            message: isUpdate ? 'Application updated successfully' : 'Application submitted successfully',
            applicationId: application.applicationId,
            submissionDate: application.submissionDate,
            lastUpdated: application.lastUpdated,
            isUpdate: isUpdate,
            status: application.status,
            evaluationDetails: application.evaluationDetails
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
