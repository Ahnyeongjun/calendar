import { pool } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, AuthResult, JwtPayload } from '../types';
import dotenv from 'dotenv';

dotenv.config();

class UserModel {
  static async findByUsername(username: string): Promise<User | null> {
    let conn;
    try {
      conn = await pool.getConnection();
      const users = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
      
      if (users.length === 0) {
        return null;
      }
      
      return users[0] as User;
    } catch (error) {
      console.error('User.findByUsername error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async findById(id: string): Promise<Omit<User, 'password'> | null> {
    let conn;
    try {
      conn = await pool.getConnection();
      const users = await conn.query('SELECT id, username, name, created_at, updated_at FROM users WHERE id = ?', [id]);
      
      if (users.length === 0) {
        return null;
      }
      
      return users[0] as Omit<User, 'password'>;
    } catch (error) {
      console.error('User.findById error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<Omit<User, 'password'>> {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 비밀번호 해시화
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password!, saltRounds);
      
      // 새 ID 생성
      const id = Date.now().toString();
      
      await conn.query(
        'INSERT INTO users (id, username, password, name) VALUES (?, ?, ?, ?)',
        [id, userData.username, hashedPassword, userData.name]
      );
      
      // 민감한 정보 제외하고 반환
      return {
        id,
        username: userData.username,
        name: userData.name
      };
    } catch (error) {
      console.error('User.create error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async authenticate(username: string, password: string): Promise<AuthResult | null> {
    const user = await this.findByUsername(username);
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // JWT 토큰 생성
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    
    // 데이터 및 타입 명시적 지정
    const payload: JwtPayload = { 
      id: user.id, 
      username: user.username, 
      name: user.name 
    };
    
    // 구체적인 문자열 값을 사용하여 타입 문제 해결
    const token = jwt.sign(
      payload,
      jwtSecret as jwt.Secret,
      { expiresIn: '7d' }
    );
    
    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      },
      token
    };
  }
}

export default UserModel;