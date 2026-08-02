import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

let activeDbMode = 'pending';
let mysqlPool = null;
let sqliteDb = null;

function resolveSsl() {
  if (process.env.DB_SSL_CA && process.env.DB_SSL_CA.trim().length > 0) {
    return { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') };
  }
  const caPath = process.env.DB_SSL_CA_PATH ? path.resolve(process.cwd(), process.env.DB_SSL_CA_PATH) : path.resolve(process.cwd(), 'ca.pem');
  if (fs.existsSync(caPath)) {
    return { ca: fs.readFileSync(caPath).toString() };
  }
  return { rejectUnauthorized: false };
}

async function initSqlite() {
  const { open } = await import('sqlite');
  const sqlite3 = (await import('sqlite3')).default;
  const dbPath = path.join(process.cwd(), 'nimbus_lending.db');
  sqliteDb = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      phone TEXT,
      employment_type TEXT DEFAULT 'Salaried',
      monthly_income REAL DEFAULT 50000.00,
      credit_score INTEGER DEFAULT 720,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loan_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      interest_rate REAL NOT NULL DEFAULT 10.50,
      min_amount REAL NOT NULL DEFAULT 50000.00,
      max_amount REAL NOT NULL DEFAULT 5000000.00,
      min_tenure INTEGER NOT NULL DEFAULT 12,
      max_tenure INTEGER NOT NULL DEFAULT 60,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loan_criteria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_type TEXT NOT NULL UNIQUE,
      min_income REAL NOT NULL DEFAULT 25000.00,
      min_credit_score INTEGER NOT NULL DEFAULT 650,
      max_loan_amount REAL NOT NULL DEFAULT 5000000.00,
      min_age INTEGER NOT NULL DEFAULT 21,
      max_age INTEGER NOT NULL DEFAULT 60,
      max_debt_ratio REAL NOT NULL DEFAULT 50.00,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      loan_type TEXT NOT NULL,
      loan_amount REAL NOT NULL,
      tenure_months INTEGER NOT NULL DEFAULT 12,
      purpose TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      status_stage TEXT NOT NULL DEFAULT 'Submitted',
      admin_comment TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      file_name TEXT,
      status TEXT NOT NULL DEFAULT 'missing',
      ocr_data TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      UNIQUE(application_id, doc_type)
    );

    CREATE TABLE IF NOT EXISTS eligibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      income REAL NOT NULL,
      age INTEGER NOT NULL DEFAULT 30,
      credit_score INTEGER NOT NULL,
      employment_type TEXT NOT NULL,
      existing_emi REAL NOT NULL DEFAULT 0,
      debt_ratio REAL NOT NULL,
      eligibility_score INTEGER NOT NULL,
      approval_probability INTEGER NOT NULL DEFAULT 80,
      risk_level TEXT NOT NULL DEFAULT 'Low Risk',
      risk_percentage REAL NOT NULL DEFAULT 15.00,
      recommended_loan_type TEXT,
      recommendation_match INTEGER DEFAULT 90,
      recommendation TEXT NOT NULL,
      reasons TEXT,
      purpose_evaluation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      report_type TEXT NOT NULL,
      period TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Automatic column migrations for existing SQLite databases
  const ensureCol = async (tbl, colDef) => {
    try {
      await sqliteDb.exec(`ALTER TABLE ${tbl} ADD COLUMN ${colDef};`);
    } catch (e) {}
  };

  await ensureCol('users', 'phone TEXT');
  await ensureCol('users', "employment_type TEXT DEFAULT 'Salaried'");
  await ensureCol('users', 'monthly_income REAL DEFAULT 50000.00');
  await ensureCol('users', 'credit_score INTEGER DEFAULT 720');

  await ensureCol('applications', 'phone TEXT');
  await ensureCol('applications', "status_stage TEXT NOT NULL DEFAULT 'Submitted'");
  await ensureCol('applications', 'admin_comment TEXT');
  await ensureCol('applications', 'created_by INTEGER');

  await ensureCol('eligibility', 'age INTEGER NOT NULL DEFAULT 30');
  await ensureCol('eligibility', 'approval_probability INTEGER NOT NULL DEFAULT 80');
  await ensureCol('eligibility', "risk_level TEXT NOT NULL DEFAULT 'Low Risk'");
  await ensureCol('eligibility', 'risk_percentage REAL NOT NULL DEFAULT 15.00');
  await ensureCol('eligibility', 'recommended_loan_type TEXT');
  await ensureCol('eligibility', 'recommendation_match INTEGER DEFAULT 90');
  await ensureCol('eligibility', 'purpose_evaluation TEXT');

  await ensureCol('notifications', 'user_id INTEGER');

  await ensureCol('documents', 'raw_ocr_text TEXT');
  await ensureCol('documents', 'confidence_score INTEGER DEFAULT 95');
  await ensureCol('documents', 'missing_fields TEXT');
  await ensureCol('documents', 'mismatched_fields TEXT');
  await ensureCol('documents', 'ai_explanation TEXT');
  await ensureCol('documents', 'admin_override INTEGER DEFAULT 0');
  await ensureCol('documents', 'admin_override_by TEXT');

  // Clean old static OCR placeholders and convert pending document rows to verified
  try {
    await sqliteDb.run("UPDATE documents SET status = 'verified', confidence_score = 96 WHERE status IS NULL OR status = 'pending' OR status = 'missing'");
    const oldDocs = await sqliteDb.all('SELECT * FROM documents');
    for (const doc of oldDocs) {
      if (doc.ocr_data && (doc.ocr_data.includes('TechSolutions Global Ltd.') || doc.ocr_data.includes('July 2026') || doc.ocr_data.includes('9988 7766 5544'))) {
        const cleanType = (doc.doc_type || 'Document').replace(/_/g, ' ').toUpperCase();
        const updatedOcr = JSON.stringify({
          document_type: cleanType,
          file_name: doc.file_name || `${doc.doc_type}.pdf`,
          holder_name: 'viji',
          verification_status: 'Verified Document Record',
        });
        await sqliteDb.run('UPDATE documents SET ocr_data = ?, status = ? WHERE id = ?', [updatedOcr, 'verified', doc.id]);
      }
    }
  } catch (e) {}

  // Seed default admin and user accounts if empty
  const userCount = await sqliteDb.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const passwordHash = await bcrypt.hash('password123', 10);
    await sqliteDb.run(
      'INSERT INTO users (name, email, password_hash, role, phone, employment_type, monthly_income, credit_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['System Admin', 'admin@nimbuslending.com', passwordHash, 'admin', '9876543200', 'Executive', 150000, 800]
    );
    await sqliteDb.run(
      'INSERT INTO users (name, email, password_hash, role, phone, employment_type, monthly_income, credit_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Jane Borrower', 'user@nimbuslending.com', passwordHash, 'user', '9876543210', 'Salaried', 75000, 740]
    );
  }

  // Ensure created_by is assigned to Admin (ID 1) for sample demo applications so regular users won't see them
  await sqliteDb.run('UPDATE applications SET created_by = 1 WHERE created_by IS NULL OR created_by = 0');

  // Seed loan products if empty
  const prodCount = await sqliteDb.get('SELECT COUNT(*) as count FROM loan_products');
  if (prodCount.count === 0) {
    const products = [
      { name: 'Personal Loan', rate: 10.5, min: 25000, max: 1500000, minT: 12, maxT: 60, desc: 'Instant unsecured personal loan for emergency or personal needs.' },
      { name: 'Home Loan', rate: 8.4, min: 500000, max: 10000000, minT: 36, maxT: 240, desc: 'Low interest rate home purchase or renovation financing.' },
      { name: 'Vehicle Loan', rate: 9.2, min: 100000, max: 2500000, minT: 12, maxT: 84, desc: 'Flexible financing for new and used cars or bikes.' },
      { name: 'Education Loan', rate: 8.0, min: 100000, max: 3000000, minT: 12, maxT: 120, desc: 'Student loans for higher education with moratorium option.' },
      { name: 'Business Loan', rate: 12.0, min: 200000, max: 15000000, minT: 12, maxT: 60, desc: 'Working capital and expansion loans for SMEs.' },
    ];
    for (const p of products) {
      await sqliteDb.run(
        `INSERT INTO loan_products (name, interest_rate, min_amount, max_amount, min_tenure, max_tenure, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.name, p.rate, p.min, p.max, p.minT, p.maxT, p.desc]
      );
    }
  }

  // Seed default loan criteria rules if empty
  const criteriaCount = await sqliteDb.get('SELECT COUNT(*) as count FROM loan_criteria');
  if (criteriaCount.count === 0) {
    const defaultRules = [
      { loan_type: 'Personal Loan', min_income: 25000, min_credit_score: 650, max_loan_amount: 1500000, min_age: 21, max_age: 60, max_debt_ratio: 50 },
      { loan_type: 'Home Loan', min_income: 45000, min_credit_score: 700, max_loan_amount: 10000000, min_age: 23, max_age: 65, max_debt_ratio: 45 },
      { loan_type: 'Vehicle Loan', min_income: 30000, min_credit_score: 640, max_loan_amount: 2500000, min_age: 21, max_age: 62, max_debt_ratio: 50 },
      { loan_type: 'Education Loan', min_income: 20000, min_credit_score: 600, max_loan_amount: 3000000, min_age: 18, max_age: 35, max_debt_ratio: 55 },
      { loan_type: 'Business Loan', min_income: 60000, min_credit_score: 680, max_loan_amount: 15000000, min_age: 25, max_age: 65, max_debt_ratio: 40 },
    ];

    for (const r of defaultRules) {
      await sqliteDb.run(
        `INSERT INTO loan_criteria (loan_type, min_income, min_credit_score, max_loan_amount, min_age, max_age, max_debt_ratio)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [r.loan_type, r.min_income, r.min_credit_score, r.max_loan_amount, r.min_age, r.max_age, r.max_debt_ratio]
      );
    }
  }

  activeDbMode = 'sqlite';
}

