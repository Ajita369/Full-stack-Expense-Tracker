import cors from 'cors';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import expenseRoutes from './routes/expenses.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/expenses', expenseRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
