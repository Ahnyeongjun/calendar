import { Request, Response } from 'express';
import UserModel from '../models/User';

const authController = {
  // 로그인
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.status(400).json({ message: '사용자명과 비밀번호를 모두 입력해주세요.' });
        return;
      }
      
      const authResult = await UserModel.authenticate(username, password);
      
      if (!authResult) {
        res.status(401).json({ message: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
        return;
      }
      
      res.status(200).json(authResult);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  // 사용자 정보 조회
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }
      
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        return;
      }
      
      res.status(200).json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

export default authController;