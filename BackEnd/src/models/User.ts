import { prisma } from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthResult, JwtPayload } from '../types';
import dotenv from 'dotenv';
import { User } from '@prisma/client';

dotenv.config();

class UserModel {
  static async findByUsername(username: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { username }
      });
    } catch (error) {
      console.error('User.findByUsername error:', error);
      throw error;
    }
  }
  
  static async findById(id: string): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return user;
    } catch (error) {
      console.error('User.findById error:', error);
      throw error;
    }
  }
  
  static async create(userData: Pick<User, 'username' | 'password' | 'name'>): Promise<Omit<User, 'password'>> {
    try {
      // 비밀번호 해시화
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      // 새 사용자 생성
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          name: userData.name
        },
        select: {
          id: true,
          username: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return user;
    } catch (error) {
      console.error('User.create error:', error);
      throw error;
    }
  }
  
  static async authenticate(username: string, password: string): Promise<AuthResult | null> {
    const user = await this.findByUsername(username);
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
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
    
    // 토큰 생성
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