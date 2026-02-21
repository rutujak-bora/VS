# VS Fashion Website - PRD

## Original Problem Statement
Restructure the VS Fashion website with UI/UX changes only (no backend logic changes):
1. Header menu restructure with center-aligned navigation
2. Home page with Trending section and background
3. Footer with FAQ's and Terms & Conditions tabs
4. Shop page with hamburger menu filters
5. Contact Us page with inquiry form

## User Personas
- **End Customers**: Browse products, make purchases, contact store
- **Store Admin**: Manage products, orders, collections via admin panel

## Core Requirements
- Maroon/burgundy brand color (#8B1B4A) from logo
- Modern minimal design
- Center-aligned navigation (Home, About Us, Shop, Contact Us)
- Right-side items (Cart, Customer Name, Admin)
- Hamburger menu filter system on Shop page
- Contact form sends email to vsfashiiiion@gmail.com

## What's Been Implemented (Feb 2026)

### Header Changes
- ✅ Center-aligned navigation: Home, About Us, Shop, Contact Us
- ✅ Right side: Shopping Cart, Customer Name (when logged in), Admin button
- ✅ Mobile responsive hamburger menu
- ✅ Maroon/burgundy brand color applied

### Home Page Changes
- ✅ Existing carousel retained
- ✅ Trending section with background pattern
- ✅ Products displayed from admin-managed trending items

### Footer Changes
- ✅ Center-aligned tabs: About Us, Contact Us, FAQ's, Terms & Conditions
- ✅ About Us and Contact Us links navigate to pages
- ✅ FAQ's shows expandable questions with provided content
- ✅ Terms & Conditions shows all provided terms
- ✅ Maroon footer with VS Fashion info

### Shop Page Changes
- ✅ Hamburger menu (3-line icon) on left side
- ✅ Filter sidebar shows Collections and Categories
- ✅ Collections expand to show categories
- ✅ Menu collapses after selection
- ✅ Products filtered based on selection

### About Us Page
- ✅ New page created with VS Fashion info
- ✅ Contact details displayed (Phone, Email, Owner)
- ✅ Hero section with background image

### Contact Us Page
- ✅ Contact form with Name, Email, Mobile, Inquiry Note
- ✅ Form validation
- ✅ Backend endpoint sends email to vsfashiiiion@gmail.com
- ✅ Uses SMTP fallback (Gmail credentials configured)
- ✅ Contact messages saved to database

## Tech Stack
- Frontend: React.js with TailwindCSS
- Backend: FastAPI (Python)
- Database: MongoDB
- Email: SMTP via Gmail (with Resend API fallback option)

## Backlog / Future Improvements
- P1: Add WhatsApp integration for quick customer contact
- P2: Add social media links to footer
- P2: Image optimization for faster loading
- P3: Add customer reviews section

## Next Action Items
1. Configure Resend API key if SMTP becomes unreliable
2. Add more trending products via admin panel
3. Consider adding newsletter signup in footer
