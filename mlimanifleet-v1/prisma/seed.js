require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async()=>{
 const email=(process.env.PLATFORM_OWNER_EMAIL||'owner@mlimani.net').toLowerCase();
 const password=process.env.PLATFORM_OWNER_PASSWORD;
 if(!password || password.length<14) throw new Error('Set PLATFORM_OWNER_PASSWORD to a unique password of at least 14 characters before seeding.');
 const hash=await bcrypt.hash(password,12);
 await prisma.user.upsert({where:{email},update:{name:process.env.PLATFORM_OWNER_NAME||'Mlimani Platform Owner',passwordHash:hash,platformRole:'PLATFORM_OWNER',companyId:null,role:null,active:true},create:{email,name:process.env.PLATFORM_OWNER_NAME||'Mlimani Platform Owner',passwordHash:hash,platformRole:'PLATFORM_OWNER'}});
 console.log(`Platform owner provisioned: ${email}`);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
