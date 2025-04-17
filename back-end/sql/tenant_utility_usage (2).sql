-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 17, 2025 at 12:18 PM
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

--
-- Dumping data for table `tenant_utility_usage`
--

INSERT INTO `tenant_utility_usage` (`id`, `building_id`, `tenant_id`, `utility_type`, `previous_reading`, `current_reading`, `rate`, `cost`, `billing_date`, `utility_status`, `payment_proof_link`, `created_at`, `penalty`, `bill_date`, `base_cost`, `due_date`) VALUES
(29, 3, '09', 'electricity', 300.00, 500.00, 2.50, 500.00, '2025-04-17', 'Bill Generated', NULL, '2025-04-17 08:53:19', 0.00, '2025-05-16', 500.00, '2025-05-21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tenant_utility_usage`
--
ALTER TABLE `tenant_utility_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `building_id` (`building_id`),
  ADD KEY `tenant_utility_usage_ibfk_2` (`tenant_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tenant_utility_usage`
--
ALTER TABLE `tenant_utility_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tenant_utility_usage`
--
ALTER TABLE `tenant_utility_usage`
  ADD CONSTRAINT `tenant_utility_usage_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`),
  ADD CONSTRAINT `tenant_utility_usage_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
