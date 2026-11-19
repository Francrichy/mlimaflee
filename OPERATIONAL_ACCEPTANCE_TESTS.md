# MlimaniFleet operational acceptance tests

Run these checks against a staging database first. Use two separate test organisations to verify tenant isolation.

## 1. Vehicle and driver register
- Register a vehicle with registration, make/model, year, fuel type, odometer, status and expiry dates.
- Edit its odometer/status and confirm changes persist after refresh.
- Add a driver and licence expiry; edit and deactivate the driver.
- Attempt to delete a vehicle with trips, expenses, maintenance, GPS, tyre or document records. The API must reject deletion and advise marking it inactive.
- Confirm Organisation B cannot list, read, update or delete Organisation A records.

## 2. Trips and dispatch
- Create a planned trip with a vehicle, driver, origin, destination and planned departure.
- Dispatch it and verify status becomes `In Progress`.
- Confirm delivery with final distance and revenue; verify status, end time and values persist.
- Try delivery before dispatch and confirm the API rejects the transition.

## 3. Fuel and expenses
- Create a fuel fill with litres, unit price, vehicle, odometer and station. Confirm total cost is calculated by the API and vehicle odometer updates.
- Try a fuel odometer lower than the current vehicle reading and confirm rejection.
- Link an expense and fuel record to a trip; verify trip-cost analysis includes linked costs.
- Review fuel efficiency only after enough odometer readings exist.

## 4. Maintenance and tyres
- Schedule maintenance, mark it in progress, then complete it with a completion date and final cost.
- Add a tyre to stock, install it with a vehicle and odometer, then remove it with a later odometer.
- Verify duplicate tyre serials and invalid odometer transitions are rejected.

## 5. GPS
- Register a Traccar hardware unique ID against a vehicle and confirm the server poller stores positions every 60 seconds.
- Confirm positions appear in latest-position and history views.
- Start phone GPS on HTTPS with location permission; verify the page sends positions while open.
- Confirm retention cleanup follows `GPS_RETENTION_DAYS`.

## 6. Accounting
- Add a customer and supplier.
- Create a draft customer invoice and supplier bill; submit both.
- Open approvals, approve each, and confirm the invoice/bill becomes approved.
- Record a partial and then final receipt/payment; verify balances and statuses.
- Create a cash/bank account, add a bank transaction and reconcile it.
- Add driver payroll/advance, mark paid, create a budget, asset and customer contract.
- Create a loan with a repayment schedule JSON array and record an instalment payment.

## 7. Reports
- Check P&L, trip cost analysis, per-vehicle profitability, customer/contract profitability, fuel efficiency, cash flow, receivables/payables ageing, budget-vs-actual and asset register.
- Export the tax CSV and verify its date range and customer tax numbers.
- Ensure test transactions are not counted twice across expense, fuel and supplier-bill ledgers.

## 8. Compliance and notifications
- Add vehicle insurance/inspection dates, driver licence dates and document expiry dates.
- Confirm the compliance due list returns items due within 60 days.
- Configure Resend and verify scheduled email reminders and delivery logs.
- Keep external SMS disabled until Twilio is configured and customer consent is verified.

## 9. Security and deployment
- Verify `ORG_ADMIN`, `FLEET_MANAGER`, `ACCOUNTANT`, `DRIVER` and `VIEWER` permissions against the intended workflows.
- Verify inactive users and suspended organisations lose access immediately, even if an old JWT has not expired.
- Back up PostgreSQL before applying the Prisma schema update.
- Confirm CORS includes only the production app and marketing origins.
- Confirm API health, login, registration, dashboard, CRUD and scheduled jobs after Render deployment.

A release is accepted only after these checks pass on PostgreSQL and in a browser. Source transpilation alone is not a substitute for integration or end-to-end testing.
