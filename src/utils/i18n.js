'use strict';

const translations = {
  id: {
    // Navbar
    nav_packing_lists: 'Daftar Packing',
    nav_instant: 'Cetak Instan',
    nav_users: 'Pengguna',
    nav_logout: 'Keluar',
    badge_admin: 'Admin',

    // Login
    login_welcome: 'Selamat datang kembali',
    login_subtitle: 'Masukkan nama Checker dan password untuk melanjutkan',
    login_email: 'Nama Checker',
    login_password: 'Kata Sandi',
    login_btn: 'Masuk',
    login_btn_loading: 'Memproses masuk...',

    // Packing Lists Index
    pl_title: 'Daftar Packing',
    pl_subtitle: 'Unggah dan cetak label dari berkas Excel daftar packing',
    pl_upload_new: 'Unggah Baru',
    pl_no_lists: 'Belum ada daftar packing',
    pl_no_lists_desc: 'Unggah daftar packing Excel pertama Anda untuk memulai',
    pl_btn_upload: 'Unggah Daftar Packing',
    pl_total_lists: 'Total Daftar',
    pl_total_items: 'Total Barang',
    pl_total_prints: 'Total Cetak',
    pl_all_lists: 'Semua Daftar Packing',
    pl_files: 'berkas',
    pl_col_filename: 'Nama Berkas',
    pl_col_items: 'Barang',
    pl_col_prints: 'Cetak',
    pl_col_uploaded_by: 'Pengunggah',
    pl_col_uploaded_at: 'Diunggah Pada',
    pl_col_actions: 'Aksi',
    pl_action_view: 'Lihat',
    pl_action_print: 'Cetak',
    pl_status_not_printed: 'Belum dicetak',
    pl_status_prints: 'kali cetak',
    pl_status_items: 'barang',
    pl_modal_title: 'Cetak Label',
    pl_modal_cust_name: 'Nama Customer',
    pl_modal_cust_desc: 'Nama customer akan muncul di setiap label yang dicetak.',
    pl_modal_btn_cancel: 'Batal',
    pl_modal_btn_submit: 'Buat & Cetak',
    pl_modal_btn_loading: 'Memproses...',
    pl_modal_reset_box: 'Reset Nomor Boks per NO DO',
    pl_modal_reset_box_desc: 'Nomor boks akan di-reset kembali dari 1 untuk setiap NO DO yang baru.',

    // Upload Packing List
    up_title: 'Unggah Daftar Packing',
    up_subtitle: 'Unggah berkas Excel (.xlsx) yang memiliki sheet bernama PACKINGLIST',
    up_drop_title: 'Letakkan berkas Excel Anda di sini',
    up_drop_subtitle: 'atau klik untuk mencari berkas',
    up_drop_limits: '.xlsx, .xls — maks 10MB',
    up_requirements: 'Persyaratan Berkas',
    up_req_sheet: 'Harus memiliki sheet bernama %s',
    up_req_cols: 'Kolom wajib: %s',
    up_req_merged: 'Cell gabungan (merged) didukung dan akan dinormalisasi secara otomatis',
    up_req_ranges: 'Rentang NO BOX seperti 1-3 akan menghasilkan label boks terpisah',
    up_btn_cancel: 'Batal',
    up_btn_upload: 'Unggah & Urai',
    up_btn_loading: 'Mengurai...',
    
    // Instant Print
    inst_title: 'Cetak Label Instan',
    inst_subtitle: 'Urai berkas Excel secara langsung dan cetak label tanpa menyimpan ke database',
    inst_btn_print: 'Cetak Instan',
    inst_btn_loading: 'Mengurai & Mencetak...',

    // Detail Packing List
    dl_uploaded_by: 'Diunggah oleh %s pada %s',
    dl_btn_print: 'Cetak Label',
    dl_btn_delete: 'Hapus',
    dl_confirm_delete: 'Hapus daftar packing ini?',
    dl_items_title: 'Barang Daftar Packing',
    dl_col_code: 'Kode',
    dl_col_desc: 'Deskripsi',
    dl_col_qty: 'Jumlah',
    dl_col_nodo: 'NO DO',
    dl_col_nobox: 'NO BOX',
    dl_col_qtybox: 'Qty/Boks',
    dl_col_dims: 'P×L×T (cm)',
    dl_col_weight: 'Berat (kg)',
    dl_history_title: 'Riwayat Cetak',
    dl_hist_col_cust: 'Nama Customer',
    dl_hist_col_checker: 'Pemeriksa',
    dl_hist_col_date: 'Dicetak Pada',
    dl_hist_col_reprint: 'Cetak Ulang',

    // Users List
    usr_title: 'Manajemen Pengguna',
    usr_subtitle: 'Kelola siapa saja yang dapat mengakses PrintLabel',
    usr_btn_add: 'Tambah Pengguna',
    usr_all_users: 'Semua Pengguna',
    usr_users_count: 'pengguna',
    usr_col_name: 'Nama',
    usr_col_email: 'Email',
    usr_col_role: 'Peran',
    usr_col_joined: 'Bergabung',
    usr_col_actions: 'Aksi',
    usr_action_edit: 'Ubah',
    usr_action_delete: 'Hapus',
    usr_badge_admin: 'Admin',
    usr_badge_checker: 'Pemeriksa',
    usr_protected: 'Terlindungi',
    usr_confirm_delete: 'Hapus pengguna %s?',

    // User Form
    uf_edit_title: 'Ubah Pengguna',
    uf_add_title: 'Tambah Pengguna Baru',
    uf_edit_subtitle: 'Perbarui detail dan hak akses pengguna',
    uf_add_subtitle: 'Buat akun PrintLabel baru',
    uf_lbl_name: 'Nama Lengkap',
    uf_lbl_email: 'Alamat Email',
    uf_email_admin_warn: 'Email admin utama tidak dapat diubah.',
    uf_lbl_role: 'Peran',
    uf_role_checker_title: 'Pemeriksa (Checker)',
    uf_role_checker_desc: 'Dapat mengunggah & mencetak label',
    uf_role_admin_title: 'Admin',
    uf_role_admin_desc: 'Akses penuh + manajemen pengguna',
    uf_lbl_pw: 'Kata Sandi',
    uf_pw_edit_hint: '(kosong = tidak berubah)',
    uf_pw_edit_placeholder: 'Biarkan kosong jika tidak ingin diubah',
    uf_pw_add_placeholder: 'Minimal 6 karakter',
    uf_btn_cancel: 'Batal',
    uf_btn_save: 'Simpan Perubahan',
    uf_btn_create: 'Buat Pengguna'
  },
  en: {
    // Navbar
    nav_packing_lists: 'Packing Lists',
    nav_instant: 'Instant Print',
    nav_users: 'Users',
    nav_logout: 'Logout',
    badge_admin: 'Admin',

    // Login
    login_welcome: 'Welcome back',
    login_subtitle: 'Enter Checker name and password to continue',
    login_email: 'Checker Name',
    login_password: 'Password',
    login_btn: 'Sign In',
    login_btn_loading: 'Signing in...',

    // Packing Lists Index
    pl_title: 'Packing Lists',
    pl_subtitle: 'Upload and print labels from Excel packing list files',
    pl_upload_new: 'Upload New',
    pl_no_lists: 'No packing lists yet',
    pl_no_lists_desc: 'Upload your first Excel packing list to get started',
    pl_btn_upload: 'Upload Packing List',
    pl_total_lists: 'Total Lists',
    pl_total_items: 'Total Items',
    pl_total_prints: 'Total Prints',
    pl_all_lists: 'All Packing Lists',
    pl_files: 'files',
    pl_col_filename: 'Filename',
    pl_col_items: 'Items',
    pl_col_prints: 'Prints',
    pl_col_uploaded_by: 'Uploaded By',
    pl_col_uploaded_at: 'Uploaded At',
    pl_col_actions: 'Actions',
    pl_action_view: 'View',
    pl_action_print: 'Print',
    pl_status_not_printed: 'Not printed',
    pl_status_prints: 'prints',
    pl_status_items: 'items',
    pl_modal_title: 'Print Labels',
    pl_modal_cust_name: 'Customer Name',
    pl_modal_cust_desc: 'Customer name will appear on every printed label.',
    pl_modal_btn_cancel: 'Cancel',
    pl_modal_btn_submit: 'Generate & Print',
    pl_modal_btn_loading: 'Generating...',
    pl_modal_reset_box: 'Reset Box Number per NO DO',
    pl_modal_reset_box_desc: 'Box number will reset back to 1 for each new NO DO.',

    // Upload Packing List
    up_title: 'Upload Packing List',
    up_subtitle: 'Upload an Excel (.xlsx) file containing a sheet named PACKINGLIST',
    up_drop_title: 'Drop your Excel file here',
    up_drop_subtitle: 'or click to browse',
    up_drop_limits: '.xlsx, .xls — max 10MB',
    up_requirements: 'File Requirements',
    up_req_sheet: 'Must contain a sheet named %s',
    up_req_cols: 'Required columns: %s',
    up_req_merged: 'Merged cells are supported and will be normalized automatically',
    up_req_ranges: 'NO BOX ranges like 1-3 will generate separate box labels',
    up_btn_cancel: 'Cancel',
    up_btn_upload: 'Upload & Parse',
    up_btn_loading: 'Parsing...',
    
    // Instant Print
    inst_title: 'Instant Label Print',
    inst_subtitle: 'Parse Excel sheets in-memory and print labels without saving to the database',
    inst_btn_print: 'Print Instantly',
    inst_btn_loading: 'Parsing & Printing...',

    // Detail Packing List
    dl_uploaded_by: 'Uploaded by %s on %s',
    dl_btn_print: 'Print Labels',
    dl_btn_delete: 'Delete',
    dl_confirm_delete: 'Delete this packing list?',
    dl_items_title: 'Packing List Items',
    dl_col_code: 'Code',
    dl_col_desc: 'Description',
    dl_col_qty: 'QTY',
    dl_col_nodo: 'NO DO',
    dl_col_nobox: 'NO BOX',
    dl_col_qtybox: 'Qty/Box',
    dl_col_dims: 'L×W×H (cm)',
    dl_col_weight: 'Weight (kg)',
    dl_history_title: 'Print History',
    dl_hist_col_cust: 'Customer Name',
    dl_hist_col_checker: 'Checker',
    dl_hist_col_date: 'Printed At',
    dl_hist_col_reprint: 'Reprint',

    // Users List
    usr_title: 'User Management',
    usr_subtitle: 'Manage who can access PrintLabel',
    usr_btn_add: 'Add User',
    usr_all_users: 'All Users',
    usr_users_count: 'users',
    usr_col_name: 'Name',
    usr_col_email: 'Email',
    usr_col_role: 'Role',
    usr_col_joined: 'Joined',
    usr_col_actions: 'Actions',
    usr_action_edit: 'Edit',
    usr_action_delete: 'Delete',
    usr_badge_admin: 'Admin',
    usr_badge_checker: 'Checker',
    usr_protected: 'Protected',
    usr_confirm_delete: 'Delete user %s?',

    // User Form
    uf_edit_title: 'Edit User',
    uf_add_title: 'Add New User',
    uf_edit_subtitle: 'Update user details and permissions',
    uf_add_subtitle: 'Create a new PrintLabel account',
    uf_lbl_name: 'Full Name',
    uf_lbl_email: 'Email Address',
    uf_email_admin_warn: 'Primary admin email cannot be changed.',
    uf_lbl_role: 'Role',
    uf_role_checker_title: 'Checker',
    uf_role_checker_desc: 'Can upload & print labels',
    uf_role_admin_title: 'Admin',
    uf_role_admin_desc: 'Full access + user management',
    uf_lbl_pw: 'Password',
    uf_pw_edit_hint: '(blank = unchanged)',
    uf_pw_edit_placeholder: 'Leave blank to keep current',
    uf_pw_add_placeholder: 'Minimum 6 characters',
    uf_btn_cancel: 'Cancel',
    uf_btn_save: 'Save Changes',
    uf_btn_create: 'Create User'
  }
};

/**
 * Main translation function
 * @param {string} lang - Selected language ('id' | 'en')
 * @param {string} key - Translation key
 * @param {...any} args - Format arguments (for replacing %s)
 */
function translate(lang, key, ...args) {
  const currentLang = lang === 'en' ? 'en' : 'id';
  let text = translations[currentLang][key] || translations['id'][key] || key;

  if (args.length > 0) {
    args.forEach(arg => {
      text = text.replace('%s', arg);
    });
  }

  return text;
}

module.exports = { translate };
