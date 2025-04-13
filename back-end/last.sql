

CREATE TABLE `buildings` (
  `id` int(11) NOT NULL,
  `building_name` varchar(255) NOT NULL,
  `building_image` varchar(255) NOT NULL,
  `building_address` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `property_type` enum('Commercial','Residential','Mixed') NOT NULL,
  `owner_email` varchar(255) NOT NULL,
  `owner_phone` varchar(50) NOT NULL,
  `owner_address` varchar(255) NOT NULL,
  `suspended` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `password` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `sex` varchar(50) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `subcity` varchar(100) DEFAULT NULL,
  `woreda` varchar(100) DEFAULT NULL,
  `house_no` varchar(50) DEFAULT NULL,
  `room` varchar(50) NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `payment_term` varchar(50) DEFAULT NULL,
  `deposit` decimal(10,2) NOT NULL DEFAULT 0.00,
  `lease_start` date DEFAULT NULL,
  `lease_end` date DEFAULT NULL,
  `registered_by_agent` tinyint(1) DEFAULT 0,
  `authentication_no` varchar(100) DEFAULT NULL,
  `agent_first_name` varchar(255) DEFAULT NULL,
  `agent_sex` varchar(50) DEFAULT NULL,
  `agent_phone` varchar(50) DEFAULT NULL,
  `agent_city` varchar(100) DEFAULT NULL,
  `agent_subcity` varchar(100) DEFAULT NULL,
  `agent_woreda` varchar(100) DEFAULT NULL,
  `agent_house_no` varchar(50) DEFAULT NULL,
  `eeu_payment` tinyint(1) DEFAULT 0,
  `generator_payment` tinyint(1) DEFAULT 0,
  `water_payment` tinyint(1) DEFAULT 0,
  `terminated` tinyint(1) DEFAULT 0,
  `building_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `rent_start_date` date DEFAULT NULL,
  `rent_end_date` date DEFAULT NULL,
  `password` varchar(255) DEFAULT 'Pex123',
  `organization` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `stalls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stallCode` varchar(50) NOT NULL,
  `building_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `monthlyRent` decimal(10,2) DEFAULT NULL,
  `floorsize` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL,
  `stall_id` int(11) NOT NULL,
  `roomName` varchar(50) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `monthlyRent` decimal(10,2) DEFAULT NULL,
  `eeuReader` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`),
  FOREIGN KEY (`stall_id`) REFERENCES `stalls`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `monthly_rent_bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL,
  `tenant_id` varchar(50) DEFAULT NULL,
  `bill_date` date NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `penalty` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('pending','submitted','approved','paid') NOT NULL DEFAULT 'pending',
  `payment_proof_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `totalDue` decimal(10,2) DEFAULT '0.00',
  `payment_term` int(11) DEFAULT NULL,
  `days_remaining` int(11) DEFAULT '0',
  `original_due_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `tenant_utility_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `utility_type` enum('electricity','water','generator') NOT NULL,
  `previous_reading` decimal(10,2) NOT NULL,
  `current_reading` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `billing_date` date DEFAULT curdate(),
  `utility_status` varchar(20) DEFAULT 'Pending',
  `payment_proof_link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `penalty` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('finance','maintenance') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `utility_rates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL,
  `electricity_rate` decimal(10,2) NOT NULL,
  `water_rate` decimal(10,2) NOT NULL,
  `generator_rate` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;