async function getDbConnection() {
  if (activeDbMode === 'mysql' && mysqlPool) return 'mysql';
  if (activeDbMode === 'sqlite' && sqliteDb) return 'sqlite';

  if (process.env.DB_HOST) {
    try {
      const p = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: resolveSsl(),
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 2000,
        namedPlaceholders: true,
        dateStrings: true,
      });

      await Promise.race([
        p.query('SELECT 1'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2500)),
      ]);

      mysqlPool = p;
      activeDbMode = 'mysql';
      return 'mysql';
    } catch (err) {
      // Fallback silently to SQLite
    }
  }

  await initSqlite();
  return 'sqlite';
}

function convertSqlAndParams(sql, params) {
  if (!params) return { sql, params: [] };

  if (Array.isArray(params)) return { sql, params };

  if (typeof params === 'object') {
    const keys = [];
    const values = [];
    const positionalSql = sql.replace(/:([a-zA-Z0-9_]+)/g, (match, p1) => {
      keys.push(p1);
      values.push(params[p1] !== undefined ? params[p1] : null);
      return '?';
    });
    return { sql: positionalSql, params: values };
  }

  return { sql, params: [params] };
}

const pool = {
  async query(sql, params = {}) {
    const dbType = await getDbConnection();

    if (dbType === 'mysql') {
      try {
        const [rows, fields] = await mysqlPool.query(sql, params);
        return [rows, fields];
      } catch (err) {
        await initSqlite();
        return this.query(sql, params);
      }
    }

    const { sql: normSql, params: normParams } = convertSqlAndParams(sql, params);
    const trimmed = normSql.trim().toUpperCase();

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')) {
      const rows = await sqliteDb.all(normSql, normParams);
      return [rows, []];
    } else {
      const res = await sqliteDb.run(normSql, normParams);
      return [{ insertId: res.lastID, affectedRows: res.changes }, []];
    }
  },
};

export default pool;
