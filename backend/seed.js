import bcrypt from 'bcryptjs';
import pool from './config/db.js';

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (:name, :email, :password_hash, :role)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    { name: 'Admin User', email: 'admin@nimbuslending.com', password_hash: passwordHash, role: 'admin' }
  );

  const applicants = [
    { name: 'Ravi Kumar', email: 'ravi.kumar@example.com', phone: '9876543210', type: 'Personal Loan', amount: 250000, tenure: 24, purpose: 'Home renovation', status: 'approved' },
    { name: 'Ananya Sharma', email: 'ananya.sharma@example.com', phone: '9876543211', type: 'Home Loan', amount: 3500000, tenure: 180, purpose: 'Purchase of flat', status: 'pending' },
    { name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '9876543212', type: 'Vehicle Loan', amount: 800000, tenure: 60, purpose: 'Car purchase', status: 'pending' },
    { name: 'Priya Nair', email: 'priya.nair@example.com', phone: '9876543213', type: 'Education Loan', amount: 1200000, tenure: 84, purpose: 'Postgraduate studies', status: 'rejected' },
    { name: 'Karthik Reddy', email: 'karthik.reddy@example.com', phone: '9876543214', type: 'Personal Loan', amount: 150000, tenure: 12, purpose: 'Medical expenses', status: 'approved' },
    { name: 'Sneha Iyer', email: 'sneha.iyer@example.com', phone: '9876543215', type: 'Business Loan', amount: 2000000, tenure: 36, purpose: 'Working capital', status: 'pending' },
  ];

  const [existing] = await pool.query('SELECT COUNT(*) as count FROM applications');
  if (existing[0].count > 0) {
    console.log('Applications already seeded, skipping.');
  } else {
    for (const a of applicants) {
      const [result] = await pool.query(
        `INSERT INTO applications (applicant_name, email, phone, loan_type, loan_amount, tenure_months, purpose, status)
         VALUES (:name, :email, :phone, :type, :amount, :tenure, :purpose, :status)`,
        a
      );
      const applicationId = result.insertId;

      const docTypes = ['aadhaar', 'pan', 'salary_slip', 'bank_statement'];
      for (const docType of docTypes) {
        const isVerified = a.status !== 'pending' || Math.random() > 0.4;
        await pool.query(
          `INSERT INTO documents (application_id, doc_type, file_name, status, ocr_data)
           VALUES (:application_id, :doc_type, :file_name, :status, :ocr_data)`,
          {
            application_id: applicationId,
            doc_type: docType,
            file_name: `${docType}_${a.name.split(' ')[0].toLowerCase()}.pdf`,
            status: isVerified ? 'verified' : 'review',
            ocr_data: JSON.stringify({ name: a.name, number: 'XXXX-XXXX-XXXX' }),
          }
        );
      }

      const creditScore = 600 + Math.floor(Math.random() * 250);
      const debtRatio = (10 + Math.random() * 40).toFixed(2);
      const eligibilityScore = Math.max(20, Math.min(98, Math.round(creditScore / 8.5 - debtRatio / 2)));
      const recommendation = eligibilityScore >= 60 ? 'approved' : 'rejected';
      const reasons = recommendation === 'approved'
        ? ['Stable income and consistent repayment history', 'Credit score above minimum threshold', 'Debt-to-income ratio within acceptable range']
        : ['Credit score below minimum threshold', 'Debt-to-income ratio too high', 'Insufficient income documentation'];

      await pool.query(
        `INSERT INTO eligibility (application_id, income, credit_score, employment_type, existing_emi, debt_ratio, eligibility_score, recommendation, reasons)
         VALUES (:application_id, :income, :credit_score, :employment_type, :existing_emi, :debt_ratio, :eligibility_score, :recommendation, :reasons)`,
        {
          application_id: applicationId,
          income: 40000 + Math.floor(Math.random() * 80000),
          credit_score: creditScore,
          employment_type: ['Salaried', 'Self-Employed', 'Salaried'][Math.floor(Math.random() * 3)],
          existing_emi: Math.floor(Math.random() * 15000),
          debt_ratio: debtRatio,
          eligibility_score: eligibilityScore,
          recommendation,
          reasons: JSON.stringify(reasons),
        }
      );
    }

    const notifications = [
      'Application #1 was approved.',
      'New document uploaded for Ananya Sharma.',
      'Eligibility check completed for Vikram Singh.',
      'Application #4 was rejected.',
      'Monthly report generated successfully.',
    ];
    for (const message of notifications) {
      await pool.query('INSERT INTO notifications (message) VALUES (:message)', { message });
    }

    const reports = [
      { title: 'Monthly Approval Summary - July', report_type: 'pdf', period: 'July 2026' },
      { title: 'Applications Export - July', report_type: 'excel', period: 'July 2026' },
      { title: 'Monthly Approval Summary - June', report_type: 'pdf', period: 'June 2026' },
    ];
    for (const r of reports) {
      await pool.query(
        'INSERT INTO reports (title, report_type, period) VALUES (:title, :report_type, :period)',
        r
      );
    }
  }

  console.log('Seed complete. Login with admin@nimbuslending.com / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
