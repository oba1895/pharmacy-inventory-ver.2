export interface User {
  id: number
  username: string
  role: 'admin' | 'viewer'
  displayName: string
}

export interface Medicine {
  id: number
  name: string
  current_stock: number
  unit: string
  updated_at: string
}

export interface Supplier {
  id: number
  name: string
}

export interface Pharmacist {
  id: number
  name: string
}

export interface Ward {
  id: number
  name: string
}

export interface Transaction {
  id: number
  medicine_id: number
  medicine_name: string
  transaction_type: '入庫' | '出庫'
  quantity: number
  patient_name: string | null
  date: string
  supplier_id: number | null
  supplier_name: string | null
  pharmacist_id: number
  pharmacist_name: string
  ward_id: number | null
  ward_name: string | null
  notes: string | null
  expiry_date: string | null
  created_at: string
}
