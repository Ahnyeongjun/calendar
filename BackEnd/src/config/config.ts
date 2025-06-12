import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  url: string;
}

type Unit =
  | "Years"
  | "Year"
  | "Yrs"
  | "Yr"
  | "Y"
  | "Weeks"
  | "Week"
  | "W"
  | "Days"
  | "Day"
  | "D"
  | "Hours"
  | "Hour"
  | "Hrs"
  | "Hr"
  | "H"
  | "Minutes"
  | "Minute"
  | "Mins"
  | "Min"
  | "M"
  | "Seconds"
  | "Second"
  | "Secs"
  | "Sec"
  | "s"
  | "Milliseconds"
  | "Millisecond"
  | "Msecs"
  | "Msec"
  | "Ms";

type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;

type StringValue =
  | `${number}`
  | `${number}${UnitAnyCase}`
  | `${number} ${UnitAnyCase}`;  // JWT 라이브러리가 허용하는 타입으로 확장

interface JwtConfig {
  secret: string;
  expiresIn: StringValue | number;
}


interface KafkaConfig {
  enabled: boolean;
  brokers: string;
}

interface ServerConfig {
  port: number;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

class Config {
  private static instance: Config;

  readonly server: ServerConfig;
  readonly database: DatabaseConfig;
  readonly jwt: JwtConfig;
  readonly kafka: KafkaConfig;

  private constructor() {
    this.server = {
      port: parseInt(process.env.PORT || '3001', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };

    this.database = {
      url: this.getRequiredEnv('DATABASE_URL')
    };

    this.jwt = {
      secret: this.getRequiredEnv('JWT_SECRET'),
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as StringValue
    };

    this.kafka = {
      enabled: process.env.KAFKA_ENABLED === 'true',
      brokers: process.env.KAFKA_BROKERS || 'localhost:9092'
    };
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  // 환경 검증
  validate(): void {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // 포트 번호 검증
    if (this.server.port < 1 || this.server.port > 65535) {
      throw new Error('PORT must be between 1 and 65535');
    }

    // JWT 시크릿 강도 검증 (프로덕션에서)
    if (this.server.isProduction && this.jwt.secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
  }

  // 설정 요약 출력 (민감한 정보 제외)
  getSummary(): object {
    return {
      server: {
        port: this.server.port,
        nodeEnv: this.server.nodeEnv
      },
      database: {
        url: this.database.url.replace(/\/\/.*@/, '//***:***@') // 비밀번호 마스킹
      },
      jwt: {
        expiresIn: this.jwt.expiresIn
      },
      kafka: {
        enabled: this.kafka.enabled,
        brokers: this.kafka.brokers
      }
    };
  }
}

export const config = Config.getInstance();
