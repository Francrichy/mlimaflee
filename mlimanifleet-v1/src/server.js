require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient, CompanyStatus } = require('@prisma/client');
const { z } = require('zod');
const path = require('path');
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 10000;
const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) { console.error('JWT_SECRET must be at least 32 characters'); process.exit(1); }
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const permissions = {
 COMPANY_OWNER:['*'], COMPANY_ADMIN:['users:read','users:write','vehicles:*','drivers:*','trips:*','fuel:*','maintenance:*','tyres:*','gps:*','expenses:*','accounting:*','reports:*','documents:*','settings:*'],
 FLEET_MANAGER:['vehicles:*','drivers:read','trips:*','fuel:read','maintenance:*','tyres:read','gps:read','reports:fleet'],
 DISPATCHER:['vehicles:read','drivers:read','trips:*','gps:read','documents:read'],
 ACCOUNTANT:['accounting:*','expenses:*','reports:financial','trips:read','vehicles:read','drivers:read'],
 FINANCE_MANAGER:['accounting:*','expenses:*','reports:*','trips:read','vehicles:read'],
 PROCUREMENT:['suppliers:*','fuel:*','tyres:read','maintenance:read','expenses:read'],
 MAINTENANCE_MANAGER:['vehicles:read','maintenance:*','tyres:read','expenses:read'],
 TYRE_OFFICER:['vehicles:read','tyres:*'], GPS_CONTROLLER:['vehicles:read','gps:*','trips:read'],
 HR_OFFICER:['drivers:*','users:read'], DRIVER:['trips:own','vehicles:own','fuel:own','expenses:own','documents:own'],
 AUDITOR:['*read','reports:*','audit:read'], CUSTOMER:['customer:own','invoices:own']
};
function hasPermission(role, permission) {
 const rules = permissions[role] || [];
 return rules.includes('*') || rules.includes(permission) || rules.some(x => x.endsWith(':*') && permission.startsWith(x.slice(0,-1))) || (rules.includes('*read') && permission.endsWith(':read'));
}
function auth(req,res,next) {
 const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!token) return res.status(401).json({error:'Authentication required'});
 try { req.user=jwt.verify(token,SECRET); next(); } catch { return res.status(401).json({error:'Session expired or invalid'}); }
}
function platformOnly(req,res,next){ if(!req.user.platformRole) return res.status(403).json({error:'Platform administrator access required'}); next(); }
function permit(permission){ return (req,res,next)=>{ if(req.user.platformRole || hasPermission(req.user.role,permission)) return next(); return res.status(403).json({error:'You do not have permission for this action'}); }; }
async function tenantActive(req,res,next){
 if(req.user.platformRole || !req.user.companyId) return next();
 const company=await prisma.company.findUnique({where:{id:req.user.companyId},select:{status:true,trialEndsAt:true,paidThrough:true}});
 if(!company) return res.status(403).json({error:'Company account unavailable'});
 const now=new Date();
 const trialExpired=company.status==='TRIAL' && company.trialEndsAt && company.trialEndsAt<now;
 const paymentExpired=company.status==='ACTIVE' && company.paidThrough && company.paidThrough<now;
 if(trialExpired || paymentExpired || company.status==='SUSPENDED' || company.status==='CANCELLED') return res.status(402).json({error:'COMPANY_SUSPENDED',message:'Your company subscription is inactive. Contact your company owner or Mlimani support to restore access.'});
 next();
}
function audit(req,action,entity,entityId,details={}) { return prisma.auditLog.create({data:{companyId:req.user.companyId||null,userId:req.user.id,action,entity,entityId,details,ipAddress:req.ip}}).catch(e=>console.error('audit',e.message)); }
function tokenFor(user){ return jwt.sign({id:user.id,email:user.email,name:user.name,companyId:user.companyId,role:user.role,platformRole:user.platformRole},SECRET,{expiresIn:'12h',issuer:'mlimanifleet'}); }

