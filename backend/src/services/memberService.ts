import { members, memberLevelRules, walletTransactions, bookings } from '../data/store';
import { Member, MemberLevel, MemberLevelRule, WalletTransaction, WalletTransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getLevelRuleByTotalSpent(totalSpent: number): MemberLevelRule {
  const sortedRules = [...memberLevelRules].sort((a, b) => b.minTotalSpent - a.minTotalSpent);
  for (const rule of sortedRules) {
    if (totalSpent >= rule.minTotalSpent) {
      return rule;
    }
  }
  return sortedRules[sortedRules.length - 1];
}

export function calculateLevel(totalSpent: number): MemberLevel {
  return getLevelRuleByTotalSpent(totalSpent).level;
}

export function getLevelRule(level: MemberLevel): MemberLevelRule | undefined {
  return memberLevelRules.find((r) => r.level === level);
}

export function getAllLevelRules(): MemberLevelRule[] {
  return [...memberLevelRules];
}

export function createMember(name: string, phone: string): Member {
  if (!name || !name.trim()) {
    throw new Error('会员姓名不能为空');
  }
  if (!phone || !phone.trim()) {
    throw new Error('手机号码不能为空');
  }
  const existing = members.find((m) => m.phone === phone.trim());
  if (existing) {
    throw new Error('该手机号码已注册会员');
  }

  const now = new Date().toISOString();
  const member: Member = {
    id: uuidv4(),
    name: name.trim(),
    phone: phone.trim(),
    level: 'regular',
    totalSpent: 0,
    balance: 0,
    createdAt: now,
    updatedAt: now,
  };
  members.push(member);
  return member;
}

export function getMemberById(id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

export function getMemberByPhone(phone: string): Member | undefined {
  return members.find((m) => m.phone === phone);
}

export function getAllMembers(): Member[] {
  return [...members];
}

export function updateMember(id: string, updates: Partial<Pick<Member, 'name' | 'phone'>>): Member {
  const member = getMemberById(id);
  if (!member) {
    throw new Error('会员不存在');
  }
  if (updates.name !== undefined) {
    if (!updates.name.trim()) {
      throw new Error('会员姓名不能为空');
    }
    member.name = updates.name.trim();
  }
  if (updates.phone !== undefined) {
    if (!updates.phone.trim()) {
      throw new Error('手机号码不能为空');
    }
    const existing = members.find((m) => m.phone === updates.phone!.trim() && m.id !== id);
    if (existing) {
      throw new Error('该手机号码已被其他会员使用');
    }
    member.phone = updates.phone.trim();
  }
  member.updatedAt = new Date().toISOString();
  return member;
}

function addWalletTransaction(
  memberId: string,
  type: WalletTransactionType,
  amount: number,
  balanceAfter: number,
  relatedBookingId?: string,
  remark?: string
): WalletTransaction {
  const tx: WalletTransaction = {
    id: uuidv4(),
    memberId,
    type,
    amount: roundToCents(amount),
    balanceAfter: roundToCents(balanceAfter),
    relatedBookingId,
    remark: remark || '',
    createdAt: new Date().toISOString(),
  };
  walletTransactions.push(tx);
  return tx;
}

export function rechargeBalance(memberId: string, amount: number, remark?: string): Member {
  const member = getMemberById(memberId);
  if (!member) {
    throw new Error('会员不存在');
  }
  if (!amount || isNaN(amount)) {
    throw new Error('储值金额无效');
  }
  const roundedAmount = roundToCents(amount);
  if (roundedAmount <= 0) {
    throw new Error('储值金额必须为正数');
  }

  const newBalance = roundToCents(member.balance + roundedAmount);
  member.balance = newBalance;
  member.updatedAt = new Date().toISOString();

  addWalletTransaction(memberId, 'recharge', roundedAmount, newBalance, undefined, remark || '会员储值');

  return member;
}

export function deductBalance(
  memberId: string,
  amount: number,
  bookingId?: string,
  remark?: string
): Member {
  const member = getMemberById(memberId);
  if (!member) {
    throw new Error('会员不存在');
  }
  if (!amount || isNaN(amount)) {
    throw new Error('扣款金额无效');
  }
  const roundedAmount = roundToCents(amount);
  if (roundedAmount <= 0) {
    throw new Error('扣款金额必须为正数');
  }
  if (member.balance < roundedAmount) {
    throw new Error(`余额不足，当前余额：${member.balance.toFixed(2)}元`);
  }

  const newBalance = roundToCents(member.balance - roundedAmount);
  const newTotalSpent = roundToCents(member.totalSpent + roundedAmount);

  member.balance = newBalance;
  member.totalSpent = newTotalSpent;

  const newLevel = calculateLevel(newTotalSpent);
  if (newLevel !== member.level) {
    member.level = newLevel;
  }

  member.updatedAt = new Date().toISOString();

  addWalletTransaction(memberId, 'payment', roundedAmount, newBalance, bookingId, remark || '余额支付');

  return member;
}

export function refundToBalance(
  memberId: string,
  amount: number,
  bookingId?: string,
  remark?: string
): Member {
  const member = getMemberById(memberId);
  if (!member) {
    throw new Error('会员不存在');
  }
  if (!amount || isNaN(amount)) {
    throw new Error('退款金额无效');
  }
  const roundedAmount = roundToCents(amount);
  if (roundedAmount <= 0) {
    throw new Error('退款金额必须为正数');
  }

  const newBalance = roundToCents(member.balance + roundedAmount);
  member.balance = newBalance;
  member.updatedAt = new Date().toISOString();

  addWalletTransaction(memberId, 'refund', roundedAmount, newBalance, bookingId, remark || '退款回冲');

  return member;
}

export function getWalletTransactions(memberId: string, limit?: number): WalletTransaction[] {
  let txs = walletTransactions
    .filter((t) => t.memberId === memberId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (limit && limit > 0) {
    txs = txs.slice(0, limit);
  }
  return [...txs];
}

export function verifyBalanceConsistency(memberId: string): true {
  const member = getMemberById(memberId);
  if (!member) {
    throw new Error('会员不存在');
  }

  const txs = walletTransactions.filter((t) => t.memberId === memberId);
  let calculatedBalance = 0;

  for (const tx of txs) {
    switch (tx.type) {
      case 'recharge':
      case 'refund':
        calculatedBalance += tx.amount;
        break;
      case 'payment':
        calculatedBalance -= tx.amount;
        break;
      case 'adjust':
        calculatedBalance += tx.amount;
        break;
    }
  }

  calculatedBalance = roundToCents(calculatedBalance);
  const currentBalance = roundToCents(member.balance);

  if (Math.abs(calculatedBalance - currentBalance) > 0.001) {
    throw new Error(
      `余额一致性校验失败：流水累加=${calculatedBalance.toFixed(2)}，当前余额=${currentBalance.toFixed(2)}`
    );
  }

  return true;
}

export function addMemberSpending(memberId: string, amount: number): Member {
  const member = getMemberById(memberId);
  if (!member) {
    throw new Error('会员不存在');
  }
  if (!amount || isNaN(amount)) {
    throw new Error('消费金额无效');
  }
  const roundedAmount = roundToCents(amount);
  if (roundedAmount <= 0) {
    throw new Error('消费金额必须为正数');
  }

  const newTotalSpent = roundToCents(member.totalSpent + roundedAmount);
  member.totalSpent = newTotalSpent;

  const newLevel = calculateLevel(newTotalSpent);
  if (newLevel !== member.level) {
    member.level = newLevel;
  }

  member.updatedAt = new Date().toISOString();

  return member;
}
