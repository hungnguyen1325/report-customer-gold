export interface Account {
  id: number;
  username: string;
  full_name?: string;
  role: 'admin' | 'user';
  active: boolean;
  create_at: string;
  update_at: string;
  tables?: number[]; // list of allowed data_table ids
  table_names?: string[]; // list of allowed table names
}

export interface DataTableInfo {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  create_at: string;
  update_at: string;
  total_records?: number;
  physical_exists?: boolean;
}

export interface TransactionRecord {
  stt_rec: string;
  stt_rec0: string;
  FK_CtID: string;
  FK_DoitacID?: string;
  DoiTacName?: string;
  DoiTacTel?: string;
  DoiTacAdd?: string;
  DoiTacCCCD?: string;
  Ngay_ct?: string;
  datetime0?: string;
  So_ct?: string;
  KieuCt?: string;
  KhoName?: string;
  maQuay?: string;
  code?: string;
  FK_VtID?: string;
  FK_DvtID?: string;
  VtName?: string;
  Hlg_au?: number;
  Hlg_auK?: string;
  Tlg_au?: number;
  Tong_tlg?: number;
  Tien_cong?: number;
  Tien_da?: number;
  gia_au?: number;
  tien?: number;
  so_luong?: number;
  FK_TkID?: string;
  TkName?: string;
  Dien_giai?: string;
  BpkdName?: string;
  dateEdit?: string;
  dateEdit2?: string;
  dateEdit3?: string;
  status?: string;
  user_id0?: string;
  user_id2?: string;
}

export interface TransactionSummaryStats {
  totalCount: number;
  totalTien: number;
  totalTongTlg: number;
  totalTlgAu: number;
  totalTienCong: number;
  totalTienDa: number;
}

export interface UserSession {
  id: number;
  username: string;
  full_name?: string;
  role: 'admin' | 'user';
  allowedTables: number[];
}
