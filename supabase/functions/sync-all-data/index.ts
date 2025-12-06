// ============================================================================
// SYNC ALL DATA - Main sync function for LifeHub
// Handles bidirectional sync between localStorage and Supabase
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightResponse } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight with secure headers
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req.headers.get('origin'))
  }

  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  try {
    // Create Supabase client with auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, data } = await req.json()

    // ========================================================================
    // ACTION: GET_ALL - Fetch all user data from Supabase
    // ========================================================================
    if (action === 'get_all') {
      const [
        domainsResult,
        tasksResult,
        habitsResult,
        billsResult,
        eventsResult,
        goalsResult,
        propertiesResult,
        vehiclesResult,
        budgetsResult,
      ] = await Promise.all([
        supabaseClient.from('domains').select('*').eq('user_id', user.id),
        supabaseClient.from('tasks').select('*').eq('user_id', user.id),
        supabaseClient.from('habits').select('*').eq('user_id', user.id),
        supabaseClient.from('bills').select('*').eq('user_id', user.id),
        supabaseClient.from('events').select('*').eq('user_id', user.id),
        supabaseClient.from('goals').select('*').eq('user_id', user.id),
        supabaseClient.from('properties').select('*').eq('user_id', user.id),
        supabaseClient.from('vehicles').select('*').eq('user_id', user.id),
        supabaseClient.from('monthly_budgets').select('*').eq('user_id', user.id),
      ])

      // Transform domains array to object keyed by domain_name
      const domainsObj: Record<string, any[]> = {}
      if (domainsResult.data) {
        domainsResult.data.forEach((domain: any) => {
          domainsObj[domain.domain_name] = domain.data || []
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            domains: domainsObj,
            tasks: tasksResult.data || [],
            habits: habitsResult.data || [],
            bills: billsResult.data || [],
            events: eventsResult.data || [],
            goals: goalsResult.data || [],
            properties: propertiesResult.data || [],
            vehicles: vehiclesResult.data || [],
            budgets: budgetsResult.data || [],
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================================================
    // ACTION: SYNC_UP - Upload local data to Supabase
    // ========================================================================
    if (action === 'sync_up') {
      const syncData = data

      // Sync domains
      if (syncData.domains) {
        for (const [domainName, domainData] of Object.entries(syncData.domains)) {
          await supabaseClient
            .from('domains')
            .upsert({
              user_id: user.id,
              domain_name: domainName,
              data: domainData,
            })
        }
      }

      // Sync tasks
      if (syncData.tasks && Array.isArray(syncData.tasks)) {
        for (const task of syncData.tasks) {
          await supabaseClient
            .from('tasks')
            .upsert({
              ...task,
              user_id: user.id,
            })
        }
      }

      // Sync habits
      if (syncData.habits && Array.isArray(syncData.habits)) {
        for (const habit of syncData.habits) {
          await supabaseClient
            .from('habits')
            .upsert({
              ...habit,
              user_id: user.id,
            })
        }
      }

      // Sync bills
      if (syncData.bills && Array.isArray(syncData.bills)) {
        for (const bill of syncData.bills) {
          await supabaseClient
            .from('bills')
            .upsert({
              ...bill,
              user_id: user.id,
            })
        }
      }

      // Sync events
      if (syncData.events && Array.isArray(syncData.events)) {
        for (const event of syncData.events) {
          await supabaseClient
            .from('events')
            .upsert({
              ...event,
              user_id: user.id,
            })
        }
      }

      // Sync goals
      if (syncData.goals && Array.isArray(syncData.goals)) {
        for (const goal of syncData.goals) {
          await supabaseClient
            .from('goals')
            .upsert({
              ...goal,
              user_id: user.id,
            })
        }
      }

      // Sync properties
      if (syncData.properties && Array.isArray(syncData.properties)) {
        for (const property of syncData.properties) {
          await supabaseClient
            .from('properties')
            .upsert({
              ...property,
              user_id: user.id,
            })
        }
      }

      // Sync vehicles
      if (syncData.vehicles && Array.isArray(syncData.vehicles)) {
        for (const vehicle of syncData.vehicles) {
          await supabaseClient
            .from('vehicles')
            .upsert({
              ...vehicle,
              user_id: user.id,
            })
        }
      }

      // Sync budgets
      if (syncData.budgets && Array.isArray(syncData.budgets)) {
        for (const budget of syncData.budgets) {
          await supabaseClient
            .from('monthly_budgets')
            .upsert({
              ...budget,
              user_id: user.id,
            })
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Data synced successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================================================
    // ACTION: GET_SYNC_STATUS - Get last sync time and stats
    // ========================================================================
    if (action === 'get_sync_status') {
      const [
        domainsCount,
        tasksCount,
        habitsCount,
        billsCount,
        eventsCount,
        goalsCount,
      ] = await Promise.all([
        supabaseClient.from('domains').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabaseClient.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabaseClient.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabaseClient.from('bills').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabaseClient.from('events').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabaseClient.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      return new Response(
        JSON.stringify({
          success: true,
          status: {
            domains: domainsCount.count || 0,
            tasks: tasksCount.count || 0,
            habits: habitsCount.count || 0,
            bills: billsCount.count || 0,
            events: eventsCount.count || 0,
            goals: goalsCount.count || 0,
            lastSyncedAt: new Date().toISOString(),
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

