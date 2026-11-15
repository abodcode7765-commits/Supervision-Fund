export type PageId =
  | 'dashboard'
  | 'members'
  | 'groups'
  | 'subscriptions'
  | 'payments'
  | 'overdue'
  | 'qittat'
  | 'marriage-aid'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'settings';

export type SubscriptionStatus = 'مسدد' | 'متأخر' | 'مسدد جزئياً';
export type MonthCellStatus = 'paid' | 'overdue' | 'partial' | 'upcoming';

export interface Member {
  id: string;
  serial: number;
  name: string;
  nationalId: string;
  birthDate: string;
  groupId: string;
  groupName: string;
  joinDate: string;
  memberStatus: 'نشط' | 'موقوف';
  subscriptionStatus: SubscriptionStatus;
  phone: string;
}

export interface Group {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  description: string;
  createdAt: string;
  baseMemberCount: number;
}

export interface YearConfig {
  year: number;
  foundingFee: number;
  monthlyFee: number;
  monthsCount: number;
}

export interface MemberYearSubscription {
  memberId: string;
  year: number;
  foundingStatus: 'paid' | 'overdue' | 'partial';
  foundingPaidAmount: number;
  months: MonthCellStatus[]; // 12 items: Jan -> Dec
}

export type PaymentMethod = 'تحويل بنكي' | 'نقدي' | 'شيك';
export type PaymentStatus = 'مكتمل' | 'مدفوع جزئياً';

export interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  nationalId: string;
  groupName: string;
  year: number;
  monthsLabel: string;
  dueAmount: number;
  amount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  date: string;
  status: PaymentStatus;
  notes: string;
}

export type QittaParticipantStatus = 'سدد كامل المبلغ' | 'دفع جزئياً' | 'لم يدفع';

export interface QittaParticipant {
  memberId: string;
  memberName: string;
  shareAmount: number;
  paidAmount: number;
  status: QittaParticipantStatus;
}

export interface Qitta {
  id: string;
  name: string;
  reason: string;
  description: string;
  createdAt: string;
  totalAmount: number;
  status: 'مكتملة' | 'قيد التحصيل' | 'جديدة';
  participants: QittaParticipant[];
}

export type MarriageAidStatus = 'مستحقة' | 'تم الصرف' | 'قيد الانتظار';

export interface MarriageAid {
  id: string;
  memberId: string;
  memberName: string;
  nationalId: string;
  birthDate: string;
  amount: number;
  dueDate: string;
  disbursementDate: string;
  status: MarriageAidStatus;
  notes: string;
}

export type ExpenseCategory =
  | 'ضيافة ومناسبات'
  | 'مساعدات عاجلة'
  | 'تشغيل وإدارة'
  | 'صيانة ومرافق'
  | 'دعم أسري';

export interface Expense {
  id: string;
  operationNumber: string;
  title: string;
  reason: string;
  category: ExpenseCategory;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  date: string;
  recordedBy: string;
  notes: string;
}

export type UserRole = 'مدير الصندوق' | 'رئيس المجموعة' | 'مسؤول القطات';

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  groupId?: string;
  groupName: string;
  permissions: PageId[];
  status: 'نشط' | 'معطل';
  createdAt: string;
}

export interface FundSettings {
  fundName: string;
  subName: string;
  currency: string;
  city: string;
  notifyOnPayment: boolean;
  notifyOnOverdue: boolean;
  notifyOnMarriageAid: boolean;
  monthlyReminderDay: number;
  compactTables: boolean;
}
