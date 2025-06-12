interface HttpMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
}

interface SystemMetrics {
  memory: NodeJS.MemoryUsage;
  uptime: number;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: number;
}

export class MetricsCollector {
  private httpMetrics: HttpMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private startTime: number;
  private cpuStartUsage: NodeJS.CpuUsage;

  constructor() {
    this.startTime = Date.now();
    this.cpuStartUsage = process.cpuUsage();
    
    // 주기적으로 시스템 메트릭스 수집
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // 30초마다
    
    // 메트릭스 정리 (메모리 누수 방지)
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // 5분마다
  }

  /**
   * HTTP 요청 메트릭스 기록
   */
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void {
    this.httpMetrics.push({
      method,
      path: this.normalizePath(path),
      statusCode,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * 경로 정규화 (파라미터 제거)
   */
  private normalizePath(path: string): string {
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUID
      .replace(/\/\d+/g, '/:id') // 숫자 ID
      .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token'); // 긴 토큰
  }

  /**
   * 시스템 메트릭스 수집
   */
  private collectSystemMetrics(): void {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage(this.cpuStartUsage);

    this.systemMetrics.push({
      memory,
      uptime,
      cpuUsage,
      timestamp: Date.now()
    });
  }

  /**
   * 오래된 메트릭스 정리 (1시간 이상)
   */
  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.httpMetrics = this.httpMetrics.filter(metric => metric.timestamp > oneHourAgo);
    this.systemMetrics = this.systemMetrics.filter(metric => metric.timestamp > oneHourAgo);
  }

  /**
   * HTTP 메트릭스 통계 계산
   */
  getMetrics(): {
    totalRequests: number;
    totalDuration: number;
    averageDuration: number;
    statusCodes: Record<string, number>;
    methods: Record<string, number>;
    paths: Record<string, number>;
    errorRate: number;
    requestsPerMinute: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    const recentMetrics = this.httpMetrics.filter(m => m.timestamp > oneMinuteAgo);
    
    const totalRequests = this.httpMetrics.length;
    const totalDuration = this.httpMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalRequests > 0 ? totalDuration / totalRequests : 0;
    
    const statusCodes: Record<string, number> = {};
    const methods: Record<string, number> = {};
    const paths: Record<string, number> = {};
    let errorCount = 0;

    this.httpMetrics.forEach(metric => {
      // Status codes
      const statusGroup = `${Math.floor(metric.statusCode / 100)}xx`;
      statusCodes[statusGroup] = (statusCodes[statusGroup] || 0) + 1;
      
      // Methods
      methods[metric.method] = (methods[metric.method] || 0) + 1;
      
      // Paths
      paths[metric.path] = (paths[metric.path] || 0) + 1;
      
      // Error count (4xx and 5xx)
      if (metric.statusCode >= 400) {
        errorCount++;
      }
    });

    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    const requestsPerMinute = recentMetrics.length;

    return {
      totalRequests,
      totalDuration,
      averageDuration,
      statusCodes,
      methods,
      paths,
      errorRate,
      requestsPerMinute
    };
  }

  /**
   * 시스템 메트릭스 가져오기
   */
  getSystemMetrics(): {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      user: number;
      system: number;
      percentage: number;
    };
    uptime: number;
    loadAverage?: number[];
  } {
    const latest = this.systemMetrics[this.systemMetrics.length - 1];
    const memoryUsage = process.memoryUsage();
    
    let cpuPercentage = 0;
    if (latest) {
      const totalCpuTime = latest.cpuUsage.user + latest.cpuUsage.system;
      const elapsedTime = (process.uptime() - latest.uptime) * 1000000; // 마이크로초
      cpuPercentage = totalCpuTime / elapsedTime * 100;
    }

    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      cpu: {
        user: latest?.cpuUsage.user || 0,
        system: latest?.cpuUsage.system || 0,
        percentage: Math.min(cpuPercentage, 100)
      },
      uptime: process.uptime(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : undefined
    };
  }

  /**
   * 백분위수 계산
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }
}
