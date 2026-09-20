Add Contact Us Page & Deploy to Vercel

Please add a Contact Us page to the frontend dashboard and deploy the update to Vercel.

**Tasks:**

1. **Create Contact Us Page** at `/contact` (accessible from dashboard sidebar)
   - Route: `/dashboard/contact` (within the protected dashboard layout)
   - Form fields: Name, Email, Subject, Message
   - Form validation (required fields, email format)
   - Submit to a backend endpoint: `POST /api/contact` (create this endpoint)
   - Backend: Store submissions in database (create ContactMessage model in Prisma) or send via email service (log for now)
   - Success/error toast notifications
   - Accessible form (labels, ARIA, keyboard navigation)

2. **Update Sidebar Navigation** in `frontend/src/components/Sidebar.tsx`
   - Add "Contact Us" link with appropriate icon
   - Navigate to `/contact` route

3. **Backend: Contact Endpoint**
   - Add Prisma model `ContactMessage` (id, name, email, subject, message, createdAt, status)
   - Create `POST /api/contact` endpoint (public or authenticated)
   - Basic validation with Zod
   - Return success response

4. **Deploy to Vercel**
   - Build production frontend
   - Deploy to Vercel (connect GitHub repo if needed)
   - Configure environment variables on Vercel (NEXT_PUBLIC_API_URL)
   - Verify live deployment works end-to-end

**Deliverables:**
- Contact Us page accessible from dashboard
- Working form submission (stores in DB or logs)
- Live Vercel URL with the new feature

Status: READY FOR EXECUTION