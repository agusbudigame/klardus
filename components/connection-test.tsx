"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface TestResult {
  name: string
  status: "success" | "error" | "loading"
  message: string
  details?: any
}

export function ConnectionTest() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    setTests([])
    const supabase = getSupabaseClient()

    const testResults: TestResult[] = []

    // Test 1: Supabase Connection
    try {
      testResults.push({ name: "Supabase Connection", status: "loading", message: "Testing..." })
      setTests([...testResults])

      const { data, error } = await supabase.from("cardboard_prices").select("count").limit(1)

      if (error) throw error

      testResults[testResults.length - 1] = {
        name: "Supabase Connection",
        status: "success",
        message: "Connected successfully",
        details: data,
      }
    } catch (error) {
      testResults[testResults.length - 1] = {
        name: "Supabase Connection",
        status: "error",
        message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
      }
    }

    // Test 2: RLS Policies
    try {
      testResults.push({ name: "RLS Policies", status: "loading", message: "Testing..." })
      setTests([...testResults])

      const { data, error } = await supabase.rpc("get_policy_count")

      testResults[testResults.length - 1] = {
        name: "RLS Policies",
        status: error ? "error" : "success",
        message: error ? `RLS test failed: ${error.message}` : "RLS policies working",
        details: data,
      }
    } catch (error) {
      testResults[testResults.length - 1] = {
        name: "RLS Policies",
        status: "error",
        message: `RLS test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
      }
    }

    // Test 3: Auth Functions
    try {
      testResults.push({ name: "Auth Functions", status: "loading", message: "Testing..." })
      setTests([...testResults])

      const {
        data: { session },
      } = await supabase.auth.getSession()

      testResults[testResults.length - 1] = {
        name: "Auth Functions",
        status: "success",
        message: session ? "User authenticated" : "No active session (normal)",
        details: { hasSession: !!session, userId: session?.user?.id },
      }
    } catch (error) {
      testResults[testResults.length - 1] = {
        name: "Auth Functions",
        status: "error",
        message: `Auth test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
      }
    }

    // Test 4: Sample Data
    try {
      testResults.push({ name: "Sample Data", status: "loading", message: "Testing..." })
      setTests([...testResults])

      const { data, error } = await supabase.from("cardboard_prices").select("cardboard_type, price_per_kg").limit(5)

      if (error) throw error

      testResults[testResults.length - 1] = {
        name: "Sample Data",
        status: "success",
        message: `Found ${data?.length || 0} price records`,
        details: data,
      }
    } catch (error) {
      testResults[testResults.length - 1] = {
        name: "Sample Data",
        status: "error",
        message: `Data test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
      }
    }

    setTests(testResults)
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Success
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "loading":
        return <Badge variant="secondary">Loading</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Connection & System Test</CardTitle>
        <CardDescription>Test koneksi database dan verifikasi sistem aplikasi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run System Tests"
          )}
        </Button>

        {tests.length > 0 && (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-gray-600">{test.message}</p>
                    {test.details && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            ))}
          </div>
        )}

        {tests.length > 0 && !isRunning && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Status:</strong> {tests.filter((t) => t.status === "success").length} passed,{" "}
              {tests.filter((t) => t.status === "error").length} failed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
