import type {
  Profile,
  Merchant,
  Contact,
  Transaction,
  SupportTicket,
  Activity,
  Task,
  UserRole,
  ActivityType,
  TicketStatus,
  TicketPriority,
} from '@/types/database'

// Counter for generating unique IDs
let idCounter = 0
const generateId = () => `test-id-${++idCounter}`

export const resetIdCounter = () => {
  idCounter = 0
}

// Profile Factory
export const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: generateId(),
  email: `user-${idCounter}@test.com`,
  full_name: `Test User ${idCounter}`,
  role: 'support' as UserRole,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createAdminProfile = (overrides: Partial<Profile> = {}): Profile =>
  createProfile({ role: 'admin', ...overrides })

export const createSalesProfile = (overrides: Partial<Profile> = {}): Profile =>
  createProfile({ role: 'sales', ...overrides })

export const createSupportProfile = (overrides: Partial<Profile> = {}): Profile =>
  createProfile({ role: 'support', ...overrides })

export const createOpsProfile = (overrides: Partial<Profile> = {}): Profile =>
  createProfile({ role: 'ops', ...overrides })

// Merchant Factory
export const createMerchant = (overrides: Partial<Merchant> = {}): Merchant => ({
  id: generateId(),
  name: `Test Merchant ${idCounter}`,
  legal_name: `Test Merchant ${idCounter} LLC`,
  status: 'active',
  mcc_code: '5411',
  metadata: null,
  assigned_sales_rep: null,
  assigned_support_rep: null,
  onboarded_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createActiveMerchant = (overrides: Partial<Merchant> = {}): Merchant =>
  createMerchant({ status: 'active', ...overrides })

export const createSuspendedMerchant = (overrides: Partial<Merchant> = {}): Merchant =>
  createMerchant({ status: 'suspended', ...overrides })

export const createOnboardingMerchant = (overrides: Partial<Merchant> = {}): Merchant =>
  createMerchant({ status: 'onboarding', ...overrides })

// Contact Factory
export const createContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: generateId(),
  merchant_id: generateId(),
  name: `Test Contact ${idCounter}`,
  email: `contact-${idCounter}@test.com`,
  phone: '+1-555-0100',
  role: 'Owner',
  is_primary: false,
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createPrimaryContact = (overrides: Partial<Contact> = {}): Contact =>
  createContact({ is_primary: true, ...overrides })

// Transaction Factory
export const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: generateId(),
  merchant_id: generateId(),
  amount_cents: 10000,
  currency: 'USD',
  status: 'completed',
  type: 'sale',
  card_brand: 'visa',
  last_four: '4242',
  processed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createCompletedTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  createTransaction({ status: 'completed', ...overrides })

export const createFailedTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  createTransaction({ status: 'failed', ...overrides })

// Support Ticket Factory
export const createSupportTicket = (overrides: Partial<SupportTicket> = {}): SupportTicket => ({
  id: generateId(),
  merchant_id: generateId(),
  subject: `Test Ticket ${idCounter}`,
  description: `Description for ticket ${idCounter}`,
  status: 'open' as TicketStatus,
  priority: 'medium' as TicketPriority,
  category: 'technical',
  assigned_to: null,
  created_by: generateId(),
  resolved_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createOpenTicket = (overrides: Partial<SupportTicket> = {}): SupportTicket =>
  createSupportTicket({ status: 'open', ...overrides })

export const createUrgentTicket = (overrides: Partial<SupportTicket> = {}): SupportTicket =>
  createSupportTicket({ priority: 'urgent', ...overrides })

export const createResolvedTicket = (overrides: Partial<SupportTicket> = {}): SupportTicket =>
  createSupportTicket({ status: 'resolved', resolved_at: new Date().toISOString(), ...overrides })

// Activity Factory
export const createActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: generateId(),
  merchant_id: generateId(),
  type: 'note' as ActivityType,
  content: `Activity content ${idCounter}`,
  ticket_id: null,
  created_by: generateId(),
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createNoteActivity = (overrides: Partial<Activity> = {}): Activity =>
  createActivity({ type: 'note', ...overrides })

export const createCallActivity = (overrides: Partial<Activity> = {}): Activity =>
  createActivity({ type: 'call', ...overrides })

export const createEmailActivity = (overrides: Partial<Activity> = {}): Activity =>
  createActivity({ type: 'email', ...overrides })

// Task Factory
export const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: generateId(),
  merchant_id: generateId(),
  title: `Test Task ${idCounter}`,
  description: `Task description ${idCounter}`,
  assigned_to: generateId(),
  created_by: generateId(),
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  completed_at: null,
  ticket_id: null,
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createCompletedTask = (overrides: Partial<Task> = {}): Task =>
  createTask({ completed_at: new Date().toISOString(), ...overrides })

export const createOverdueTask = (overrides: Partial<Task> = {}): Task =>
  createTask({
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ...overrides,
  })

// Batch creators for generating multiple items
export const createMerchants = (count: number, overrides: Partial<Merchant> = {}): Merchant[] =>
  Array.from({ length: count }, () => createMerchant(overrides))

export const createContacts = (count: number, overrides: Partial<Contact> = {}): Contact[] =>
  Array.from({ length: count }, () => createContact(overrides))

export const createTransactions = (count: number, overrides: Partial<Transaction> = {}): Transaction[] =>
  Array.from({ length: count }, () => createTransaction(overrides))

export const createTickets = (count: number, overrides: Partial<SupportTicket> = {}): SupportTicket[] =>
  Array.from({ length: count }, () => createSupportTicket(overrides))

export const createActivities = (count: number, overrides: Partial<Activity> = {}): Activity[] =>
  Array.from({ length: count }, () => createActivity(overrides))

export const createTasks = (count: number, overrides: Partial<Task> = {}): Task[] =>
  Array.from({ length: count }, () => createTask(overrides))
