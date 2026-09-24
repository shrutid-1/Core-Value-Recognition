/**
 * Typed database query wrappers for common operations.
 * 
 * These wrappers provide explicit type information for queries with joins,
 * working around Supabase v2's type inference limitations using `as unknown as Type` pattern.
 */

import { supabase } from './supabase'
import type { Employee, Department, CoreValue, Behaviour, Project, Scenario, Nomination } from '@/types'

// Forward declarations for interfaces
export interface AppConfig {
  key: string
  value: string
  description: string | null
}

export interface BadgeDefinition {
  id: string
  level: number
  name: string
  description: string
  recognition_threshold: number
  color: string
  minimum_count: number
  maximum_count: number | null
  icon: string
  accent_color: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Read-only query helpers

export async function getAppConfig(key: string): Promise<AppConfig | null> {
  const { data } = await supabase.from('app_config').select('*').eq('key', key).single()
  return (data as unknown as AppConfig) ?? null
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data } = await supabase.from('employees').select('*').eq('id', id).single()
  return (data as unknown as Employee) ?? null
}

export async function getEmployees(filter?: { role?: string; is_active?: boolean }): Promise<Employee[]> {
  let query = supabase.from('employees').select('*')
  if (filter?.role) query = query.eq('role', filter.role)
  if (filter?.is_active !== undefined) query = query.eq('is_active', filter.is_active)
  const { data } = await query
  return (data as unknown as Employee[]) ?? []
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const { data } = await supabase.from('departments').select('*').eq('id', id).single()
  return (data as unknown as Department) ?? null
}

export async function getCoreValues(isActive = true): Promise<CoreValue[]> {
  let query = supabase.from('core_values').select('*')
  if (isActive) query = query.eq('is_active', true)
  const { data } = await query.order('display_order')
  return (data as unknown as CoreValue[]) ?? []
}

export async function getBadgeDefinitions(): Promise<BadgeDefinition[]> {
  const { data } = await supabase.from('badge_definitions').select('*').order('level')
  return (data as unknown as BadgeDefinition[]) ?? []
}

export async function fetchSettingsConfigForEdit(): Promise<AppConfig[]> {
  const { data } = await supabase.from('app_config').select('*')
  return (data as unknown as AppConfig[]) ?? []
}

export async function fetchBadgeDefinitionsForEdit(): Promise<BadgeDefinition[]> {
  const { data } = await supabase.from('badge_definitions').select('*').order('level')
  return (data as unknown as BadgeDefinition[]) ?? []
}

export async function fetchApprovedNominationsForAnalytics() {
  const { data } = await supabase
    .from('nominations')
    .select('id, nominee_id, core_value_id, snapshot_nominator_dept, snapshot_nominee_dept, core_values:core_value_id(id, name, slug, accent_color)')
    .eq('status', 'approved')
  return (data as unknown as any[]) ?? []
}

export async function fetchApprovedNominationCount(): Promise<number> {
  const { count } = await supabase.from('nominations').select('id', { count: 'exact', head: true }).eq('status', 'approved')
  return count ?? 0
}

export async function fetchNominationsByDateRange(startDate: string, endDate: string): Promise<number> {
  const { count } = await supabase
    .from('nominations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')
    .gte('approved_at', startDate)
    .lte('approved_at', endDate)
  return count ?? 0
}

export async function fetchTodayNominations(date: string) {
  const { data } = await supabase
    .from('nominations')
    .select('id, nominee_id, core_value_id, nominee:nominee_id(id, full_name, email), core_values:core_value_id(id, name)')
    .eq('status', 'approved')
    .gte('approved_at', `${date}T00:00:00+00:00`)
    .lte('approved_at', `${date}T23:59:59+00:00`)
  return (data as unknown as any[]) ?? []
}

export async function markNotificationAsRead(id: string) {
  const result = await ((supabase.from('notifications') as unknown as any).update({ is_read: true, read_at: new Date().toISOString() } as unknown as any)).eq('id', id)
  return result
}

