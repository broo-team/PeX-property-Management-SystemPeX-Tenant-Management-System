ALTER TABLE maintenance_requests
ADD COLUMN tenantApproved BOOLEAN NOT NULL DEFAULT false;
