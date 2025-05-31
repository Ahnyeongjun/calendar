import mariadb from 'mariadb';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// 데이터베이스가 없을 때 사용할 풀 (데이터베이스 없이 연결)
const rootPool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: 5
});

// 데이터베이스와 함께 사용할 주 풀
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

// 데이터베이스 연결 테스트 및 생성
async function testConnection(): Promise<boolean> {
  let rootConn;
  let conn;
  
  try {
    // 1. 먼저 기본 연결 테스트
    rootConn = await rootPool.getConnection();
    console.log('MariaDB server connection established successfully');
    
    // 2. 데이터베이스 존재 여부 확인
    const dbName = process.env.DB_NAME || 'calender';
    const databases = await rootConn.query('SHOW DATABASES LIKE ?', [dbName]);
    
    // 3. 데이터베이스가 없으면 생성
    if (databases.length === 0) {
      console.log(`Database '${dbName}' does not exist. Creating it...`);
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`Database '${dbName}' created successfully`);
    } else {
      console.log(`Database '${dbName}' already exists`);
    }
    
    // 4. 데이터베이스 연결 테스트
    conn = await pool.getConnection();
    console.log(`Connected to database '${dbName}' successfully`);
    return true;
  } catch (err) {
    console.error('Database connection/creation failed:', err);
    return false;
  } finally {
    if (rootConn) rootConn.release();
    if (conn) conn.release();
  }
}

// 데이터베이스 초기화 함수
async function initDatabase(): Promise<void> {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 테이블 생성 (없을 경우)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        status ENUM('planned', 'in-progress', 'completed') NOT NULL,
        priority ENUM('low', 'medium', 'high') NOT NULL,
        project_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      )
    `);
    
    // 기본 사용자 데이터 생성
    const saltRounds = 10;
    
    // 관리자 계정
    const adminPassword = await bcrypt.hash('1234', saltRounds);
    const admin2Password = await bcrypt.hash('1234', saltRounds);
    
    // 기존 사용자 확인
    const existingAdmin = await conn.query('SELECT * FROM users WHERE username = ?', ['admin']);
    const existingAdmin2 = await conn.query('SELECT * FROM users WHERE username = ?', ['admin2']);
    
    if (existingAdmin.length === 0) {
      await conn.query(`
        INSERT INTO users (id, username, password, name) 
        VALUES ('1', 'admin', ?, '관리자')
      `, [adminPassword]);
    }
    
    if (existingAdmin2.length === 0) {
      await conn.query(`
        INSERT INTO users (id, username, password, name) 
        VALUES ('2', 'admin2', ?, '관리자2')
      `, [admin2Password]);
    }
    
    // 기본 프로젝트 데이터 생성
    const defaultProjects = [
      {
        id: 'personal',
        name: '개인',
        description: '개인적인 일정 및 할일',
        color: '#10b981'
      },
      {
        id: 'work',
        name: '업무',
        description: '회사 업무 관련',
        color: '#3b82f6'
      },
      {
        id: 'study',
        name: '학습',
        description: '공부 및 자기계발',
        color: '#8b5cf6'
      }
    ];
    
    for (const project of defaultProjects) {
      const existingProject = await conn.query('SELECT * FROM projects WHERE id = ?', [project.id]);
      
      if (existingProject.length === 0) {
        await conn.query(`
          INSERT INTO projects (id, name, description, color) 
          VALUES (?, ?, ?, ?)
        `, [project.id, project.name, project.description, project.color]);
      }
    }
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

export {
  pool,
  rootPool,
  testConnection,
  initDatabase
};