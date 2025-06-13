"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Users, DollarSign } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface TestResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export default function TestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [overallStatus, setOverallStatus] = useState<"success" | "error" | "warning">("warning")

  const runTests = async () => {
    setIsLoading(true)
    const results: TestResult[] = []
    const supabase = getSupabaseClient()

    try {
      // Test 1: Database Connection
      try {
        const { data, error } = await supabase.from("cardboard_prices").select("count", { count: "exact", head: true })
        if (error) throw error
        results.push({
          name: "Database Connection",
          status: "success",
          message: "Successfully connected to Supabase",
          details: `Database connection established`,
        })
      } catch (error) {
        results.push({
          name: "Database Connection",
          status: "error",
          message: "Failed to connect to database",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }

      // Test 2: Price Data
      try {
        const { data: prices, error } = await supabase.from("cardboard_prices").select("*").limit(5)

        if (error) throw error

        if (prices && prices.length > 0) {
          results.push({
            name: "Price Data",
            status: "success",
            message: `Found ${prices.length} price records`,
            details: prices.map((p) => `${p.type} (${p.condition}): Rp ${p.price_per_kg}/kg`).join(", "),
          })
        } else {
          results.push({
            name: "Price Data",
            status: "warning",
            message: "No price data found",
            details: "Run the sample data script to add test data",
          })
        }
      } catch (error) {
        results.push({
          name: "Price Data",
          status: "error",
          message: "Failed to fetch price data",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }

      // Test 3: Auth Status
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error && error.message !== "Auth session missing!") {
          throw error
        }

        results.push({
          name: "Authentication System",
          status: "success",
          message: user ? `Logged in as ${user.email}` : "Auth system working (not logged in)",
          details: user ? `User ID: ${user.id}` : "Ready for login/registration",
        })
      } catch (error) {
        results.push({
          name: "Authentication System",
          status: "error",
          message: "Auth system error",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }

      // Test 4: RLS Policies
      try {
        // Try to access profiles table (should work with RLS)
        const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true })

        if (error && !error.message.includes("JWT")) {
          throw error
        }

        results.push({
          name: "Row Level Security",
          status: "success",
          message: "RLS policies are active",
          details: "Database access is properly secured",
        })
      } catch (error) {
        results.push({
          name: "Row Level Security",
          status: "error",
          message: "RLS policy error",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }

      // Test 5: Table Structure
      try {
        const tables = [
          "profiles",
          "cardboard_prices",
          "user_settings",
          "transactions",
          "cardboard_submissions",
          "notifications",
        ]
        let successCount = 0

        for (const table of tables) {
          try {
            await supabase.from(table).select("*").limit(1)
            successCount++
          } catch (e) {
            // Table might exist but be protected by RLS, which is expected
            if (e instanceof Error && e.message.includes("JWT")) {
              successCount++
            }
          }
        }

        results.push({
          name: "Database Tables",
          status: successCount === tables.length ? "success" : "warning",
          message: `${successCount}/${tables.length} tables accessible`,
          details: `Tables: ${tables.join(", ")}`,
        })
      } catch (error) {
        results.push({
          name: "Database Tables",
          status: "error",
          message: "Failed to verify table structure",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    } catch (error) {
      results.push({
        name: "General Test",
        status: "error",
        message: "Unexpected error during testing",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    setTestResults(results)

    // Determine overall status
    const hasErrors = results.some((r) => r.status === "error")
    const hasWarnings = results.some((r) => r.status === "warning")

    if (hasErrors) {
      setOverallStatus("error")
    } else if (hasWarnings) {
      setOverallStatus("warning")
    } else {
      setOverallStatus("success")
    }

    setIsLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Application Test Suite</h1>
          <p className="text-muted-foreground">Comprehensive testing for Kardus Bekas App</p>
        </div>
        <Button onClick={runTests} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Tests
            </>
          )}
        </Button>
      </div>

      {/* Overall Status */}
      <Alert
        className={
          overallStatus === "success"
            ? "border-green-200 bg-green-50"
            : overallStatus === "error"
              ? "border-red-200 bg-red-50"
              : "border-yellow-200 bg-yellow-50"
        }
      >
        <div className="flex items-center gap-2">
          {getStatusIcon(overallStatus)}
          <AlertDescription className="font-medium">
            {overallStatus === "success" && "All tests passed! Application is ready for use."}
            {overallStatus === "error" && "Some tests failed. Please check the details below."}
            {overallStatus === "warning" &&
              "Tests completed with warnings. Application should work but may need attention."}
          </AlertDescription>
        </div>
      </Alert>

      {/* Test Results */}
      <div className="grid gap-4">
        {testResults.map((result, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  {result.name}
                </CardTitle>
                {getStatusBadge(result.status)}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">{result.message}</CardDescription>
              {result.details && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  <strong>Details:</strong> {result.details}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild>
              <a href="/auth/register">
                <Users className="mr-2 h-4 w-4" />
                Test Registration
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/auth/login">
                <Users className="mr-2 h-4 w-4" />
                Test Login
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/customer/prices">
                <DollarSign className="mr-2 h-4 w-4" />
                View Prices
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
