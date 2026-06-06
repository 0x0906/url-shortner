import dotenv from 'dotenv';
dotenv.config();

import app from './src/app';
import prisma from './src/config/db';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the PostgreSQL database.');
    
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database. Exiting...', error);
    process.exit(1);
  }
}

bootstrap();

process.on('unhandledRejection', (err: any) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
