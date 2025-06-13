"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import { MapPin, ArrowLeft, Layers, Navigation, Filter, Zap } from "lucide-react"
import Link from "next/link"

interface MapLocation {
  id: string
  customerName: string
  address: string
  weight: number
  type: string
  lat: number
  lng: number
  status: "pending" | "scheduled" | "completed"
  estimatedPrice: number
}

export default function CollectorMap() {
  const [viewMode, setViewMode] = useState<"cluster" | "heatmap">("cluster")
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)

  const locations: MapLocation[] = [
    {
      id: "001",
      customerName: "Toko ABC",
      address: "Jl. Sudirman No. 123",
      weight: 25,
      type: "Kardus Tebal",
      lat: -6.2088,
      lng: 106.8456,
      status: "pending",
      estimatedPrice: 62500,
    },
    {
      id: "002",
      customerName: "Warung XYZ",
      address: "Jl. Thamrin No. 456",
      weight: 15,
      type: "Kardus Tipis",
      lat: -6.1944,
      lng: 106.8229,
      status: "pending",
      estimatedPrice: 30000,
    },
    {
      id: "003",
      customerName: "PT. Maju Jaya",
      address: "Jl. Gatot Subroto No. 789",
      weight: 50,
      type: "Kardus Tebal",
      lat: -6.2297,
      lng: 106.8253,
      status: "scheduled",
      estimatedPrice: 125000,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500"
      case "scheduled":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "scheduled":
        return "Terjadwal"
      case "completed":
        return "Selesai"
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
              <h1 className="text-xl font-bold text-gray-900">Peta Interaktif</h1>
              <p className="text-sm text-gray-600">Sebaran lokasi kardus</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Layers className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="p-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === "cluster" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode("cluster")}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Cluster
          </Button>
          <Button
            variant={viewMode === "heatmap" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode("heatmap")}
          >
            <Zap className="h-4 w-4 mr-2" />
            Heat Map
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="px-4">
        <Card>
          <CardContent className="p-0">
            <div className="h-80 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg relative overflow-hidden">
              {/* Mock Map Background */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-600 font-medium">Interactive Map</p>
                </div>
              </div>

              {/* Location Markers */}
              {viewMode === "cluster" &&
                locations.map((location, index) => (
                  <div
                    key={location.id}
                    className={`absolute w-8 h-8 rounded-full ${getStatusColor(location.status)} 
                    flex items-center justify-center text-white text-xs font-bold cursor-pointer
                    transform hover:scale-110 transition-transform shadow-lg`}
                    style={{
                      left: `${20 + index * 25}%`,
                      top: `${30 + index * 15}%`,
                    }}
                    onClick={() => setSelectedLocation(location)}
                  >
                    {location.weight}
                  </div>
                ))}

              {/* Heat Map Visualization */}
              {viewMode === "heatmap" && (
                <>
                  <div
                    className="absolute w-20 h-20 bg-red-400 opacity-60 rounded-full blur-sm"
                    style={{ left: "20%", top: "30%" }}
                  />
                  <div
                    className="absolute w-16 h-16 bg-orange-400 opacity-60 rounded-full blur-sm"
                    style={{ left: "45%", top: "45%" }}
                  />
                  <div
                    className="absolute w-24 h-24 bg-red-500 opacity-60 rounded-full blur-sm"
                    style={{ left: "70%", top: "60%" }}
                  />
                </>
              )}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
                <p className="text-xs font-medium mb-2">Status:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-xs">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs">Terjadwal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs">Selesai</span>
                  </div>
                </div>
              </div>

              {/* Route Optimization Button */}
              <div className="absolute bottom-4 right-4">
                <Link href="/collector/route">
                  <Button size="sm" className="shadow-lg">
                    <Navigation className="h-4 w-4 mr-2" />
                    Optimasi Rute
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Details */}
      {selectedLocation && (
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Detail Lokasi
                <Badge variant={selectedLocation.status === "pending" ? "secondary" : "default"}>
                  {getStatusText(selectedLocation.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{selectedLocation.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Jenis</p>
                    <p className="font-medium">{selectedLocation.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Berat</p>
                    <p className="font-medium">{selectedLocation.weight}kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Est. Harga</p>
                    <p className="font-medium text-green-600">
                      Rp{(selectedLocation.estimatedPrice / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    Jadwalkan Pickup
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Hubungi Pelanggan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-orange-600">
                {locations.filter((l) => l.status === "pending").length}
              </p>
              <p className="text-xs text-gray-600">Pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{locations.reduce((sum, l) => sum + l.weight, 0)}kg</p>
              <p className="text-xs text-gray-600">Total Berat</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-green-600">
                Rp{(locations.reduce((sum, l) => sum + l.estimatedPrice, 0) / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-600">Est. Total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation userType="collector" />
    </div>
  )
}
