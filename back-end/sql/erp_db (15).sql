-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 16, 2025 at 09:44 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `erp_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `buildings`
--

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

--
-- Dumping data for table `buildings`
--

INSERT INTO `buildings` (`id`, `building_name`, `building_image`, `building_address`, `location`, `property_type`, `owner_email`, `owner_phone`, `owner_address`, `suspended`, `created_at`, `password`) VALUES
(3, 'New Sunset Apartments', 'new_sunset.jpg', '123 New Sunset Blvd', 'Los Angeles', 'Residential', 'new_owner@example.com', '1234567890', '555 New Owner St', 0, '2025-03-15 05:00:00', '123');

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_requests`
--

CREATE TABLE `maintenance_requests` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `stallCode` varchar(50) NOT NULL,
  `building_id` int(11) NOT NULL,
  `issueDescription` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `price` decimal(10,2) DEFAULT NULL,
  `scheduledDate` date DEFAULT NULL,
  `status` enum('Submitted','Finance Confirmed','Owner Approved','Owner Pending','Owner Rejected','Maintenance Scheduled','Resolved') NOT NULL DEFAULT 'Submitted',
  `reason` text DEFAULT NULL,
  `tenantApproved` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `monthly_rent_bills`
--

CREATE TABLE `monthly_rent_bills` (
  `id` int(11) NOT NULL,
  `building_id` int(11) NOT NULL,
  `tenant_id` varchar(50) DEFAULT NULL,
  `bill_date` date NOT NULL,
  `due_date` varchar(25) NOT NULL,
  `payment_status` enum('pending','submitted','approved','paid') NOT NULL DEFAULT 'pending',
  `payment_proof_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `totalDue` decimal(10,2) DEFAULT 0.00,
  `payment_term` int(11) DEFAULT NULL,
  `days_remaining` int(11) DEFAULT 0,
  `original_due_date` varchar(25) NOT NULL,
  `tx_ref` varchar(200) DEFAULT NULL,
  `payment_date` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `penalty` decimal(10,2) DEFAULT 0.00,
  `bill_generated` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `monthly_rent_bills`
--

INSERT INTO `monthly_rent_bills` (`id`, `building_id`, `tenant_id`, `bill_date`, `due_date`, `payment_status`, `payment_proof_url`, `created_at`, `updated_at`, `totalDue`, `payment_term`, `days_remaining`, `original_due_date`, `tx_ref`, `payment_date`, `amount`, `penalty`, `bill_generated`) VALUES
(11, 3, '09', '2025-04-15', '2025-05-15 23:59:59', 'paid', 'im', '2025-04-15 15:03:48', '2025-04-15 15:04:02', 0.00, 30, 0, '2025-05-15 23:59:59', NULL, '2025-04-15', 5000.00, 0.00, 0),
(12, 3, '09', '2025-05-14', '2025-05-15 23:59:59', 'pending', NULL, '2025-05-14 15:30:31', '2025-06-26 20:27:31', 0.00, 30, 0, '2025-05-15 23:59:59', NULL, NULL, 5000.00, 2100.00, 0),
(13, 3, '09', '2025-06-14', '2025-06-15 23:59:59', 'pending', NULL, '2025-06-14 18:09:54', '2025-06-26 20:27:33', 0.00, 30, 0, '2025-06-15 23:59:59', NULL, NULL, 5000.00, 550.00, 0);

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `building_id` int(11) NOT NULL,
  `stall_id` int(11) NOT NULL,
  `roomName` varchar(50) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `monthlyRent` decimal(10,2) DEFAULT NULL,
  `eeuReader` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(255) DEFAULT NULL,
  `water_reader` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `building_id`, `stall_id`, `roomName`, `size`, `monthlyRent`, `eeuReader`, `created_at`, `status`, `water_reader`) VALUES
(1, 3, 1, '10', '453', 5000.00, '300', '2025-04-07 03:59:56', 'taken', NULL),
(2, 3, 1, '11', '345', 4000.00, '4335', '2025-04-07 04:00:10', NULL, NULL),
(3, 3, 1, '56', '768', 8000.00, '786', '2025-04-29 07:03:57', '', NULL),
(4, 3, 1, '90', '998', 768.00, '7685', '2025-04-09 09:28:40', 'taken', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stalls`
--

CREATE TABLE `stalls` (
  `id` int(11) NOT NULL,
  `stallCode` varchar(50) NOT NULL,
  `building_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `monthlyRent` decimal(10,2) DEFAULT NULL,
  `floorsize` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stalls`
--

INSERT INTO `stalls` (`id`, `stallCode`, `building_id`, `created_at`, `monthlyRent`, `floorsize`) VALUES
(1, 'GROUND', 3, '2025-04-07 03:41:39', NULL, '700');

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `id` int(11) NOT NULL,
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
  `organization` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tenants`
--

INSERT INTO `tenants` (`id`, `tenant_id`, `full_name`, `sex`, `phone`, `city`, `subcity`, `woreda`, `house_no`, `room`, `price`, `payment_term`, `deposit`, `lease_start`, `lease_end`, `registered_by_agent`, `authentication_no`, `agent_first_name`, `agent_sex`, `agent_phone`, `agent_city`, `agent_subcity`, `agent_woreda`, `agent_house_no`, `eeu_payment`, `generator_payment`, `water_payment`, `terminated`, `building_id`, `created_at`, `rent_start_date`, `rent_end_date`, `password`, `organization`) VALUES
(3, '09', 'seid', 'male', '0909090909', 'adis', 'yeka', '12', '3434', '1', 5000.00, '30', 4348.00, '2025-04-15', '2026-04-15', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 3, '2025-04-15 15:03:44', '2025-05-20', '2025-06-14', 'Pex123', 'e');

-- --------------------------------------------------------

--
-- Table structure for table `tenant_utility_usage`
--

CREATE TABLE `tenant_utility_usage` (
  `id` int(11) NOT NULL,
  `building_id` int(11) NOT NULL,
  `tenant_id` varchar(50) NOT NULL,
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
  `bill_date` date DEFAULT NULL,
  `base_cost` decimal(10,2) DEFAULT NULL,
  `due_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `building_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('finance','maintenance') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `building_id`, `full_name`, `phone_number`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 3, 'abe', '0923797665', '$2b$10$vKgL6eI5K6mZsVeemRq6bONMOPof5ICNgeAYpRJxe72sN2gMtpojC', 'finance', '2025-04-13 09:56:29', '2025-04-13 09:56:29');

-- --------------------------------------------------------

--
-- Table structure for table `utility_rates`
--

CREATE TABLE `utility_rates` (
  `id` int(11) NOT NULL,
  `building_id` int(11) NOT NULL,
  `electricity_rate` decimal(10,2) NOT NULL,
  `water_rate` decimal(10,2) NOT NULL,
  `generator_rate` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `utility_rates`
--

INSERT INTO `utility_rates` (`id`, `building_id`, `electricity_rate`, `water_rate`, `generator_rate`, `created_at`) VALUES
(3, 3, 2.50, 2.00, 2.00, '2025-04-13 11:52:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buildings`
--
ALTER TABLE `buildings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `monthly_rent_bills`
--
ALTER TABLE `monthly_rent_bills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `building_id` (`building_id`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `building_id` (`building_id`),
  ADD KEY `stall_id` (`stall_id`);

--
-- Indexes for table `stalls`
--
ALTER TABLE `stalls`
  ADD PRIMARY KEY (`id`),
  ADD KEY `building_id` (`building_id`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tenant_id` (`tenant_id`),
  ADD KEY `building_id` (`building_id`);

--
-- Indexes for table `tenant_utility_usage`
--
ALTER TABLE `tenant_utility_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `building_id` (`building_id`),
  ADD KEY `tenant_utility_usage_ibfk_2` (`tenant_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `building_id` (`building_id`);

--
-- Indexes for table `utility_rates`
--
ALTER TABLE `utility_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_building` (`building_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `monthly_rent_bills`
--
ALTER TABLE `monthly_rent_bills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `stalls`
--
ALTER TABLE `stalls`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tenant_utility_usage`
--
ALTER TABLE `tenant_utility_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `utility_rates`
--
ALTER TABLE `utility_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `monthly_rent_bills`
--
ALTER TABLE `monthly_rent_bills`
  ADD CONSTRAINT `monthly_rent_bills_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`),
  ADD CONSTRAINT `monthly_rent_bills_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`);

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`),
  ADD CONSTRAINT `rooms_ibfk_2` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`id`);

--
-- Constraints for table `stalls`
--
ALTER TABLE `stalls`
  ADD CONSTRAINT `stalls_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`);

--
-- Constraints for table `tenants`
--
ALTER TABLE `tenants`
  ADD CONSTRAINT `tenants_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`);

--
-- Constraints for table `tenant_utility_usage`
--
ALTER TABLE `tenant_utility_usage`
  ADD CONSTRAINT `tenant_utility_usage_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`),
  ADD CONSTRAINT `tenant_utility_usage_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`);

--
-- Constraints for table `utility_rates`
--
ALTER TABLE `utility_rates`
  ADD CONSTRAINT `fk_building` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `utility_rates_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
