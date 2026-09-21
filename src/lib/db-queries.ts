/**
 * Typed database query wrappers for common operations.
 * 
 * These wrappers provide explicit type information for queries with joins,
 * avoiding the need for `as unknown as` casts while maintaining type safety.
 */

import { supabase } from './supabase'
import type { Employee, Department, Nomination, CoreValue, Behaviour, Project, Scenario } from '@/types'

/**
 * Fetch employees with their department and manager information
 */
export interface EmployeeWithJoins extends Employee {
  department: { name: string } | null
  manager: { full_name: string } | null
}

export async function fetchEmployeesWithDetails(query = '', limit = 50) {
  let builder = supabase
    .from('employees')
    .select('*, department:department_id(name), manager:manager_id(full_name)')
    .order('full_name')
    .limit(limit)
  
  if (query.length >= 1) {
    builder = builder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`)
  }
  
  const { data, error } = await builder
  
  if (error) throw error
  return (data as unknown as EmployeeWithJoins[]) ?? []
}

/**
 * Fetch nominations with all related data (nominator, nominee, core value, behaviour, project)
 */
export interface NominationWithJoins extends Nomination {
  nominator: Pick<Employee, 'id' | 'full_name' | 'avatar_url'>
  nominee: Pick<Employee, 'id' | 'full_name' | 'avatar_url'>
  core_value: Pick<CoreValue, 'id' | 'name' | 'accent_color' | 'icon'>
  behaviour: Pick<Behaviour, 'id' | 'name'> | null
  project: Pick<Project, 'id' | 'name'> | null
}

export async function fetchNominationsWithDetails(filters?: {
  status?: string | string[]
  assignedApproverId?: string
  limit?: number
  offset?: number
}) {
  let builder = supabase
    .from('nominations')
    .select(
      'id, nominator_id, nominee_id, core_value_id, behaviour_id, scenario_id, ' +
      'what_happened, what_impact, project_id, ' +
      'status, assigned_approver_id, escalation_level, ' +
      'approved_at, rejected_at, clarification_requested_at, submitted_at, created_at, updated_at, ' +
      'nominator:nominator_id(id, full_name, avatar_url), ' +
      'nominee:nominee_id(id, full_name, avatar_url), ' +
      'core_value:core_value_id(id, name, accent_color, icon), ' +
      'behaviour:behaviour_id(id, name), ' +
      'project:project_id(id, name)'
    )
    .order('created_at', { ascending: false })

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
    builder = builder.in('status', statuses)
  }

  if (filters?.assignedApproverId) {
    builder = builder.eq('assigned_approver_id', filters.assignedApproverId)
  }

  if (filters?.limit) {
    builder = builder.limit(filters.limit)
  }

  if (filters?.offset) {
    builder = builder.range(filters.offset, filters.offset + (filters.limit ?? 10) - 1)
  }

  const { data, error } = await builder

  if (error) throw error
  return (data as unknown as NominationWithJoins[]) ?? []
}

/**
 * Fetch behaviours with their associated core values
 */
export interface BehaviourWithJoins extends Behaviour {
  core_values: Pick<CoreValue, 'name' | 'slug'> | null
}

export async function fetchBehavioursWithCoreValues() {
  const { data, error } = await supabase
    .from('behaviours')
    .select('*, core_values:core_value_id(name, slug)')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data as unknown as BehaviourWithJoins[]) ?? []
}

/**
 * Fetch scenarios with behaviours and core values
 */
export interface ScenarioWithJoins extends Scenario {
  behaviours: Pick<Behaviour, 'name'> | null
  core_values: Pick<CoreValue, 'name'> | null
}

export async function fetchScenariosWithRelations() {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*, behaviours:behaviour_id(name), core_values:core_value_id(name)')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data as unknown as ScenarioWithJoins[]) ?? []
}

/**
 * Fetch projects with their manager information
 */
export interface ProjectWithJoins extends Project {
  manager: Pick<Employee, 'full_name'> | null
}

export async function fetchProjectsWithManager() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, manager:manager_id(full_name)')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data as unknown as ProjectWithJoins[]) ?? []
}

/**
 * Fetch core values with their associated behaviours and scenarios
 */
export interface CoreValueWithChildren extends CoreValue {
  behaviours?: Behaviour[]
}

export async function fetchCoreValuesWithBehaviours() {
  const { data, error } = await supabase
    .from('core_values')
    .select('*, behaviours(id, name, description, display_order)')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data as unknown as CoreValueWithChildren[]) ?? []
}

/**
 * Fetch departments (filtered to active only by default)
 */
export async function fetchDepartments(includeInactive = false) {
  let builder = supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  if (!includeInactive) {
    builder = builder.eq('is_active', true)
  }

  const { data, error } = await builder

  if (error) throw error
  return (data as unknown as Department[]) ?? []
}

/**
 * Fetch managers (employees with manager or higher role)
 */
export async function fetchManagers() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name')
    .in('role', ['manager', 'hr_admin', 'super_admin'])
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data as unknown as Pick<Employee, 'id' | 'full_name'>[]) ?? []
}
