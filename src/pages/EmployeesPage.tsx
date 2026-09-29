import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { useAppState } from '../context/AppContext';
import { Employee } from '../types';
import { getAnnualLeaveUsed, getRosteredDaysRemainingInYear } from '../utils/schedule';

const defaultDraft: Omit<Employee, 'id'> = {
  name: '',
  role: 'Operator',
  teamId: 'team-1',
  active: true
};

export const EmployeesPage = () => {
  const { state, loading, updateEmployee } = useAppState();
  const [filterTeamId, setFilterTeamId] = useState('ALL');
  const [createDraft, setCreateDraft] = useState(defaultDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Omit<Employee, 'id'> | null>(null);

  const employees = useMemo(
    () => state.employees.filter((employee) => filterTeamId === 'ALL' || employee.teamId === filterTeamId),
    [state.employees, filterTeamId]
  );

  if (loading) return <LoadingState message="Loading employees..." />;

  return (
    <div className="space-y-4">
      <PageHeader title="Employees" subtitle="Manage the 45-employee demo roster across 3 teams." />

      <section className="card p-4">
        <h3 className="text-base font-semibold">Add Employee</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <div>
            <label className="label">Name</label>
            <input className="input" value={createDraft.name} onChange={(event) => setCreateDraft({ ...createDraft, name: event.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input" value={createDraft.role} onChange={(event) => setCreateDraft({ ...createDraft, role: event.target.value })} />
          </div>
          <div>
            <label className="label">Team</label>
            <select className="input" value={createDraft.teamId} onChange={(event) => setCreateDraft({ ...createDraft, teamId: event.target.value })}>
              {state.teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={createDraft.active} onChange={(event) => setCreateDraft({ ...createDraft, active: event.target.checked })} /> Active</label>
          </div>
          <div className="flex items-end">
            <button
              className="btn-primary w-full"
              onClick={() => {
                if (!createDraft.name.trim()) return;
                updateEmployee({ ...createDraft, id: `employee-${Date.now()}` });
                setCreateDraft(defaultDraft);
              }}
            >
              Add
            </button>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Roster</h3>
          <select className="input max-w-[220px]" value={filterTeamId} onChange={(event) => setFilterTeamId(event.target.value)}>
            <option value="ALL">All Teams</option>
            {state.teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>

        {employees.length === 0 ? (
          <EmptyState title="No employees for this filter" description="Try another team filter or add a new employee." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th>Name</th>
                <th>Team</th>
                <th>Role</th>
                <th>Annual Leave</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const used = getAnnualLeaveUsed(state, employee, new Date().getFullYear());
                const remaining = state.rules.annualLeaveAllowance - used;
                const rosteredDaysRemaining = getRosteredDaysRemainingInYear(state, employee, new Date());
                const projectedUnusedRisk = remaining > rosteredDaysRemaining;
                const isEditing = editingId === employee.id && editDraft;

                return (
                  <tr key={employee.id} className="border-t border-slate-100">
                    <td className="py-2">
                      {isEditing ? <input className="input" value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} /> : employee.name}
                    </td>
                    <td>
                      {isEditing ? (
                        <select className="input" value={editDraft.teamId} onChange={(event) => setEditDraft({ ...editDraft, teamId: event.target.value })}>
                          {state.teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      ) : state.teams.find((team) => team.id === employee.teamId)?.name}
                    </td>
                    <td>
                      {isEditing ? <input className="input" value={editDraft.role} onChange={(event) => setEditDraft({ ...editDraft, role: event.target.value })} /> : employee.role}
                    </td>
                    <td>
                      {used} used / {remaining} remaining
                      {projectedUnusedRisk ? <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Projected unused risk</span> : null}
                    </td>
                    <td>
                      {isEditing ? (
                        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editDraft.active} onChange={(event) => setEditDraft({ ...editDraft, active: event.target.checked })} /> Active</label>
                      ) : employee.active ? 'Active' : 'Inactive'}
                    </td>
                    <td className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn-primary"
                            onClick={() => {
                              updateEmployee({ ...editDraft, id: employee.id });
                              setEditingId(null);
                              setEditDraft(null);
                            }}
                          >
                            Save
                          </button>
                          <button className="btn-secondary" onClick={() => { setEditingId(null); setEditDraft(null); }}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn-secondary" onClick={() => { setEditingId(employee.id); setEditDraft({ name: employee.name, role: employee.role, teamId: employee.teamId, active: employee.active }); }}>Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
