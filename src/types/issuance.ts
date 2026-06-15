export interface MedicineItem {
  name: string;
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  minimum_stock: number;
  dosage: string;
}

export interface IssuanceFormData {
  name: string;
  email: string;
  age: string;
  gender: string;
  department: string;
  chiefComplaints: string;
}

export interface MedicineOption {
  id: string;
  medicine_name: string;
  current_stock: number;
  minimum_stock: number;
  category: string;
  [key: string]: unknown;
}

export interface IssuanceDbRow {
  id: string | number;
  name: string;
  email: string;
  age: number;
  gender: string;
  department: string;
  chief_complaints: string;
  medicine_taken: MedicineItem[];
  date: string;
  time: string;
  created_at: string;
}

export interface IssuanceRecord {
  id: string | number;
  name: string;
  email: string;
  age: number;
  gender: string;
  department: string;
  chiefComplaints: string;
  medicineTaken: MedicineItem[];
  createdAt: string;
  date: string;
  time: string;
}

export interface EmployeeDbRow {
  id: string | number;
  full_name: string;
  email: string;
  department: string;
  employee_id: string;
  status: string;
  team?: string;
  created_at: string;
}

export interface EmployeeRecord {
  id: string | number;
  fullName: string;
  email: string;
  department: string;
  employeeId: string;
  status: string;
  team?: string;
  createdAt: string;
}

export interface AdminDbRow {
  id: string | number;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  added_at: string;
  is_protected?: boolean;
}

export interface AdminRecord {
  id: string | number;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  addedAt: string;
  isProtected?: boolean;
}

export interface InventoryDbRow {
  id: string | number;
  medicine_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  dosage: string;
  expiration_date: string | null;
  quality: string;
  remarks: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export type InventoryImportRow = Omit<InventoryDbRow, "id">;

export interface InventoryItem {
  id: string | number;
  medicine_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  dosage: string;
  expiration_date: string | null;
  quality: string;
  remarks: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryFormData {
  medicine_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  dosage: string;
  expiration_date: string;
  quality: string;
  remarks: string;
  description: string;
}
