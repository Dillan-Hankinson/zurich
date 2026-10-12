document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('insuranceForm');
    const successMessage = document.getElementById('successMessage');

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
            if (digits.length < 10) return 'Phone number must be at least 10 digits';
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

        ssn: (value) => {
            if (!value.trim()) return 'Social Security Number is required';
            const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
            if (!ssnRegex.test(value)) return 'SSN must be in format XXX-XX-XXXX';
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

        state: (value) => {
            if (!value) return 'Please select a state';
            return '';
        },

        zip: (value) => {
            if (!value.trim()) return 'ZIP code is required';
            if (!/^\d{5}(-\d{4})?$/.test(value)) return 'ZIP code must be 5 digits (or 5+4 format)';
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

    // Add real-time validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type === 'radio') {
            input.addEventListener('change', function() {
                validateField(this);
            });
        } else if (input.type === 'checkbox') {
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
            // Hide form and show success message
            form.style.display = 'none';
            successMessage.style.display = 'block';

            // Log form data (in real app, this would be sent to server)
            const formData = new FormData(form);
            console.log('Form submitted successfully!');
            console.log('Form data:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
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
