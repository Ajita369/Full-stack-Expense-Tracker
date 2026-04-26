import 'dotenv/config';
import app from './app.js';
import { config } from './config.js';
import { runMigrations } from './db/migrations.js';

runMigrations();

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});