app.get('/api/health', async (req,res)=>{ try{await prisma.$queryRaw`SELECT 1`;res.json({ok:true,service:'mlimanifleet',database:'connected'});}catch(e){res.status(503).json({ok:false,database:'unavailable'});} });
app.post('/api/auth/register', async(req,res)=>{
 const schema=z.object({companyName:z.string().min(2),name:z.string().min(2),email:z.email(),password:z.string().min(12)});
 const parsed=schema.safeParse(req.body); if(!parsed.success) return res.status(400).json({error:'Enter company name, full name, valid email and password (12+ characters).'});
 const {companyName,name,email,password}=parsed.data; const exists=await prisma.user.findUnique({where:{email:email.toLowerCase()}}); if(exists) return res.status(409).json({error:'Email already registered'});
 const days=Number(process.env.TRIAL_DAYS||14); const company=await prisma.company.create({data:{name:companyName,status:'TRIAL',trialEndsAt:new Date(Date.now()+days*86400000)}});
 const user=await prisma.user.create({data:{companyId:company.id,name,email:email.toLowerCase(),passwordHash:await bcrypt.hash(password,12),role:'COMPANY_OWNER'}});
 await prisma.auditLog.create({data:{companyId:company.id,userId:user.id,action:'COMPANY_REGISTERED',entity:'Company'}});
 res.status(201).json({token:tokenFor(user),user:{id:user.id,name:user.name,email:user.email,role:user.role},company:{id:company.id,name:company.name,status:company.status,trialEndsAt:company.trialEndsAt}});
});
app.post('/api/auth/login', async(req,res)=>{
 const schema=z.object({email:z.email(),password:z.string().min(1)}); const p=schema.safeParse(req.body); if(!p.success)return res.status(400).json({error:'Enter a valid email and password'});
 const user=await prisma.user.findUnique({where:{email:p.data.email.toLowerCase()},include:{company:true}});
 if(!user||!user.active||!(await bcrypt.compare(p.data.password,user.passwordHash)))return res.status(401).json({error:'Incorrect email or password'});
 user.lastLoginAt=new Date(); await prisma.user.update({where:{id:user.id},data:{lastLoginAt:user.lastLoginAt}});
 res.json({token:tokenFor(user),user:{id:user.id,name:user.name,email:user.email,role:user.role,platformRole:user.platformRole,company:user.company?{id:user.company.id,name:user.company.name,status:user.company.status,trialEndsAt:user.company.trialEndsAt,paidThrough:user.company.paidThrough}:null}});
});
app.get('/api/me',auth,async(req,res)=>{const user=await prisma.user.findUnique({where:{id:req.user.id},select:{id:true,name:true,email:true,role:true,platformRole:true,company:{select:{id:true,name:true,status:true,trialEndsAt:true,paidThrough:true}}}});res.json({user,permissions:permissions[user?.role]||[]});});

