# Restaurant POS System

A complete, modern Point of Sale system built for restaurants and fast food businesses. Features inventory management, sales tracking, purchase orders, returns management, and multi-user support with role-based access control.

## Features

### 🎯 Core Features
- **Point of Sale (POS)**: Fast, intuitive interface for processing sales
- **Inventory Management**: Track products, stock levels, and costs
- **Transaction History**: Complete sales records with filtering and export
- **Purchase Orders**: Manage supplier orders and inventory restocking
- **Returns Management**: Handle product returns with approval workflow
- **User Management**: Multi-user support with admin and sales person roles
- **Dashboard Analytics**: Real-time KPIs, sales trends, and low stock alerts

### 🔐 Security & Access
- Multi-tenant architecture with data isolation
- Row Level Security (RLS) policies
- Role-based access control (Admin / Sales Person)
- Secure authentication with Supabase Auth

### 📱 Modern Experience
- Responsive design for desktop, tablet, and mobile
- Progressive Web App (PWA) support
- Dark/Light theme toggle
- Offline-capable with service workers
- Print receipts directly from browser

### 📊 Business Intelligence
- Revenue and profit tracking
- Sales trend visualization
- Low stock alerts
- Customer purchase history
- CSV export for all data

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **PWA**: next-pwa

## Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd restaurant-pos
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL from `database-schema.sql` in SQL Editor
   - Run the SQL from `database-functions.sql` in SQL Editor

4. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Run development server**
```bash
npm run dev
```

6. **Open browser**
Navigate to [http://localhost:3000](http://localhost:3000)

7. **Initial setup**
   - Go to `/setup` route
   - Create your first tenant and admin user
   - Login and start using the system

## Installing as a PWA

This app is installable as a Progressive Web App on any device:

### Desktop (Chrome, Edge, Brave)
1. Visit the deployed app URL
2. Look for the install icon (⊕) in the address bar
3. Click "Install" in the prompt
4. The app will open in its own window

### Mobile (iOS Safari)
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Confirm and the app will appear on your home screen

### Mobile (Android Chrome)
1. Open the app in Chrome
2. Tap the three-dot menu
3. Select "Install app" or "Add to Home Screen"
4. Confirm installation

### Benefits of Installing
- Works offline after first load
- Faster loading with cached assets
- App-like experience with no browser UI
- Quick access from home screen/desktop
- Automatic updates when online

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/         # Admin dashboard
│   ├── pos/              # Point of Sale
│   ├── inventory/        # Inventory management
│   ├── transactions/     # Transaction history
│   ├── purchase-orders/  # Purchase order management
│   ├── returns/          # Returns management
│   ├── users/            # User management
│   ├── login/            # Authentication
│   └── setup/            # Initial tenant setup
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── inventory/        # Inventory components
│   ├── pos/              # POS components
│   ├── transactions/     # Transaction components
│   ├── purchase-orders/  # PO components
│   ├── returns/          # Returns components
│   ├── users/            # User management components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── services/         # API service layer
│   ├── supabase/         # Supabase client
│   └── utils/            # Helper functions
├── types/                # TypeScript type definitions
├── docs/                 # Documentation
│   ├── ADMIN_GUIDE.md
│   ├── SALES_PERSON_GUIDE.md
│   └── TROUBLESHOOTING.md
├── public/               # Static assets
├── database-schema.sql   # Database schema
└── database-functions.sql # Database functions
```

## User Roles

### Admin
Full system access including:
- Dashboard with analytics
- Inventory management
- Purchase order management
- User management
- Return approval
- All sales person features

### Sales Person
Limited access for daily operations:
- Point of Sale
- View transactions
- Create return requests
- View own sales history

## Documentation

- **[Admin Guide](docs/ADMIN_GUIDE.md)**: Complete guide for administrators
- **[Sales Person Guide](docs/SALES_PERSON_GUIDE.md)**: Guide for sales staff
- **[Troubleshooting](docs/TROUBLESHOOTING.md)**: Common issues and solutions
- **[Deployment Guide](DEPLOYMENT.md)**: Production deployment instructions

## Key Workflows

### Making a Sale
1. Search and add products to cart
2. Adjust quantities as needed
3. Select customer (optional)
4. Apply discount (optional)
5. Choose payment method
6. Complete sale and print receipt

### Managing Inventory
1. Add products with details and pricing
2. Set stock levels and thresholds
3. Adjust stock with reason tracking
4. View complete stock history
5. Export inventory data

### Processing Returns
1. Sales person creates return request
2. Admin reviews return details
3. Admin approves or rejects
4. Stock automatically restored on approval

### Purchase Orders
1. Create PO with supplier details
2. Add products and quantities
3. Mark as ordered when placed
4. Mark as received when delivered
5. Restock inventory from PO

## Database Schema

The system uses PostgreSQL with the following main tables:
- `tenants`: Business/organization data
- `users`: User accounts and roles
- `products`: Product catalog
- `stock_history`: Inventory audit trail
- `customers`: Customer information
- `transactions` & `transaction_items`: Sales records
- `purchase_orders` & `purchase_order_items`: PO records
- `returns` & `return_items`: Return records

All tables include Row Level Security policies for tenant isolation.

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The app will be live at your Vercel URL.

## Environment Variables

Required environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

PWA features work best in Chrome and Edge.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Your License Here]

## Support

For issues or questions:
- Check the documentation in `/docs`
- Review troubleshooting guide
- Contact your system administrator

## Roadmap

Future enhancements:
- [ ] Multi-location support
- [ ] Advanced reporting
- [ ] Email notifications
- [ ] SMS integration
- [ ] Barcode scanner support
- [ ] Kitchen display system
- [ ] Table management
- [ ] Loyalty program

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)

---

**Made with ❤️ for restaurant and fast food businesses**
