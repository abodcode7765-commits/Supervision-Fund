import {
  Expense,
  FundSettings,
  Group,
  MarriageAid,
  Member,
  MemberStatus,
  MemberYearSubscription,
  PageId,
  PaymentMethod,
  PaymentRecord,
  Qitta,
  ReportFilterDTO,
  SystemUser,
  UserRole,
  YearConfig,
} from '../types';

export interface LoginCredentialsDTO {
  username: string;
  password: string;
}

export interface AuthSessionDTO {
  user: SystemUser;
  accessToken: string;
  expiresAt: string;
  isMockSession: boolean;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateMemberDTO {
  name: string;
  nationalId: string;
  birthDate: string;
  groupId: string;
}

export interface UpdateMemberDTO {
  id: string;
  name: string;
  nationalId: string;
  birthDate: string;
  groupId: string;
  memberStatus?: MemberStatus;
}

export interface CreateGroupDTO {
  name: string;
  leaderId: string;
  leaderUserId?: string;
  description: string;
}

export interface CreatePaymentDTO {
  memberId: string;
  year: number;
  monthsLabel: string;
  allocatedToFounding?: number;
  allocatedMonthIndices?: number[];
  dueAmount: number;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes: string;
}

export interface UpdatePaymentDTO extends CreatePaymentDTO {
  id: string;
}

export interface CreateExpenseDTO {
  year: number;
  title: string;
  reason: string;
  category: Expense['category'];
  amount: number;
  date: string;
  notes: string;
}

export interface UpdateExpenseDTO extends CreateExpenseDTO {
  id: string;
}

export interface CreateQittaDTO {
  name: string;
  reason: string;
  description: string;
  totalAmount: number;
  distributionMode: 'equal' | 'custom';
  participants: { memberId: string; shareAmount: number }[];
}

export interface CreateUserDTO {
  name: string;
  username: string;
  password: string;
  role: UserRole;
  groupId?: string;
  permissions: PageId[];
}

export interface UpdateUserDTO {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  groupId?: string;
  permissions: PageId[];
  status: 'نشط' | 'معطل';
}

export interface AuthServiceContract {
  login(credentials: LoginCredentialsDTO): Promise<AuthSessionDTO>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<SystemUser | null>;
  changePassword(dto: ChangePasswordDTO): Promise<{ success: boolean; message: string; isMock: boolean }>;
}

export interface MembersServiceContract {
  list(params?: { groupId?: string; search?: string; status?: string }): Promise<Member[]>;
  getById(id: string): Promise<Member | null>;
  create(dto: CreateMemberDTO): Promise<Member>;
  update(dto: UpdateMemberDTO): Promise<Member>;
  toggleArchive(id: string): Promise<Member>;
}

export interface GroupsServiceContract {
  list(): Promise<Group[]>;
  create(dto: CreateGroupDTO): Promise<Group>;
  update(group: Group): Promise<Group>;
  changeLeader(groupId: string, leaderMemberId: string, leaderUserId?: string): Promise<Group>;
  assignMember(memberId: string, groupId: string): Promise<void>;
}

export interface SubscriptionsServiceContract {
  listYearConfigs(): Promise<YearConfig[]>;
  createYearConfig(cfg: YearConfig): Promise<YearConfig>;
  updateYearConfig(cfg: YearConfig): Promise<YearConfig>;
  listSubscriptions(year?: number): Promise<MemberYearSubscription[]>;
}

export interface PaymentsServiceContract {
  list(params?: { year?: number | 'all'; memberId?: string; status?: string }): Promise<PaymentRecord[]>;
  create(dto: CreatePaymentDTO): Promise<PaymentRecord>;
  update(dto: UpdatePaymentDTO): Promise<PaymentRecord>;
}

export interface OverdueServiceContract {
  list(params?: { year?: number | 'all'; groupId?: string; status?: string }): Promise<
    {
      member: Member;
      year: number;
      totalDue: number;
      totalPaid: number;
      remaining: number;
      overdueMonths: string[];
    }[]
  >;
}

export interface ExpensesServiceContract {
  list(params?: { year?: number | 'all'; fromDate?: string; toDate?: string }): Promise<Expense[]>;
  create(dto: CreateExpenseDTO): Promise<Expense>;
  update(dto: UpdateExpenseDTO): Promise<Expense>;
}

export interface QittatServiceContract {
  list(): Promise<Qitta[]>;
  create(dto: CreateQittaDTO): Promise<Qitta>;
  recordPayment(qittaId: string, memberId: string, amount: number): Promise<Qitta>;
}

export interface MarriageAidServiceContract {
  list(): Promise<MarriageAid[]>;
  create(aid: Omit<MarriageAid, 'id'>): Promise<MarriageAid>;
  disburse(aidId: string, disbursementDate: string): Promise<MarriageAid>;
}

export interface ReportsServiceContract {
  generateReport(filters: ReportFilterDTO): Promise<unknown>;
  exportPdf(filters: ReportFilterDTO): Promise<Blob>;
  exportExcel(filters: ReportFilterDTO): Promise<Blob>;
}

export interface UsersServiceContract {
  list(): Promise<SystemUser[]>;
  create(dto: CreateUserDTO): Promise<SystemUser>;
  update(dto: UpdateUserDTO): Promise<SystemUser>;
  toggleStatus(userId: string): Promise<SystemUser>;
}

export interface SettingsServiceContract {
  get(): Promise<FundSettings>;
  save(settings: FundSettings): Promise<FundSettings>;
}

/**
 * Default Demo/Mock Auth adapter used until Backend REST/Auth endpoints are connected.
 * Uses strict username lookup against current in-memory users and explicit password validation.
 */
export function authenticateMockUser(
  users: SystemUser[],
  credentials: LoginCredentialsDTO
): { ok: true; session: AuthSessionDTO } | { ok: false; error: string } {
  const trimmedUser = credentials.username.trim();
  const trimmedPass = credentials.password.trim();

  if (!trimmedUser || !trimmedPass) {
    return { ok: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور للدخول إلى النظام.' };
  }

  if (trimmedPass.length < 6) {
    return {
      ok: false,
      error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف. كلمة المرور التجريبية الافتراضية هي: ishraf2026',
    };
  }

  const matchedUser = users.find(
    (u) => u.username.toLowerCase() === trimmedUser.toLowerCase()
  );
  if (!matchedUser) {
    return {
      ok: false,
      error: 'اسم المستخدم غير مسجل في النظام. يرجى التحقق والمحاولة مرة أخرى.',
    };
  }

  if (trimmedPass !== 'ishraf2026') {
    return {
      ok: false,
      error: 'كلمة المرور غير صحيحة. (في وضع المعاينة التجريبي كلمة المرور الموحدة: ishraf2026)',
    };
  }

  if (matchedUser.status === 'معطل') {
    return { ok: false, error: 'هذا الحساب معطّل حالياً. يرجى التواصل مع مدير الصندوق.' };
  }

  return {
    ok: true,
    session: {
      user: matchedUser,
      accessToken: `mock-session-${matchedUser.id}`,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      isMockSession: true,
    },
  };
}