export async function markNotificationsAsRead(employeeId: string) {
  const result = await ((supabase
    .from('notifications') as unknown as any)
    .update({ is_read: true, read_at: new Date().toISOString() } as unknown as any))
    .eq('recipient_id', employeeId)
    .eq('is_read', false)
  return result
}

// Interface exports for type support
export interface EmployeeWithJoins extends Employee {
  department: { name: string } | null
  manager: { full_name: string } | null
}

export interface NominationWithJoins extends Nomination {
  nominator: Pick<Employee, 'id' | 'full_name' | 'avatar_url'>
  nominee: Pick<Employee, 'id' | 'full_name' | 'avatar_url'>
  core_value: Pick<CoreValue, 'id' | 'name' | 'slug' | 'accent_color' | 'icon'>
  behaviour: Pick<Behaviour, 'id' | 'name'> | null
  project: Pick<Project, 'id' | 'name'> | null
}

export interface BehaviourWithJoins extends Behaviour {
  core_values: Pick<CoreValue, 'name' | 'slug'> | null
}

// Additional query helpers
export async function fetchEmployeesWithDetails(query = '', limit = 50) {
  let builder = supabase.from('employees').select('*, department:department_id(name), manager:manager_id(full_name)').order('full_name').limit(limit)
  if (query.length >= 1) {
    builder = builder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`)
  }
  const { data } = await builder
  return (data as unknown as EmployeeWithJoins[]) ?? []
}

export async function fetchNominationsWithDetails(filters?: { status?: string | string[]; limit?: number; offset?: number }) {
  let builder = supabase.from('nominations').select('*, nominator:nominator_id(id, full_name, avatar_url), nominee:nominee_id(id, full_name, avatar_url), core_value:core_value_id(id, name, slug, accent_color, icon), behaviour:behaviour_id(id, name), project:project_id(id, name)').order('created_at', { ascending: false })
  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
    builder = builder.in('status', statuses)
  }
  if (filters?.limit) {
    builder = builder.limit(filters.limit)
  }
  if (filters?.offset) {
    builder = builder.range(filters.offset, filters.offset + (filters.limit ?? 10) - 1)
  }
  const { data } = await builder
  return (data as unknown as NominationWithJoins[]) ?? []
}

export async function fetchBehavioursWithCoreValues() {
  const { data } = await supabase.from('behaviours').select('*, core_values:core_value_id(name, slug)').eq('is_active', true).order('display_order', { ascending: true })
  return (data as unknown as BehaviourWithJoins[]) ?? []
}

export async function fetchScenariosWithRelations() {
  const { data } = await supabase.from('scenarios').select('*, behaviours:behaviour_id(name), core_values:core_value_id(name)').eq('is_active', true).order('display_order', { ascending: true })
  return (data as unknown as any[]) ?? []
}

export async function fetchProjectsWithManager() {
  const { data } = await supabase.from('projects').select('*, manager:manager_id(full_name)').eq('is_active', true).order('name', { ascending: true })
  return (data as unknown as any[]) ?? []
}

export async function fetchDepartments(includeInactive = false) {
  let builder = supabase.from('departments').select('*').order('name', { ascending: true })
  if (!includeInactive) {
    builder = builder.eq('is_active', true)
  }
  const { data } = await builder
  return (data as unknown as Department[]) ?? []
}

export async function fetchManagers() {
  const { data } = await supabase.from('employees').select('id, full_name').in('role', ['manager', 'hr_admin', 'super_admin']).eq('is_active', true).order('full_name', { ascending: true })
  return (data as unknown as Pick<Employee, 'id' | 'full_name'>[]) ?? []
}

// Missing type interfaces
export interface ScenarioWithJoins extends Scenario {
  behaviours: Pick<Behaviour, 'name'> | null
  core_values: Pick<CoreValue, 'name'> | null
}

export interface ProjectWithJoins extends Project {
  manager: Pick<Employee, 'full_name'> | null
}

export interface CoreValueWithChildren extends CoreValue {
  behaviours?: Behaviour[]
}

// Insert/Update helpers with proper typing
export async function createNominationAppreciation(nominationId: string, employeeId: string) {
  const result = await ((supabase.from('nomination_appreciations') as unknown as any).insert([
    { nomination_id: nominationId, employee_id: employeeId },
  ]))
  return result
}

export async function updateAppConfig(key: string, value: string) {
  const result = await ((supabase.from('app_config') as unknown as any).update({ value })).eq('key', key)
  return result
}

export async function updateBadgeDefinition(id: string, data: { minimum_count?: number; maximum_count?: number | null }) {
  const result = await ((supabase.from('badge_definitions') as unknown as any).update(data)).eq('id', id)
  return result
}

export async function createCoreValue(data: {
  name: string
  definition: string
  icon: string
  accent_color: string
  display_order: number
}) {
  const result = await ((supabase.from('core_values') as unknown as any).insert([data]))
  return result
}

export async function updateCoreValue(id: string, data: { is_active: boolean; archived_at: string | null }) {
  const result = await ((supabase.from('core_values') as unknown as any).update(data)).eq('id', id)
  return result
}

export async function createDepartment(data: { name: string; description: string | null }) {
  const result = await ((supabase.from('departments') as unknown as any).insert([data]))
  return result
}

export async function updateDepartment(id: string, data: { name: string; description: string | null }) {
  const result = await ((supabase.from('departments') as unknown as any).update(data)).eq('id', id)
  return result
}

export async function archiveDepartment(id: string) {
  const result = await ((supabase.from('departments') as unknown as any).update({ is_active: false, archived_at: new Date().toISOString() })).eq('id', id)
  return result
}

export async function createProject(data: {
  name: string
  description: string | null
  project_code: string | null
  manager_id: string | null
}) {
  const result = await ((supabase.from('projects') as unknown as any).insert([data]))
  return result
}

export async function updateProject(id: string, data: {
  name: string
  description: string | null
  project_code: string | null
  manager_id: string | null
}) {
  const result = await ((supabase.from('projects') as unknown as any).update(data)).eq('id', id)
  return result
}

export async function archiveProject(id: string) {
  const result = await ((supabase.from('projects') as unknown as any).update({ is_active: false, archived_at: new Date().toISOString() })).eq('id', id)
  return result
}

export async function createReward(data: {
  name: string
  description: string | null
  frequency: string | null
  eligibility_criteria: string | null
  value_description: string | null
  requires_approval: boolean
}) {
  const result = await ((supabase.from('rewards') as unknown as any).insert([data]))
  return result
}

export async function createScenario(data: { name: string; description: string | null }) {
  const result = await ((supabase.from('scenarios') as unknown as any).insert([data]))
  return result
}

export async function updateScenario(id: string, data: { name: string; description: string | null }) {
  const result = await ((supabase.from('scenarios') as unknown as any).update(data)).eq('id', id)
  return result
}

// Fetch helpers with assignedApproverId support
export async function fetchNominationsWithDetailsForApproval(filters?: { 
  status?: string | string[]
  assignedApproverId?: string
  limit?: number
  offset?: number 
}) {
  let builder = supabase.from('nominations').select('*, nominator:nominator_id(id, full_name, avatar_url), nominee:nominee_id(id, full_name, avatar_url), core_value:core_value_id(id, name, slug, accent_color, icon), behaviour:behaviour_id(id, name), project:project_id(id, name)').order('created_at', { ascending: false })
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
  const { data } = await builder
  return (data as unknown as NominationWithJoins[]) ?? []
}

// Fetch clarification responses for a nomination
export async function fetchClarificationResponses(nominationId: string) {
  const { data } = await supabase
    .from('clarification_responses')
    .select('id, nomination_id, responder_id, response_text, created_at, updated_at')
    .eq('nomination_id', nominationId)
    .order('created_at', { ascending: true })
  return (data as unknown as any[]) ?? []
}
