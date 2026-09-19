Sprint 6: Final Polish, Testing & Production Deployment

Please execute Sprint 6 for the banking app. Complete the following tasks:

**Backend Testing:**
- Add Jest + Supertest for unit/integration tests
- Test auth endpoints (register, login, me)
- Test account CRUD endpoints
- Test transfer endpoint (success, insufficient funds, invalid account)
- Test statement generation endpoint
- Test bank KYC approve/reject endpoints
- Test audit log endpoint
- Target: >80% coverage on routes/services

**Frontend Testing:**
- Add React Testing Library + Jest
- Test Login/Register forms (validation, submission)
- Test Dashboard components (account cards, create modal)
- Test BankOps dashboard (KYC cards, audit table)
- Test Statement page (render, CSV download)
- Add data-testid attributes to all interactive elements (addresses OQ-004)

**Accessibility Audit:**
- Run axe-core on all pages
- Fix WCAG 2.1 AA violations
- Ensure keyboard navigation works on all flows
- Verify focus management, ARIA labels, color contrast
- Add skip links, proper heading hierarchy

**Production Build & Deployment:**
- Create production Dockerfiles (multi-stage, non-root user)
- Configure environment variables for production
- Build and test production images locally
- Deploy frontend to Vercel (connect GitHub repo)
- Deploy backend to Railway/Render (or similar)
- Configure PostgreSQL on managed service (Neon/Supabase/Railway)
- Set up custom domain if available
- Verify end-to-end flow: register → KYC → approve → transfer → statement

**Documentation:**
- Update README with setup, test, and deploy instructions
- Document API endpoints with examples
- Add .env.example with all required variables

Deliverables:
1. All tests passing (npm test in both frontend and backend)
2. Accessibility report (axe-core output)
3. Production Docker images built and tested
4. Live Vercel URL for frontend
5. Live backend URL
6. Updated README.md

Status: READY FOR SPRINT 6 EXECUTION