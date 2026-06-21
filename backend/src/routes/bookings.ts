import { Router, Request, Response } from 'express';
import {
  isZoneAvailable,
  findAvailableZones,
  createBooking,
  getBookingById,
  getBookingsByDate,
  getAllBookings,
  cancelBooking,
  calculateRefund,
  getZoneBookings,
} from '../services/bookingService';
import { calculateTotalPrice } from '../services/pricingService';

const router = Router();

router.get('/availability/check', (req: Request, res: Response) => {
  try {
    const { zoneId, date, startTime, endTime } = req.query;
    
    if (!zoneId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const available = isZoneAvailable(
      zoneId as string,
      date as string,
      startTime as string,
      endTime as string
    );

    const availableZones = findAvailableZones(
      date as string,
      startTime as string,
      endTime as string
    );

    res.json({
      available,
      availableZones,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/availability/zones', (req: Request, res: Response) => {
  try {
    const { date, startTime, endTime } = req.query;
    
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const availableZones = findAvailableZones(
      date as string,
      startTime as string,
      endTime as string
    );

    res.json({ availableZones });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/calculate-price', (req: Request, res: Response) => {
  try {
    const { zoneId, date, startTime, endTime, peopleCount, equipment } = req.body;

    if (!zoneId || !date || !startTime || !endTime || !peopleCount) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const priceResult = calculateTotalPrice({
      zoneId,
      date,
      startTime,
      endTime,
      peopleCount,
      equipment: equipment || [],
    });

    res.json(priceResult);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { zoneId, userName, phone, date, startTime, endTime, peopleCount, equipment } = req.body;

    if (!zoneId || !userName || !phone || !date || !startTime || !endTime || !peopleCount) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const booking = createBooking({
      zoneId,
      userName,
      phone,
      date,
      startTime,
      endTime,
      peopleCount,
      equipment: equipment || [],
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const booking = getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: '预约不存在' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    let bookings;
    if (date) {
      bookings = getBookingsByDate(date as string);
    } else {
      bookings = getAllBookings();
    }
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/cancel', (req: Request, res: Response) => {
  try {
    const result = cancelBooking(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/:id/refund', (req: Request, res: Response) => {
  try {
    const refundInfo = calculateRefund(req.params.id);
    res.json(refundInfo);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/zone/:zoneId/:date', (req: Request, res: Response) => {
  try {
    const bookings = getZoneBookings(req.params.zoneId, req.params.date);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
