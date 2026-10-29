import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "./entity/User";
import { Url } from "./entity/Url";
import { Visit } from "./entity/Visit";
import { Session } from "./entity/Session";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
  databaseUrl && databaseUrl.startsWith("postgres")
    ? {
        type: "postgres",
        url: databaseUrl,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        synchronize: true,
        logging: false,
        entities: [User, Url, Visit, Session],
      }
    : {
        type: "postgres",
        host: process.env.DB_HOST || process.env.DATABASE_URL || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "123",
        database: process.env.DB_NAME || "url_shortener",
        synchronize: true,
        logging: false,
        entities: [User, Url, Visit, Session],
      }
);
