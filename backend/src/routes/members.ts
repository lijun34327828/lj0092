import { Router, Request, Response } from 'express';
import {
  createMember,
  getMemberById,
  getMemberByPhone,
  getAllMembers,
  updateMember,
  rechargeBalance,
  getWalletTransactions,
  verifyBalanceConsistency,
  getAllLevelRules,
} from '../services/memberService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { phone } = req.query;
    if (phone) {
      const member = getMemberByPhone(phone as string);
      if (!member) {
        return res.status(404).json({ error: '会员不存在' });
      }
      return res.json(member);
    }
    const members = getAllMembers();
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/level-rules', (_req: Request, res: Response) => {
  try {
    const rules = getAllLevelRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const member = getMemberById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: '会员不存在' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const member = createMember(name, phone);
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const member = updateMember(req.params.id, req.body);
    res.json(member);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:id/recharge', (req: Request, res: Response) => {
  try {
    const { amount, remark } = req.body;
    if (!amount) {
      return res.status(400).json({ error: '缺少必要参数：amount' });
    }
    const member = rechargeBalance(req.params.id, Number(amount), remark);
    res.json(member);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/:id/transactions', (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? Number(limit) : undefined;
    const txs = getWalletTransactions(req.params.id, limitNum);
    res.json(txs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id/verify-consistency', (req: Request, res: Response) => {
  try {
    verifyBalanceConsistency(req.params.id);
    res.json({ consistent: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
