-- Health Insurance Application Database Schema

-- Create the database
CREATE DATABASE IF NOT EXISTS health_insurance;
USE health_insurance;

-- Main applications table
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    ssn VARCHAR(11) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    coverage_type ENUM('individual', 'family', 'spouse', 'children') NOT NULL,
    preexisting_conditions ENUM('yes', 'no') NOT NULL,
    terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected', 'under_review') DEFAULT 'pending',
    INDEX idx_email (email),
    INDEX idx_ssn (ssn),
    INDEX idx_submission_date (submission_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log table to track changes
CREATE TABLE application_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_status ENUM('pending', 'approved', 'rejected', 'under_review'),
    new_status ENUM('pending', 'approved', 'rejected', 'under_review'),
    notes TEXT,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_change_date (change_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing documents/attachments (optional)
CREATE TABLE application_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample insert query (for reference)
-- INSERT INTO applications (
--     full_name, email, phone, date_of_birth, ssn,
--     street_address, city, state, zip_code,
--     coverage_type, preexisting_conditions, terms_accepted
-- ) VALUES (
--     'John Doe',
--     'john.doe@example.com',
--     '555-123-4567',
--     '1985-06-15',
--     '123-45-6789',
--     '123 Main Street',
--     'Springfield',
--     'IL',
--     '62701',
--     'individual',
--     'no',
--     TRUE
-- );
