-- ============================================================
-- PrintLabel Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS print_label
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE print_label;

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default users (password: password123)
INSERT INTO users (email, name, role, password) VALUES
  ('admin@printlabel.com', 'Admin User', 'admin', '$2b$10$uTiAK7KrDevuwDxJeAVIzOzkOrYpFLA7I4Ir1btHGh/l2e1AjN1s2'),
  ('ari@printlabel.com', 'Ari Checker', 'checker', '$2b$10$uTiAK7KrDevuwDxJeAVIzOzkOrYpFLA7I4Ir1btHGh/l2e1AjN1s2');

-- ------------------------------------------------------------
-- Packing Lists (uploaded XLSX files)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packing_lists (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  uploaded_by   INT NOT NULL,
  uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Packing List Items (parsed rows from PACKINGLIST sheet)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packing_list_items (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  packing_list_id   INT NOT NULL,
  code              VARCHAR(100),
  description       TEXT,
  qty               INT            DEFAULT 0,
  no_do             VARCHAR(100)   DEFAULT NULL,
  no_box_raw        VARCHAR(50),
  qty_of_box        INT            DEFAULT 1,
  p_cm              DECIMAL(10,2)  DEFAULT 0,
  l_cm              DECIMAL(10,2)  DEFAULT 0,
  t_cm              DECIMAL(10,2)  DEFAULT 0,
  volume_m3         DECIMAL(10,4)  DEFAULT 0,
  weight_kg         DECIMAL(10,2)  DEFAULT 0,
  total_weight      DECIMAL(10,2)  DEFAULT 0,
  row_index         INT            DEFAULT 0,
  FOREIGN KEY (packing_list_id) REFERENCES packing_lists(id) ON DELETE CASCADE,
  INDEX idx_packing_list (packing_list_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Generated Labels (for reprint support)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generated_labels (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  packing_list_id INT NOT NULL,
  customer_name   VARCHAR(255),
  checker_name    VARCHAR(100),
  reset_box_per_do TINYINT(1) DEFAULT 0,
  printed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (packing_list_id) REFERENCES packing_lists(id) ON DELETE CASCADE,
  INDEX idx_packing_list (packing_list_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
