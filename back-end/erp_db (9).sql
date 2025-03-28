-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 24, 2025 at 01:05 PM
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
(3, 'Sunset Apartments', 'sunset.jpg', '123 Sunset Blvd', 'California', 'Residential', 'owner@example.com', '1234567890', '456 Owner St', 0, '2025-03-01 07:57:15', '123456');

-- --------------------------------------------------------

--
-- Table structure for table `monthly_rent_bills`
--

CREATE TABLE `monthly_rent_bills` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `bill_date` date NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `penalty` decimal(10,2) DEFAULT 0.00,
  `payment_status` enum('pending','submitted','approved','paid') NOT NULL DEFAULT 'pending',
  `payment_proof_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `totalDue` decimal(10,2) DEFAULT 0.00,
  `payment_term` int(11) DEFAULT NULL,
  `days_remaining` int(11) DEFAULT 0,
  `original_due_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `stall_id` int(11) NOT NULL,
  `roomName` varchar(50) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `monthlyRent` decimal(10,2) DEFAULT NULL,
  `eeuReader` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `stall_id`, `roomName`, `size`, `monthlyRent`, `eeuReader`, `created_at`) VALUES
(1, 8, 'rom-5', '89708', 8970.00, '10000', '2025-03-19 12:58:33'),
(2, 8, 'rom-5', '69898', 5000.00, '1000', '2025-03-19 12:59:21'),
(3, 8, 'rom-22', '768', 2000.00, '1000', '2025-03-24 03:01:18');

-- --------------------------------------------------------

--
-- Table structure for table `stalls`
--

CREATE TABLE `stalls` (
  `id` int(11) NOT NULL,
  `stallCode` varchar(50) NOT NULL,
  `building_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `monthlyRent` decimal(10,2) DEFAULT NULL,
  `floorsize` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stalls`
--

INSERT INTO `stalls` (`id`, `stallCode`, `building_id`, `created_at`, `monthlyRent`, `floorsize`) VALUES
(8, 'GROUND', 3, '2025-03-19 12:58:09', NULL, '700');

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
  `password` varchar(255) DEFAULT 'Pex123'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tenant_utility_usage`
--

CREATE TABLE `tenant_utility_usage` (
  `id` int(11) NOT NULL,
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
  `penalty` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `utility_rates`
--

CREATE TABLE `utility_rates` (
  `id` int(11) NOT NULL,
  `electricity_rate` decimal(10,2) NOT NULL,
  `water_rate` decimal(10,2) NOT NULL,
  `generator_rate` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `utility_rates`
--

INSERT INTO `utility_rates` (`id`, `electricity_rate`, `water_rate`, `generator_rate`, `created_at`) VALUES
(1, 2.50, 1.50, 100.00, '2025-03-20 08:18:35');

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
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_stall_id_idx` (`stall_id`);

--
-- Indexes for table `stalls`
--
ALTER TABLE `stalls`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_building_id_idx` (`building_id`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_tenant_building` (`building_id`);

--
-- Indexes for table `tenant_utility_usage`
--
ALTER TABLE `tenant_utility_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `utility_rates`
--
ALTER TABLE `utility_rates`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `buildings`
--
ALTER TABLE `buildings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `monthly_rent_bills`
--
ALTER TABLE `monthly_rent_bills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `stalls`
--
ALTER TABLE `stalls`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;

--
-- AUTO_INCREMENT for table `tenant_utility_usage`
--
ALTER TABLE `tenant_utility_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `utility_rates`
--
ALTER TABLE `utility_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `monthly_rent_bills`
--
ALTER TABLE `monthly_rent_bills`
  ADD CONSTRAINT `monthly_rent_bills_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `fk_stall_id` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stalls`
--
ALTER TABLE `stalls`
  ADD CONSTRAINT `fk_building_id` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tenants`
--
ALTER TABLE `tenants`
  ADD CONSTRAINT `fk_tenant_building` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tenant_utility_usage`
--
ALTER TABLE `tenant_utility_usage`
  ADD CONSTRAINT `tenant_utility_usage_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
