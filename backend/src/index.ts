import 'dotenv/config';
import app from './app.js';
import { config } from './config.js';
import { closeDb } from './db/connection.js';
import { runMigrations } from './db/migrations.js';
import { expenseService } from './services/expenseService.js';

runMigrations();
expenseService.cleanupExpiredIdempotencyKeys(24);

const cleanupInterval = setInterval(() => {
  expenseService.cleanupExpiredIdempotencyKeys(24);
}, 60 * 60 * 1000);

cleanupInterval.unref();

const server = app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}. Shutting down...`);
  clearInterval(cleanupInterval);
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
