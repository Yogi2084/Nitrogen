import { serve } from '@hono/node-server'
import {  Hono } from 'hono'
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

//1.2 get customer using customerId

hono.get("customer/:customerId",async(Context)=>{

  const {customerId}= await Context.req.param();
  const customer= await prisma.customer.findUnique({
    where:{
      id:Number(customerId),

    }
  })

return Context.json(
  {
    customer
  },200
)
})
//1.3 get all customers

hono.get("/customer",async(context)=>{
const customer=await prisma.customer.findMany()

return context.json(
  {
  customer
  },200)


})

//2  Restaurants

//2.1 create restaurant

hono.post("/restaurant",async(context)=>{
  const{name,location}=await context.req.json();
  const restaurant=await prisma.restaurant.create({
    data:{
      name,
      location
    }
  })
return context.json(
{
  restaurant
}
,200)

})

//2.2 get restaurant using restaurantId

hono.get("/restaurant/:restaurantId",async(context)=>{
  const{restaurantId}=await context.req.param();
  const restaurant=await prisma.restaurant.findUnique(
    {
      where:{
        id:Number(restaurantId)
      }
    })
return context.json(
  {
    restaurant

},200)
})



serve(hono);
console.log(`Server is running on http://localhost:${3000}`)