// All company endpoints are authenticated and tenant-scoped.
app.use('/api/company',auth,tenantActive);
app.get('/api/company/summary',permit('reports:fleet'),async(req,res)=>{
 const c=req.user.companyId; const [vehicles,drivers,trips,fuel,expenses,openJobs]=await Promise.all([
 prisma.vehicle.count({where:{companyId:c,status:'ACTIVE'}}),prisma.driver.count({where:{companyId:c,employmentStatus:'ACTIVE'}}),prisma.trip.count({where:{companyId:c,status:{in:['PLANNED','DISPATCHED','IN_PROGRESS']}}}),prisma.fuelEntry.aggregate({where:{companyId:c},_sum:{total:true,litres:true}}),prisma.expense.aggregate({where:{companyId:c},_sum:{amount:true}}),prisma.maintenanceJob.count({where:{companyId:c,status:{not:'COMPLETED'}}})]);
 res.json({vehicles,drivers,activeTrips:trips,fuelSpend:Number(fuel._sum.total||0),fuelLitres:Number(fuel._sum.litres||0),expenses:Number(expenses._sum.amount||0),openMaintenance:openJobs});
});
const listRoutes=[
 ['vehicles','vehicles:read',prisma.vehicle],['drivers','drivers:read',prisma.driver],['trips','trips:read',prisma.trip],['fuel','fuel:read',prisma.fuelEntry],['maintenance','maintenance:read',prisma.maintenanceJob],['tyres','tyres:read',prisma.tyre],['expenses','expenses:read',prisma.expense],['documents','documents:read',prisma.document]
];
for(const [route,permission,model] of listRoutes){
 app.get(`/api/company/${route}`,permit(permission),async(req,res)=>{const rows=await model.findMany({where:{companyId:req.user.companyId},take:200,orderBy:{createdAt:'desc'}});res.json(rows);});
}
app.post('/api/company/vehicles',permit('vehicles:write'),async(req,res)=>{const s=z.object({registrationNo:z.string().min(2),make:z.string().optional(),model:z.string().optional(),year:z.coerce.number().int().optional(),fuelType:z.enum(['DIESEL','PETROL','CNG','ELECTRIC','OTHER']).optional(),capacityTons:z.coerce.number().nonnegative().optional()}).safeParse(req.body);if(!s.success)return res.status(400).json({error:'Invalid vehicle details'});try{const v=await prisma.vehicle.create({data:{...s.data,companyId:req.user.companyId}});await audit(req,'VEHICLE_CREATED','Vehicle',v.id);res.status(201).json(v);}catch(e){res.status(409).json({error:'Registration number already exists or invalid data'});}});
app.post('/api/company/drivers',permit('drivers:write'),async(req,res)=>{const s=z.object({fullName:z.string().min(2),phone:z.string().optional(),licenceNo:z.string().optional(),licenceClass:z.string().optional(),licenceExpiry:z.coerce.date().optional()}).safeParse(req.body);if(!s.success)return res.status(400).json({error:'Invalid driver details'});const d=await prisma.driver.create({data:{...s.data,companyId:req.user.companyId}});await audit(req,'DRIVER_CREATED','Driver',d.id);res.status(201).json(d);});
app.post('/api/company/trips',permit('trips:write'),async(req,res)=>{const s=z.object({tripNo:z.string().min(2),vehicleId:z.string(),driverId:z.string().optional(),origin:z.string().min(2),destination:z.string().min(2),plannedDeparture:z.coerce.date().optional(),revenue:z.coerce.number().nonnegative().optional()}).safeParse(req.body);if(!s.success)return res.status(400).json({error:'Invalid trip details'});const [v,d]=await Promise.all([prisma.vehicle.findFirst({where:{id:s.data.vehicleId,companyId:req.user.companyId}}),s.data.driverId?prisma.driver.findFirst({where:{id:s.data.driverId,companyId:req.user.companyId}}):null]);if(!v||(s.data.driverId&&!d))return res.status(400).json({error:'Vehicle or driver not found in your company'});const t=await prisma.trip.create({data:{...s.data,companyId:req.user.companyId}});await audit(req,'TRIP_CREATED','Trip',t.id);res.status(201).json(t);});
app.post('/api/company/fuel',permit('fuel:write'),async(req,res)=>{const s=z.object({vehicleId:z.string(),tripId:z.string().optional(),litres:z.coerce.number().positive(),pricePerLitre:z.coerce.number().nonnegative(),odometerKm:z.coerce.number().nonnegative().optional(),station:z.string().optional(),receiptNo:z.string().optional()}).safeParse(req.body);if(!s.success)return res.status(400).json({error:'Invalid fuel entry'});const v=await prisma.vehicle.findFirst({where:{id:s.data.vehicleId,companyId:req.user.companyId}});if(!v)return res.status(400).json({error:'Vehicle not found'});const f=await prisma.fuelEntry.create({data:{...s.data,companyId:req.user.companyId,total:s.data.litres*s.data.pricePerLitre}});await audit(req,'FUEL_RECORDED','FuelEntry',f.id);res.status(201).json(f);});
app.post('/api/company/expenses',permit('expenses:write'),async(req,res)=>{const s=z.object({category:z.string().min(2),description:z.string().min(2),amount:z.coerce.number().positive(),vehicleId:z.string().optional(),tripId:z.string().optional(),referenceNo:z.string().optional()}).safeParse(req.body);if(!s.success)return res.status(400).json({error:'Invalid expense'});const e=await prisma.expense.create({data:{...s.data,companyId:req.user.companyId}});await audit(req,'EXPENSE_CREATED','Expense',e.id);res.status(201).json(e);});

