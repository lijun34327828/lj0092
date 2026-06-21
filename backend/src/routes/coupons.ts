import { Router, Request, Response } from 'express';
import {
  createCoupon,
  getCouponById,
  getAllCoupons,
  getCouponsByMember,
  getAvailableCoupons,
  isCouponApplicable,
  recycleCoupons,
  markExpiredCoupons,
} from '../services/couponService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { memberId, status } = req.query;
    let coupons = getAllCoupons();
    if (memberId) {
      coupons = getCouponsByMember(memberId as string);
    }
    if (status) {
      coupons = coupons.filter((c) => c.status === status);
    }
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/member/:memberId/available', (req: Request, res: Response) => {
  try {
    const coupons = getAvailableCoupons(req.params.memberId);
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const coupon = getCouponById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: '优惠券不存在' });
    }
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const {
      name,
      type,
      value,
      minConsumption,
      validFrom,
      validTo,
      applicableZoneIds,
      applicableTimePeriods,
      memberId,
    } = req.body;
    if (!name || !type || value === undefined || minConsumption === undefined || !validFrom || !validTo) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const coupon = createCoupon({
      name,
      type,
      value: Number(value),
      minConsumption: Number(minConsumption),
      validFrom,
      validTo,
      applicableZoneIds,
      applicableTimePeriods,
      memberId,
    });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:id/check-applicable', (req: Request, res: Response) => {
  try {
    const { zoneId, date, startTime, endTime, currentAmountAfterMemberDiscount, memberId } = req.body;
    if (!zoneId || !date || !startTime || !endTime || currentAmountAfterMemberDiscount === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const applicable = isCouponApplicable(req.params.id, {
      zoneId,
      date,
      startTime,
      endTime,
      currentAmountAfterMemberDiscount: Number(currentAmountAfterMemberDiscount),
      memberId,
    });
    res.json({ applicable });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/batch/recycle', (req: Request, res: Response) => {
  try {
    const { couponIds } = req.body;
    if (!couponIds || !Array.isArray(couponIds)) {
      return res.status(400).json({ error: '缺少必要参数：couponIds' });
    }
    const coupons = recycleCoupons(couponIds);
    res.json(coupons);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/mark-expired', (_req: Request, res: Response) => {
  try {
    const coupons = markExpiredCoupons();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
