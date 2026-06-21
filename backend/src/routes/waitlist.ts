import { Router, Request, Response } from 'express';
import {
  addToWaitlist,
  getWaitlistEntryById,
  getAllWaitlistEntries,
  getWaitlistByMember,
  getWaitlistByZoneDateTime,
  cancelWaitlistEntry,
  processWaitlistForSlot,
} from '../services/waitlistService';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const {
      zoneId,
      memberId,
      userName,
      phone,
      date,
      startTime,
      endTime,
      peopleCount,
      equipment,
      selectedCouponIds,
    } = req.body;
    if (!zoneId || !userName || !phone || !date || !startTime || !endTime || !peopleCount) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const entry = addToWaitlist({
      zoneId,
      memberId,
      userName,
      phone,
      date,
      startTime,
      endTime,
      peopleCount: Number(peopleCount),
      equipment: equipment || [],
      selectedCouponIds,
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const { zoneId, date, startTime, endTime, memberId } = req.query;
    let entries = getAllWaitlistEntries();
    if (zoneId) {
      entries = entries.filter((e) => e.zoneId === zoneId);
    }
    if (date) {
      entries = entries.filter((e) => e.date === date);
    }
    if (startTime) {
      entries = entries.filter((e) => e.startTime === startTime);
    }
    if (endTime) {
      entries = entries.filter((e) => e.endTime === endTime);
    }
    if (memberId) {
      entries = getWaitlistByMember(memberId as string);
    }
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const entry = getWaitlistEntryById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: '候补记录不存在' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/cancel', (req: Request, res: Response) => {
  try {
    const entry = cancelWaitlistEntry(req.params.id);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/zone/:zoneId/:date/:startTime/:endTime', (req: Request, res: Response) => {
  try {
    const { zoneId, date, startTime, endTime } = req.params;
    const entries = getWaitlistByZoneDateTime(zoneId, date, startTime, endTime);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/process-slot', (req: Request, res: Response) => {
  try {
    const { zoneId, date, startTime, endTime } = req.body;
    if (!zoneId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const result = processWaitlistForSlot(zoneId, date, startTime, endTime);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
