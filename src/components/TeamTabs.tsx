import { Team } from '../types';

interface TeamTabsProps {
  teams: Team[];
  activeTeamId: string;
  onChange: (teamId: string) => void;
}

export const TeamTabs = ({ teams, activeTeamId, onChange }: TeamTabsProps) => (
  <div className="flex flex-wrap gap-2">
    {teams.map((team) => {
      const isActive = team.id === activeTeamId;
      return (
        <button
          key={team.id}
          onClick={() => onChange(team.id)}
          className={isActive ? 'btn-primary' : 'btn-secondary'}
          aria-pressed={isActive}
        >
          {team.name}
        </button>
      );
    })}
  </div>
);
