import { Router, Request, Response } from 'express';
import {
  getAllZones,
  updateZone,
  addZone,
  deleteZone,
  getAllTimeSlots,
  getAllTimePricingRules,
  addTimePricingRule,
  updateTimePricingRule,
  deleteTimePricingRule,
  getAllGroupDiscountTiers,
  addGroupDiscountTier,
  updateGroupDiscountTier,
  deleteGroupDiscountTier,
  getAllEquipment,
  addEquipment,
  updateEquipment,
  deleteEquipment,
  getRefundRules,
  addRefundRule,
  updateRefundRule,
  deleteRefundRule,
  getTemporaryServiceFeeRule,
  updateTemporaryServiceFeeRule,
} from '../services/configService';

const router = Router();

router.get('/zones', (_req: Request, res: Response) => {
  try {
    const zones = getAllZones();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/zones', (req: Request, res: Response) => {
  try {
    const zone = addZone(req.body);
    res.status(201).json(zone);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/zones/:id', (req: Request, res: Response) => {
  try {
    const zone = updateZone(req.params.id, req.body);
    if (!zone) {
      return res.status(404).json({ error: '场地不存在' });
    }
    res.json(zone);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/zones/:id', (req: Request, res: Response) => {
  try {
    const success = deleteZone(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '场地不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/time-slots', (_req: Request, res: Response) => {
  try {
    const timeSlots = getAllTimeSlots();
    res.json(timeSlots);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/pricing-rules', (_req: Request, res: Response) => {
  try {
    const rules = getAllTimePricingRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/pricing-rules', (req: Request, res: Response) => {
  try {
    const rule = addTimePricingRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/pricing-rules/:id', (req: Request, res: Response) => {
  try {
    const rule = updateTimePricingRule(req.params.id, req.body);
    if (!rule) {
      return res.status(404).json({ error: '定价规则不存在' });
    }
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/pricing-rules/:id', (req: Request, res: Response) => {
  try {
    const success = deleteTimePricingRule(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '定价规则不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/discount-tiers', (_req: Request, res: Response) => {
  try {
    const tiers = getAllGroupDiscountTiers();
    res.json(tiers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/discount-tiers', (req: Request, res: Response) => {
  try {
    const tier = addGroupDiscountTier(req.body);
    res.status(201).json(tier);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/discount-tiers/:id', (req: Request, res: Response) => {
  try {
    const tier = updateGroupDiscountTier(req.params.id, req.body);
    if (!tier) {
      return res.status(404).json({ error: '折扣档位不存在' });
    }
    res.json(tier);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/discount-tiers/:id', (req: Request, res: Response) => {
  try {
    const success = deleteGroupDiscountTier(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '折扣档位不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/equipment', (_req: Request, res: Response) => {
  try {
    const equipment = getAllEquipment();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/equipment', (req: Request, res: Response) => {
  try {
    const equipment = addEquipment(req.body);
    res.status(201).json(equipment);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/equipment/:id', (req: Request, res: Response) => {
  try {
    const equipment = updateEquipment(req.params.id, req.body);
    if (!equipment) {
      return res.status(404).json({ error: '装备不存在' });
    }
    res.json(equipment);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/equipment/:id', (req: Request, res: Response) => {
  try {
    const success = deleteEquipment(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '装备不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/refund-rules', (_req: Request, res: Response) => {
  try {
    const rules = getRefundRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/refund-rules', (req: Request, res: Response) => {
  try {
    const rule = addRefundRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/refund-rules/:id', (req: Request, res: Response) => {
  try {
    const rule = updateRefundRule(req.params.id, req.body);
    if (!rule) {
      return res.status(404).json({ error: '退款规则不存在' });
    }
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/refund-rules/:id', (req: Request, res: Response) => {
  try {
    const success = deleteRefundRule(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '退款规则不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/temporary-service-fee', (_req: Request, res: Response) => {
  try {
    const rule = getTemporaryServiceFeeRule();
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/temporary-service-fee', (req: Request, res: Response) => {
  try {
    const rule = updateTemporaryServiceFeeRule(req.body);
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
