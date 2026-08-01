import { BaseRepository } from './baseRepository.js';

export const companyRepository = new BaseRepository('companies', 'companies');
export const employeeRepository = new BaseRepository('employees', 'employees');
export const projectRepository = new BaseRepository('projects', 'projects');
export const itemRepository = new BaseRepository('items', 'items');
export const taskRepository = new BaseRepository('tasks', 'tasks');
export const assignmentRepository = new BaseRepository('assignments', 'assignments');
export const dailyLogRepository = new BaseRepository('dailylogs', 'dailyLogs');
export const approvalRepository = new BaseRepository('approvals', 'approvals');
export const costRepository = new BaseRepository('costs', 'costs');
export const processRepository = new BaseRepository('processes', 'processes');
export const processLogRepository = new BaseRepository('process_logs', 'processLogs');
export const boqRepository = new BaseRepository('boq_items', 'boqItems');
export const paymentCertificateRepository = new BaseRepository('payment_certificates', 'paymentCertificates');
export const cashFlowRepository = new BaseRepository('cash_flow', 'cashFlow');
export const dailyWageRepository = new BaseRepository('daily_wages', 'dailyWages');
export const stakeholderRepository = new BaseRepository('stakeholders', 'stakeholders');
export const contractRepository = new BaseRepository('contracts', 'contracts');
export const changeRequestRepository = new BaseRepository('change_requests', 'changeRequests');

window.NEXORA = window.NEXORA || {};
window.NEXORA.Repositories = {
  companies: companyRepository,
  employees: employeeRepository,
  projects: projectRepository,
  items: itemRepository,
  tasks: taskRepository,
  assignments: assignmentRepository,
  dailylogs: dailyLogRepository,
  approvals: approvalRepository,
  costs: costRepository,
  processes: processRepository,
  processLogs: processLogRepository,
  boqItems: boqRepository,
  paymentCertificates: paymentCertificateRepository,
  cashFlow: cashFlowRepository,
  dailyWages: dailyWageRepository,
  stakeholders: stakeholderRepository,
  contracts: contractRepository,
  changeRequests: changeRequestRepository
};
