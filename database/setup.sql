-- Run this script in SQL Server Management Studio (SSMS) or Azure Data Studio
-- to create the database and seed it with sample data.

CREATE DATABASE AuditTracker;
GO

USE AuditTracker;
GO

CREATE TABLE Users (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Name          NVARCHAR(100) NOT NULL,
    Email         NVARCHAR(100) NOT NULL UNIQUE,
    -- TODO: replace with a hashed password column once auth is real
    Role          NVARCHAR(50)  NOT NULL CHECK (Role IN ('Auditor', 'Admin'))
);

CREATE TABLE Audits (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    ClientName  NVARCHAR(200) NOT NULL,
    Standard    NVARCHAR(100) NOT NULL,   -- e.g. 'ISO 9001'
    StartDate   DATE NOT NULL,
    EndDate     DATE NOT NULL,
    AssignedTo  INT FOREIGN KEY REFERENCES Users(Id)
);

CREATE TABLE Tasks (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Description NVARCHAR(500) NOT NULL,
    Status      NVARCHAR(50)  NOT NULL CHECK (Status IN ('pending', 'in-progress', 'done')),
    AuditId     INT FOREIGN KEY REFERENCES Audits(Id) ON DELETE CASCADE
);

-- ── Sample data ───────────────────────────────────────────────────────────────

INSERT INTO Users (Name, Email, Role) VALUES
    ('Auditor One', 'auditor@example.com', 'Auditor'),
    ('Admin User',  'admin@example.com',   'Admin');

INSERT INTO Audits (ClientName, Standard, StartDate, EndDate, AssignedTo) VALUES
    ('ABC Manufacturing', 'ISO 9001', '2025-01-10', '2025-01-15', 1),
    ('Delta Logistics',   'ISO 45001','2025-02-03', '2025-02-07', 1);

INSERT INTO Tasks (Description, Status, AuditId) VALUES
    ('Review quality manual',      'pending',     1),
    ('Inspect production floor',   'in-progress', 1),
    ('Interview floor supervisors','pending',     1),
    ('Review safety procedures',   'pending',     2),
    ('Inspect loading dock',       'in-progress', 2);
