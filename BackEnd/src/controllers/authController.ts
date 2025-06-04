import { Request, Response } from 'express';
import UserModel from '../models/User';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
  };
}

const authController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.status(400).json({ message: '사용자명과 비밀번호를 입력해주세요.' });
        return;
      }
      
      const authResult = await UserModel.authenticate(username, password);
      
      if (!authResult) {
        res.status(401).json({ message: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
        return;
      }
      
      res.json(authResult);
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }
      
      const user = await UserModel.findById(req.user.id);
      
      if (!user) {
        res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        return;
      }
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

export default authController;
