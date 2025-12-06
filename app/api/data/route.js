import { NextResponse } from 'next/server'

/**
 * GET /api/data
 * Returns user info and recent quotes for the AI Concierge to access
 */
export async function GET(request) {
  // Sample user data that Vapi AI can access during calls
  const userData = {
    user: {
      name: "Bb",
      company: "MyApp",
      contact: "+15551234567",
      email: "bb@myapp.com",
      location: {
        city: "Apple Valley",
        state: "CA",
        zip: "92307"
      }
    },
    quotes: [
      {
        id: "q1",
        item: "Appliance repair",
        price: "$200",
        vendor: "FixIt Co.",
        date: "2025-10-10",
        status: "pending"
      },
      {
        id: "q2",
        item: "Maintenance package",
        price: "$75/month",
        vendor: "HomePro",
        date: "2025-10-12",
        status: "accepted"
      },
      {
        id: "q3",
        item: "Oil change",
        price: "$45",
        vendor: "Quick Lube",
        date: "2025-10-13",
        status: "completed"
      }
    ],
    recentActivity: [
      "Called 3 pizza places on 10/13",
      "Requested oil change quotes on 10/12",
      "Scheduled appliance repair on 10/10"
    ],
    preferences: {
      maxBudget: 200,
      preferredVendors: ["FixIt Co.", "HomePro"],
      paymentMethod: "credit card"
    }
  }

  return NextResponse.json(userData)
}







