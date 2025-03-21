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

//2.3 get all restaurant

hono.get("/restaurant",async(context)=>{
const restaurant= await prisma.restaurant.findMany();
return context.json(
  {
    restaurant
  },200)


})

// 3. Menu Items

// 3.1 Add a menu item to a restaurant using MenuItemId

hono.post("/restaurant/:id/menuItem", async (context) => {
  const { id } = context.req.param();
  const { name, price } = await context.req.json();
  try {
    const existRestaurant = await prisma.restaurant.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!existRestaurant) {
      return context.json({ message: "Restaurant not found" }, 404);
    }

    const menu = await prisma.menuItem.create({
      data: {
        name: name,
        price: price,
        restaurantId: Number(id),
      },
    });

    return context.json(menu, 201);
  } catch (error) {
    console.error("Error finding restaurant", error);
    return context.json({ message: "Error finding restaurant" }, 404);
  }
});


// 3.2  Update availability or price of a menu item using Id
hono.patch("/menuItem/:id", async (c) => {
  const { id } = c.req.param();
  const { isAvailable, price } = await c.req.json();

  try {
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMenuItem) {
      return c.json({ message: "Menu item not found" }, 404);
    }

    const updatedMenuItem = await prisma.menuItem.update({
      where: { id: Number(id) },
      data: {
        isAvailable: isAvailable,
        price: price,
      },
    });

    return c.json({ menuItem: updatedMenuItem }, 200);
  } catch (error) {
    return c.json({ message: "Failed to update menu item" }, 500);
  }
});

serve(hono);
console.log(`Server is running on http://localhost:${3000}`)
