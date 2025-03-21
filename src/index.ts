import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const hono = new Hono();

//1. customer

//1.1 create customer

hono.post("/customer", async (Context) => { 
  try{
  const { id, name, email, phoneNumber, address } = await Context.req.json();
  const customer = await prisma.customer.create({
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
      customer,
    },
    200
  );
}

  catch (error) {
    console.error("Error in creating customer", error);
  }
});

//1.2 get customer using customerId

hono.get("customer/:customerId", async (Context) => {
  try{
  const { customerId } = await Context.req.param();
  const customer = await prisma.customer.findUnique({
    where: {
      id: Number(customerId),
    },
  });

  return Context.json(
    {
      customer,
    },
    200
  );
}
catch (error) {
  console.error("Error finding customer", error);
}
});

//1.3 get all customers

hono.get("/customer", async (context) => {
  try {
  const customer = await prisma.customer.findMany();

  return context.json(
    {
      customer,
    },
    200
  );
}
catch (error) {
  console.error("Error finding customers", error);
}
});
//1.3 get all orders for a customer using customerId

hono.get("/customer/:customerId/orders", async (context) => {
  try{
  const { customerId } = await context.req.param();
  const orders = await prisma.order.findMany({
    where: {
      customerId: Number(customerId),
    },
  });
  return context.json(
    {
      orders,
    },
    200
  );
}
catch (error) {
  console.error("Error finding customer", error);
}


});

//2  Restaurants

//2.1 create restaurant

hono.post("/restaurant", async (context) => {
  try{
  const { name, location } = await context.req.json();
  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      location,
    },
  });
  return context.json(
    {
      restaurant,
    },
    200
  );
}
catch (error) {
  console.error("Error in creating restaurant", error);
}
});

//2.2 get restaurant using restaurantId

hono.get("/restaurant/:restaurantId", async (context) => {
  try{
  const { restaurantId } = await context.req.param();
  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: Number(restaurantId),
    },
  });
  return context.json(
    {
      restaurant,
    },
    200
  );
}
catch (error) {
  console.error("Error finding restaurant", error);
}
});

//2.3 get all restaurant

hono.get("/restaurant", async (context) => {
  try{

  const restaurant = await prisma.restaurant.findMany();
  return context.json(
    {
      restaurant,
    },
    200
  );
}
catch (error) {
  console.error("Error finding  restaurant", error);
}
});

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
    return context.json({ message: "Error finding restaurant" }, 404);
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

// 3.3 Get all menu items for a restaurant using restaurantId

hono.get("/restaurant/:id/menuItem", async (c) => {
  const { id } = c.req.param();
  try {
    const isExist = await prisma.restaurant.findUnique({
      where: { id: Number(id) },
    });

    if (!isExist) {
      return c.json({ message: "Restaurant not found" }, 404);
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: Number(id) },
    });
    return c.json(
      {
        menuItems,
      },
      200
    );
  } catch (error) {
    return c.json({ message: "Failed to fetch menu items" }, 500);
  }
});

// 4. Orders

// 4.1  Place an order (includes items and quantities)
hono.post("/orders", async (context) => {
  const { customerId, restaurantId, items } = await context.req.json();

  if (!customerId || !restaurantId || !items || !Array.isArray(items) || items.length === 0) {
    return context.json({message:"All fields (customerId, restaurantId, items) are required and items should be a non-empty array"}, 400);
  }

  try {
        const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!customer) {
      return context.json({ message: "Customer does not exist" }, 400);
    }
    if (!restaurant) {
      return context.json({ message: "Restaurant does not exist" }, 400);
    }

    const order = await prisma.order.create({
      data: { customerId, restaurantId, totalPrice: 0 },
    });
    

    let totalPrice = 0;

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!menuItem || !menuItem.isAvailable) {
        return context.json(
          {
            message: `Menu item ID ${item.menuItemId} not found or unavailable`,
          },
          400
        );
      }

      const itemTotal = Number(menuItem.price) * item.quantity;
      totalPrice += itemTotal;

      
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: menuItem.id,
          quantity: item.quantity,
        },
      });
    }
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        totalPrice: totalPrice,
      },
    });

    return context.json({ message: updatedOrder }, 201);
  } catch (error) {
    console.error("Error placing order:", error);
    return context.json({ message: "Failed to place order" }, 500);
  }
});

// 4.2 Retrieve details of a specific order
hono.get("/orders/:id", async (c) => {
  const {id} = c.req.param();
try {
  const order = await prisma.order.findUnique({
    where: {
      id: Number(id),
    }
  });
  
  return c.json(order)
}
catch (error) { 
  console.error("Error finding order", error);
    
}
})

//4.3 patch order status using orderId
hono.patch("/orders/:id/status", async (c) => {
  const {id} = c.req.param();
  const {status} = await c.req.json();
  try{
  const order = await prisma.order.update({
    where: {
      id: Number(id),
    },
    data: {
      status: status,
    },
  });
  return c.json(order)}
  catch(error){
    return c.json({ message: "Error finding order" }, 404);
  }
})

//5.Reports & Insights

//5.1 Get total revenue generated by a restaurant

hono.get("/restaurant/:id/revenue", async (c) => {
  const { id } = c.req.param();
  try {
    const isExist = await prisma.restaurant.findUnique({
      where: { id: Number(id) },
    });

    if (!isExist) {
      return c.json({ message: "Restaurant not found" }, 404);
    }

    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalPrice: true,
      },
      where: {
        restaurantId: Number(id),
      },
    });
    return c.json({
      totalRevenue: totalRevenue._sum.totalPrice,
      
    })    
  } catch (error) {
    return c.json({ message: "Failed to fetch menu items" }, 500);
  }
});

// 5.2 Retrieve the most ordered menu item across all restaurants

hono.get("/menuItem/mostOrdered", async (c) => {
  
  try {
    const mostOrderedMenuItem = await prisma.menuItem.findMany({
      orderBy: {
        orderItems: {
          _count: "desc",
        },
      },
      include: {
        orderItems: true,
      },
      take: 1,
    });
    return c.json(mostOrderedMenuItem)
  } catch (error) {
    return c.json({ message: "Failed to fetch menu items" }, 500);
  }
})

// 5.3 Retrieve the top 5 customers   based on number of orders placed

hono.get("/customers/:id/orders", async (context) => {
  const id = context.req.param("id");
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });

    if (!customer) {
      return context.json({ message: "Customer not found" }, 404);
    }

    const orders = await prisma.order.findMany({
      where: { customerId: Number(id) },
      include: {
        Restaurant: true,
        orderItem: {
          include: {
            MenuItem: true,
          },
        },
      },
    });

    return context.json(orders, 200);
  } catch (error) {
    console.error("Error retrieving orders", error);
    return context.json({ message: "Error retrieving orders" }, 500);
  }
});



serve(hono);
console.log(`Server is running on http://localhost:${3000}`);
