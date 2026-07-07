-- Flight Booking System — MySQL Schema
CREATE DATABASE IF NOT EXISTS flight_booking CHARACTER SET utf8mb4;
USE flight_booking;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS airlines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  fleet VARCHAR(120),
  rating DECIMAL(2,1) DEFAULT 4.5,
  color VARCHAR(10) DEFAULT '#2E6FE8'
);

CREATE TABLE IF NOT EXISTS airports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE,
  city VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_no VARCHAR(20) NOT NULL,
  airline_id INT NOT NULL,
  origin_code VARCHAR(5) NOT NULL,
  destination_code VARCHAR(5) NOT NULL,
  depart_time DATETIME NOT NULL,
  arrive_time DATETIME NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL,
  stops INT NOT NULL DEFAULT 0,
  price_economy DECIMAL(10,2) NOT NULL,
  price_business DECIMAL(10,2) NOT NULL,
  seats_left INT NOT NULL DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (airline_id) REFERENCES airlines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(10) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  flight_id INT NOT NULL,
  cabin ENUM('economy', 'business') NOT NULL DEFAULT 'economy',
  total DECIMAL(10,2) NOT NULL,
  status ENUM('confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booking_passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  dob DATE NOT NULL,
  passport VARCHAR(40) NOT NULL,
  seat_id VARCHAR(6) NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  method ENUM('card', 'paypal') NOT NULL DEFAULT 'card',
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Seed data
INSERT IGNORE INTO airlines (code, name, fleet, rating, color) VALUES
  ('AL', 'AeroLuxe Airways', 'Boeing 787', 4.8, '#2E6FE8'),
  ('MA', 'Meridian Air', 'Airbus A350', 4.6, '#F5A623'),
  ('NW', 'Northwind Airlines', 'Boeing 777', 4.5, '#0B1B33'),
  ('ZG', 'Zenith Global', 'Airbus A380', 4.7, '#1E52B8');

INSERT IGNORE INTO airports (code, city, country) VALUES
  ('JFK', 'New York', 'USA'),
  ('LHR', 'London', 'UK'),
  ('DXB', 'Dubai', 'UAE'),
  ('SIN', 'Singapore', 'Singapore'),
  ('NRT', 'Tokyo', 'Japan'),
  ('CDG', 'Paris', 'France'),
  ('SYD', 'Sydney', 'Australia'),
  ('BOM', 'Mumbai', 'India'),
  ('PNH', 'Phnom Penh', 'Cambodia'),
  ('BKK', 'Bangkok', 'Thailand');

-- Default admin account (password: Admin@123, hashed with bcrypt at app startup — see utils/initDb.js)
