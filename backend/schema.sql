-- Nimbus Lending Schema for MySQL / SQLite
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'user',
  phone VARCHAR(30),
  employment_type VARCHAR(60) DEFAULT 'Salaried',
  monthly_income DECIMAL(12,2) DEFAULT 50000.00,
  credit_score INT DEFAULT 720,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 10.50,
  min_amount DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
  max_amount DECIMAL(12,2) NOT NULL DEFAULT 5000000.00,
  min_tenure INT NOT NULL DEFAULT 12,
  max_tenure INT NOT NULL DEFAULT 60,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_criteria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_type VARCHAR(60) NOT NULL UNIQUE,
  min_income DECIMAL(12,2) NOT NULL DEFAULT 25000.00,
  min_credit_score INT NOT NULL DEFAULT 650,
  max_loan_amount DECIMAL(12,2) NOT NULL DEFAULT 5000000.00,
  min_age INT NOT NULL DEFAULT 21,
  max_age INT NOT NULL DEFAULT 60,
  max_debt_ratio DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_name VARCHAR(120) NOT NULL,
  email VARCHAR(160),
  phone VARCHAR(30),
  loan_type VARCHAR(60) NOT NULL,
  loan_amount DECIMAL(12,2) NOT NULL,
  tenure_months INT NOT NULL DEFAULT 12,
  purpose VARCHAR(255),
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  status_stage VARCHAR(60) NOT NULL DEFAULT 'Submitted',
  admin_comment TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  doc_type ENUM('aadhaar','pan','salary_slip','bank_statement') NOT NULL,
  file_name VARCHAR(255),
  status ENUM('missing','review','verified') NOT NULL DEFAULT 'missing',
  ocr_data JSON,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_application_doc (application_id, doc_type)
);

CREATE TABLE IF NOT EXISTS eligibility (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  income DECIMAL(12,2) NOT NULL,
  age INT NOT NULL DEFAULT 30,
  credit_score INT NOT NULL,
  employment_type VARCHAR(60) NOT NULL,
  existing_emi DECIMAL(12,2) NOT NULL DEFAULT 0,
  debt_ratio DECIMAL(5,2) NOT NULL,
  eligibility_score INT NOT NULL,
  approval_probability INT NOT NULL DEFAULT 80,
  risk_level VARCHAR(30) NOT NULL DEFAULT 'Low Risk',
  risk_percentage DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  recommended_loan_type VARCHAR(60),
  recommendation_match INT DEFAULT 90,
  recommendation ENUM('approved','rejected') NOT NULL,
  reasons JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  message VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  report_type ENUM('pdf','excel') NOT NULL,
  period VARCHAR(60),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
