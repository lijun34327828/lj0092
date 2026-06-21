import express from 'express';
import cors from 'cors';
import bookingsRouter from './routes/bookings';
import configRouter from './routes/config';

const app = express();
const PORT = 8872;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'venue-booking-backend', port: PORT });
});

app.use('/api/bookings', bookingsRouter);
app.use('/api/config', configRouter);

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
  console.log(`API base: http://localhost:${PORT}/api`);
});

export default app;
