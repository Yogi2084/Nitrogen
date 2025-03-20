import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'

const prisma= new PrismaClient
const hono = new Hono()

//1. customer

//1.1 create customer

hono.post("/customer",async(Context)=>{
const {id,name,email,phoneNumber,address}= await Context.req.json();
const customer= await prisma.customer.create({
  data: {
    id,
    name,
    email,
    phoneNumber,
    address,
  },
});
return Context.json(
{
  customer
},200
)
})



serve(hono);
console.log(`Server is running on http://localhost:${3000}`)