// Platform owner console: platform-only routes never expose customer financial transaction detail.
app.use('/api/platform',auth,platformOnly);
app.get('/api/platform/companies',async(req,res)=>{const rows=await prisma.company.findMany({orderBy:{createdAt:'desc'},include:{_count:{select:{users:true,vehicles:true}}}});res.json(rows);});
app.patch('/api/platform/companies/:id/status',async(req,res)=>{const s=z.object({status:z.enum(['ACTIVE','SUSPENDED','CANCELLED','TRIAL']),reason:z.string().optional(),paidThrough:z.coerce.date().optional()}).safeParse(req.body);if(!s.success)return res.status(400).json({error:'Invalid company status'});const data={status:s.data.status,suspensionReason:s.data.reason||null,suspendedAt:s.data.status==='SUSPENDED'?new Date():null};if(s.data.paidThrough)data.paidThrough=s.data.paidThrough;const c=await prisma.company.update({where:{id:req.params.id},data});await audit(req,'COMPANY_STATUS_CHANGED','Company',c.id,{status:c.status,reason:s.data.reason});res.json(c);});
app.post('/api/platform/companies/:id/extend',async(req,res)=>{const s=z.object({paidThrough:z.coerce.date()}).safeParse(req.body);if(!s.success)return res.status(400).json({error:'Valid paid-through date required'});const c=await prisma.company.update({where:{id:req.params.id},data:{status:'ACTIVE',paidThrough:s.data.paidThrough,suspendedAt:null,suspensionReason:null}});await audit(req,'SUBSCRIPTION_EXTENDED','Company',c.id,{paidThrough:c.paidThrough});res.json(c);});
app.get('/api/platform/overview',async(req,res)=>{const [companies,active,suspended,users,vehicles]=await Promise.all([prisma.company.count(),prisma.company.count({where:{status:'ACTIVE'}}),prisma.company.count({where:{status:'SUSPENDED'}}),prisma.user.count(),prisma.vehicle.count()]);res.json({companies,active,suspended,users,vehicles});});

// Trial and paid-through enforcement is automatic on every protected request; this hourly sweep records status changes.
async function enforceSubscriptions(){const now=new Date();await prisma.company.updateMany({where:{status:'TRIAL',trialEndsAt:{lt:now}},data:{status:'SUSPENDED',suspendedAt:now,suspensionReason:'Free trial expired'}});await prisma.company.updateMany({where:{status:'ACTIVE',paidThrough:{lt:now}},data:{status:'SUSPENDED',suspendedAt:now,suspensionReason:'Subscription payment overdue'}});}
setInterval(()=>enforceSubscriptions().catch(e=>console.error('subscription sweep',e.message)),60*60*1000).unref();
app.get('/{*splat}', (req,res)=>res.sendFile(path.join(__dirname,'..','public','index.html')));
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Unexpected server error'});});
async function start(){await prisma.$connect();await enforceSubscriptions();app.listen(PORT,()=>console.log(`MlimaniFleet listening on ${PORT}`));}
start().catch(e=>{console.error('Startup failed',e);process.exit(1);});
