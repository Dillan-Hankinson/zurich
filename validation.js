document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('insuranceForm');
    
    // Exit if form doesn't exist (e.g., on success page)
    if (!form) return;

    // Validation rules
    const validators = {
        fullName: (value) => {
            if (!value.trim()) return 'Full name is required';
            if (value.trim().length < 2) return 'Name must be at least 2 characters';
            if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
            return '';
        },

        email: (value) => {
            if (!value.trim()) return 'Email is required';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) return 'Please enter a valid email address';
            return '';
        },

        phone: (value) => {
            if (!value.trim()) return 'Phone number is required';
            const phoneRegex = /^[\d\s\-\(\)]+$/;
            if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
            const digits = value.replace(/\D/g, '');
            if (digits.length < 10 || digits.length > 11) return 'Phone number must be 10-11 digits';
            return '';
        },

        dob: (value) => {
            if (!value) return 'Date of birth is required';
            const dob = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            if (age < 18) return 'You must be at least 18 years old';
            if (age > 120) return 'Please enter a valid date of birth';
            return '';
        },

        nino: (value) => {
            if (!value.trim()) return 'National Insurance Number is required';
            const ninoRegex = /^[A-Z]{2}\d{6}[A-D]$/i;
            if (!ninoRegex.test(value.replace(/\s/g, ''))) return 'NI Number must be in format AB123456C';
            return '';
        },

        address: (value) => {
            if (!value.trim()) return 'Street address is required';
            if (value.trim().length < 5) return 'Please enter a complete address';
            return '';
        },

        city: (value) => {
            if (!value.trim()) return 'City is required';
            if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'City name can only contain letters';
            return '';
        },

        county: (value) => {
            if (!value) return 'Please select a county';
            return '';
        },

        postcode: (value) => {
            if (!value.trim()) return 'Postcode is required';
            const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
            if (!postcodeRegex.test(value)) return 'Please enter a valid UK postcode';
            return '';
        },

        coverage: (value) => {
            if (!value) return 'Please select a coverage type';
            return '';
        },

        preexisting: (value) => {
            if (!value) return 'Please select an option';
            return '';
        },

        terms: (checked) => {
            if (!checked) return 'You must agree to the terms and conditions';
            return '';
        },

        height: (value) => {
            if (!value) return 'Height is required';
            const height = parseInt(value);
            if (height < 90 || height > 250) return 'Please enter a valid height (90-250 cm)';
            return '';
        },

        weight: (value) => {
            if (!value) return 'Weight is required';
            const weight = parseInt(value);
            if (weight < 20 || weight > 250) return 'Please enter a valid weight (20-250 kg)';
            return '';
        },

        smoking: (value) => {
            if (!value) return 'Please select your smoking status';
            return '';
        },

        otherCondition: (value) => {
            const otherCheckbox = document.getElementById('otherConditionCheckbox');
            if (otherCheckbox && otherCheckbox.checked) {
                if (!value || !value.trim()) return 'Please specify the other condition';
                if (value.trim().length < 3) return 'Please provide more details about the condition';
            }
            return '';
        }
    };

    // Validate single field
    function validateField(field) {
        const fieldName = field.name;
        let value;
        
        if (field.type === 'checkbox') {
            value = field.checked;
        } else if (field.type === 'radio') {
            const radioGroup = document.querySelector(`input[name="${fieldName}"]:checked`);
            value = radioGroup ? radioGroup.value : '';
        } else {
            value = field.value;
        }

        const validator = validators[fieldName];
        if (!validator) return true;

        const errorMessage = validator(value);
        const errorSpan = field.closest('.form-group').querySelector('.error-message');
        
        if (errorMessage) {
            if (field.type !== 'radio' && field.type !== 'checkbox') {
                field.classList.add('invalid');
                field.classList.remove('valid');
            }
            if (errorSpan) errorSpan.textContent = errorMessage;
            return false;
        } else {
            if (field.type !== 'radio' && field.type !== 'checkbox') {
                field.classList.remove('invalid');
                field.classList.add('valid');
            }
            if (errorSpan) errorSpan.textContent = '';
            return true;
        }
    }

    // Handle "Other" checkbox logic
    const conditionCheckboxes = document.querySelectorAll('input[name="conditions"]');
    const otherCheckbox = document.getElementById('otherConditionCheckbox');
    const otherConditionInput = document.getElementById('otherConditionInput');
    const otherConditionField = document.getElementById('otherCondition');
    
    conditionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Show/hide "Other" text input
            if (this.value === 'other') {
                if (this.checked) {
                    otherConditionInput.style.display = 'block';
                    otherConditionField.setAttribute('required', 'required');
                } else {
                    otherConditionInput.style.display = 'none';
                    otherConditionField.removeAttribute('required');
                    otherConditionField.value = '';
                    otherConditionField.classList.remove('valid', 'invalid');
                    const errorSpan = otherConditionInput.querySelector('.error-message');
                    if (errorSpan) errorSpan.textContent = '';
                }
            }
        });
    });

    // Add real-time validation
    const inputs = form.querySelectorAll('input:not([name="conditions"]):not([name="otherCondition"]), select, textarea:not([name="medications"]):not([name="surgeries"]):not([name="familyHistory"])');
    
    // Add otherCondition field separately with validation
    if (otherConditionField) {
        otherConditionField.addEventListener('blur', function() {
            if (otherCheckbox && otherCheckbox.checked) {
                validateField(this);
            }
        });
        
        otherConditionField.addEventListener('input', function() {
            if (this.classList.contains('invalid') && otherCheckbox && otherCheckbox.checked) {
                validateField(this);
            }
        });
    }
    
    inputs.forEach(input => {
        if (input.type === 'radio') {
            input.addEventListener('change', function() {
                validateField(this);
            });
        } else if (input.type === 'checkbox' && input.name !== 'conditions') {
            input.addEventListener('change', function() {
                validateField(this);
            });
        } else {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('invalid')) {
                    validateField(this);
                }
            });
        }
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        let isValid = true;

        // Validate all fields
        inputs.forEach(input => {
            if (input.type === 'radio') {
                const radioName = input.name;
                if (document.querySelector(`input[name="${radioName}"]`)) {
                    const firstRadio = document.querySelector(`input[name="${radioName}"]`);
                    if (!validateField(firstRadio)) {
                        isValid = false;
                    }
                }
            } else {
                if (!validateField(input)) {
                    isValid = false;
                }
            }
        });

        if (isValid) {
            // Validate "other condition" field if "other" is checked
            const otherCheckbox = document.getElementById('otherConditionCheckbox');
            const otherConditionField = document.getElementById('otherCondition');
            if (otherCheckbox && otherCheckbox.checked) {
                if (!validateField(otherConditionField)) {
                    isValid = false;
                }
            }
        }

        if (isValid) {
            // Collect health conditions
            const selectedConditions = Array.from(document.querySelectorAll('input[name="conditions"]:checked'))
                .map(cb => cb.value);
            
            // Add "other" condition text if specified
            const otherConditionText = document.getElementById('otherCondition').value;
            if (selectedConditions.includes('other') && otherConditionText.trim()) {
                const otherIndex = selectedConditions.indexOf('other');
                selectedConditions[otherIndex] = `other: ${otherConditionText.trim()}`;
            }

            // Prepare form data for submission
            const formData = new FormData(form);
            const jsonData = {};
            
            // Convert FormData to JSON object
            for (let [key, value] of formData.entries()) {
                if (key === 'conditions') {
                    // Handle multiple checkboxes
                    if (!jsonData.conditions) {
                        jsonData.conditions = [];
                    }
                    jsonData.conditions.push(value);
                } else {
                    jsonData[key] = value;
                }
            }

            // Add conditions if not already added
            if (!jsonData.conditions) {
                jsonData.conditions = selectedConditions;
            }

            // Convert terms checkbox to string
            jsonData.terms = document.getElementById('terms').checked ? 'true' : 'false';

            // Submit to backend
            fetch('http://localhost:3000/api/submit-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirect to success page with application ID
                    window.location.href = `success.html?id=${data.applicationId}&date=${encodeURIComponent(data.submissionDate)}`;
                } else {
                    alert('Error submitting application: ' + (data.errors ? data.errors.join(', ') : data.message));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while submitting your application. Please ensure the server is running and try again.');
            });
        } else {
            // Scroll to first error
            const firstError = form.querySelector('.invalid, .error-message:not(:empty)');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    // Reset form
    form.addEventListener('reset', function() {
        setTimeout(() => {
            inputs.forEach(input => {
                input.classList.remove('valid', 'invalid');
                const errorSpan = input.closest('.form-group')?.querySelector('.error-message');
                if (errorSpan) errorSpan.textContent = '';
            });
        }, 0);
    });

});
