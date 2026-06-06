# Product Requirements Document (PRD) - Hotel Management Website

## 1. Overview
The goal of this project is to build a premium, highly aesthetic web-based Hotel Management System that replaces the existing Python Tkinter GUI / Console application. The website will provide a seamless and visually stunning interface for managing guest check-ins, check-outs, room allocation, guest searches, and viewing occupied/vacant rooms.

## 2. Core Features
- **Interactive Room Map Dashboard:** Visual grid showing the occupancy status of all rooms in the hotel, categorized by type (Deluxe, Semi-Deluxe, General, Joint Room). Clickable rooms for quick actions (Check-in if vacant, View info/Checkout if occupied).
- **Interactive Check-in System:** Form allowing staff to register guests with Name, Address, Mobile Number, Number of Days, Room Type, and Payment Method. Includes a live-updating pricing preview with discounts (10% discount for Credit/Debit card payments).
- **Check-out System:** Easily release occupied rooms, view final bills, and clear the room allocation status.
- **Guest List Directory:** A beautiful table displaying all current guests, room assignments, mobile numbers, and bills, with search and filter capabilities.
- **Guest Detail Search:** Fast lookup for detailed customer cards (Name, Address, Mobile, Days, Total Bill, Allotted Room).
- **Data Persistence:** Use browser `localStorage` to persist the guest records and room occupancy states across page reloads.

## 3. Design System & Aesthetics
- **Theme:** Dark luxury theme with deep charcoal background (`#0d0d11`), premium gold/brass accents (`#d4af37`), and glassmorphism cards (`rgba(255, 255, 255, 0.03)` with blur).
- **Typography:** Using a premium modern sans-serif font (e.g., 'Outfit' or 'Inter') from Google Fonts.
- **Animations:** Smooth CSS transitions for hover states, page changes, fade-ins, and modal actions. Subtle micro-interactions.
- **Layout:** Responsive sidebar navigation with a main content area. Fully adaptive to various screen sizes.

## 4. Technical Constraints
- Built purely with standard **HTML5**, **JavaScript (ES6+)**, and **Vanilla CSS**.
- Single-page application structure with smooth page transitions/tab switching.
- Clean code architecture with clear separation of business logic, DOM manipulation, and state management.
- Automatic SEO best practices (proper semantic markup, viewport tags, descriptive title, meta tags).
