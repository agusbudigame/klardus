"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ArrowLeft, Navigation, Clock, Fuel, MapPin, Route, Play, Settings } from "lucide-react"
import Link from "next/link"

interface RouteStop {
  id: string
  customerName: string
  address: string
  weight: number
  estimatedPrice: number
  estimatedTime: number
  priority: "high" | "medium" | "low"
  distance: number
}

export default function CollectorRoute() {
  const [optimizedRoute, setOptimizedRoute] = useState<RouteStop[]>([
    {
      id: "003",
      customerName: "PT. Maju Jaya",
      address: "Jl. Gatot Subroto No. 789",
      weight: 50,
      estimatedPrice: 125000,
      estimatedTime: 15,
      priority: "high",
      distance: 0,
    },
    {
      id: "001",
      customerName: "Toko ABC",
      address: "Jl. Sudirman No. 123",
      weight: 25,
      estimatedPrice: 62500,
      estimatedTime: 10,
      priority: "medium",
      distance: 2.5,
    },
    {
      id: "002",
      customerName: "Warung XYZ",
      address: "Jl. Thamrin No. 456",
      weight: 15,
      estimatedPrice: 30000,
      estimatedTime: 8,
      priority: "low",
      distance: 1.8,
    },
  ])

  const [routeStats] = useState({
    totalDistance: 12.3,
    estimatedTime: 95,
    fuelCost: 25000,
    totalWeight: 90,
    totalRevenue: 217500,
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Tinggi"
      case "medium":
        return "Sedang"
      case "low":
        return "Rendah"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/collector/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rute Optimal</h1>
              <p className="text-sm text-gray-600">Rute pickup hari ini</p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Route Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Ringkasan Rute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-2xl font-bold">{routeStats.totalDistance}km</span>
                </div>
                <p className="text-sm text-gray-600">Total Jarak</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold">{routeStats.estimatedTime}m</span>
                </div>
                <p className="text-sm text-gray-600">Est. Waktu</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Fuel className="h-4 w-4 text-orange-600" />
                  <span className="text-lg font-bold">Rp{(routeStats.fuelCost / 1000).toFixed(0)}k</span>
                </div>
                <p className="text-sm text-gray-600">Biaya BBM</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Navigation className="h-4 w-4 text-purple-600" />
                  <span className="text-lg font-bold">Rp{(routeStats.totalRevenue / 1000).toFixed(0)}k</span>
                </div>
                <p className="text-sm text-gray-600">Est. Pendapatan</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Mulai Rute
              </Button>
              <Button variant="outline" className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                Buka di Maps
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Optimized Route Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Urutan Pickup Optimal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizedRoute.map((stop, index) => (
                <div key={stop.id} className="relative">
                  {/* Route Line */}
                  {index < optimizedRoute.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300"></div>
                  )}

                  <div className="flex items-start gap-4 p-4 border rounded-lg bg-white">
                    {/* Step Number */}
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{stop.customerName}</h3>
                          <p className="text-sm text-gray-600">{stop.address}</p>
                        </div>
                        <Badge className={getPriorityColor(stop.priority)}>{getPriorityText(stop.priority)}</Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-gray-600">Berat</p>
                          <p className="font-medium">{stop.weight}kg</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Jarak</p>
                          <p className="font-medium">{stop.distance}km</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Waktu</p>
                          <p className="font-medium">{stop.estimatedTime}m</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Harga</p>
                          <p className="font-medium text-green-600">Rp{(stop.estimatedPrice / 1000).toFixed(0)}k</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Hubungi
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Navigasi
                        </Button>
                        <Button size="sm" className="flex-1">
                          Selesai
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Route Optimization Options */}
        <Card>
          <CardHeader>
            <CardTitle>Optimasi Rute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Prioritas Berat</p>
                  <p className="text-sm text-gray-600">Utamakan pickup dengan berat terbesar</p>
                </div>
                <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Jarak Terdekat</p>
                  <p className="text-sm text-gray-600">Optimasi berdasarkan jarak terdekat</p>
                </div>
                <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Waktu Pickup</p>
                  <p className="text-sm text-gray-600">Sesuaikan dengan jadwal pelanggan</p>
                </div>
                <div className="w-12 h-6 bg-green-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4">
              <Route className="h-4 w-4 mr-2" />
              Hitung Ulang Rute
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation userType="collector" />
    </div>
  )
}
