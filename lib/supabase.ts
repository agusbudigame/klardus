import { createClient } from "@supabase/supabase-js"

// Coba dapatkan dari env atau localStorage
const getSupabaseCredentials = () => {
  // Prioritaskan environment variables
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Jika tidak tersedia dan di browser, coba dari localStorage
  if (typeof window !== "undefined" && (!url || !key)) {
    url = localStorage.getItem("SUPABASE_URL") || ""
    key = localStorage.getItem("SUPABASE_KEY") || ""
  }

  return { url, key }
}

// Global singleton untuk memastikan hanya ada satu instance
// let globalSupabaseClient: ReturnType<typeof createClient<Database>> | null = null
// let globalServerClient: ReturnType<typeof createClient<Database>> | null = null

// export const getSupabaseClient = () => {
//   // Jika sudah ada instance global, gunakan itu
//   if (globalSupabaseClient) {
//     return globalSupabaseClient
//   }

//   const { url, key } = getSupabaseCredentials()

//   // Jika di browser dan kredensial tidak tersedia, redirect ke halaman setup
//   if (typeof window !== "undefined" && (!url || !key)) {
//     console.error("Client-side: Missing Supabase environment variables")

//     // Jika belum di halaman setup, redirect ke sana
//     if (!window.location.pathname.includes("/setup")) {
//       window.location.href = "/setup"
//       return createDummyClient()
//     }
//   }

//   if (url && key) {
//     try {
//       globalSupabaseClient = createClient<Database>(url, key, {
//         auth: {
//           autoRefreshToken: true,
//           persistSession: true,
//           detectSessionInUrl: true,
//           // Gunakan storage key yang unik untuk menghindari konflik
//           storageKey: "kardus-collector-auth",
//         },
//         global: {
//           headers: {
//             "X-Client-Info": "kardus-collector-pwa",
//           },
//         },
//       })

//       console.log("Supabase client created successfully")
//       return globalSupabaseClient
//     } catch (error) {
//       console.error("Error creating Supabase client:", error)
//       return createDummyClient()
//     }
//   }

//   return createDummyClient()
// }

// // Buat client untuk digunakan di sisi server
// export const createServerSupabaseClient = () => {
//   // Jika sudah ada instance server global, gunakan itu
//   if (globalServerClient) {
//     return globalServerClient
//   }

//   if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     console.error("Server-side: Missing Supabase environment variables for server client")
//     return createDummyClient()
//   }

//   try {
//     globalServerClient = createClient<Database>(
//       process.env.NEXT_PUBLIC_SUPABASE_URL,
//       process.env.SUPABASE_SERVICE_ROLE_KEY,
//       {
//         auth: {
//           autoRefreshToken: false,
//           persistSession: false,
//         },
//       },
//     )
//     return globalServerClient
//   } catch (error) {
//     console.error("Error creating server Supabase client:", error)
//     return createDummyClient()
//   }
// }

// // Helper untuk membuat dummy client
// function createDummyClient() {
//   return createClient("https://placeholder.supabase.co", "placeholder-key") as ReturnType<typeof createClient<Database>>
// }

// // Function untuk reset client (berguna untuk testing)
// export const resetSupabaseClient = () => {
//   globalSupabaseClient = null
//   globalServerClient = null
// }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

let supabase: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}
