import { pool } from '../config/db';
import { Schedule } from '../types';

interface ScheduleFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: 'planned' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  projectId?: string;
}

class ScheduleModel {
  static async findAll(filters: ScheduleFilters = {}): Promise<Schedule[]> {
    let conn;
    try {
      conn = await pool.getConnection();
      
      let query = 'SELECT * FROM schedules WHERE 1=1';
      const params: any[] = [];
      
      // 날짜 필터링
      if (filters.date) {
        query += ' AND date = ?';
        params.push(filters.date);
      }
      
      // 상태 필터링
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      // 우선순위 필터링
      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }
      
      // 프로젝트 필터링
      if (filters.projectId) {
        query += ' AND project_id = ?';
        params.push(filters.projectId);
      }
      
      // 시작 날짜와 종료 날짜 범위 필터링
      if (filters.startDate && filters.endDate) {
        query += ' AND date BETWEEN ? AND ?';
        params.push(filters.startDate, filters.endDate);
      }
      
      // 정렬
      query += ' ORDER BY date ASC, start_time ASC';
      
      const schedules = await conn.query(query, params);
      
      // 날짜 객체 변환
      return schedules.map((schedule: any) => ({
        ...schedule,
        date: new Date(schedule.date)
      }));
    } catch (error) {
      console.error('Schedule.findAll error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async findById(id: string): Promise<Schedule | null> {
    let conn;
    try {
      conn = await pool.getConnection();
      const schedules = await conn.query('SELECT * FROM schedules WHERE id = ?', [id]);
      
      if (schedules.length === 0) {
        return null;
      }
      
      const schedule = schedules[0];
      
      // 날짜 객체 변환
      return {
        ...schedule,
        date: new Date(schedule.date)
      };
    } catch (error) {
      console.error('Schedule.findById error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async create(scheduleData: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // ID 생성
      const id = Date.now().toString();
      
      await conn.query(
        `INSERT INTO schedules 
         (id, title, description, date, start_time, end_time, status, priority, project_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          scheduleData.title, 
          scheduleData.description || null, 
          scheduleData.date, 
          scheduleData.start_time || null, 
          scheduleData.end_time || null, 
          scheduleData.status, 
          scheduleData.priority, 
          scheduleData.project_id || null
        ]
      );
      
      return {
        id,
        ...scheduleData
      };
    } catch (error) {
      console.error('Schedule.create error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async update(id: string, scheduleData: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule | null> {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 일정 존재 확인
      const existingSchedule = await this.findById(id);
      if (!existingSchedule) {
        return null;
      }
      
      // 업데이트 쿼리 실행
      await conn.query(
        `UPDATE schedules 
         SET title = ?, description = ?, date = ?, start_time = ?, end_time = ?, 
         status = ?, priority = ?, project_id = ? 
         WHERE id = ?`,
        [
          scheduleData.title, 
          scheduleData.description || null, 
          scheduleData.date, 
          scheduleData.start_time || null, 
          scheduleData.end_time || null, 
          scheduleData.status, 
          scheduleData.priority, 
          scheduleData.project_id || null,
          id
        ]
      );
      
      return {
        id,
        ...scheduleData
      };
    } catch (error) {
      console.error('Schedule.update error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async delete(id: string): Promise<boolean> {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 일정 존재 확인
      const existingSchedule = await this.findById(id);
      if (!existingSchedule) {
        return false;
      }
      
      // 삭제 쿼리 실행
      await conn.query('DELETE FROM schedules WHERE id = ?', [id]);
      
      return true;
    } catch (error) {
      console.error('Schedule.delete error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

export default ScheduleModel;