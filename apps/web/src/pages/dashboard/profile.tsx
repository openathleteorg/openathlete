import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { Activity, MedalIcon, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const navigate = useNavigate();

  const profileOptions = [
    {
      title: m.statistics(),
      description: m.my_statistics(),
      icon: PieChart,
      path: getPath(['dashboard', 'statistics']),
    },
    {
      title: m.records(),
      description: m.my_records(),
      icon: MedalIcon,
      path: getPath(['dashboard', 'records']),
    },
    {
      title: m.metrics(),
      description: m.metrics(),
      icon: Activity,
      path: getPath(['dashboard', 'metrics']),
    },
  ];

  return (
    <div className="w-full p-4 md:p-8 space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{m.profile()}</h2>
        <p className="text-muted-foreground">
          Sélectionnez une option ci-dessous
        </p>
      </div>

      <div className="grid gap-4">
        {profileOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card
              key={option.path}
              className="cursor-pointer transition-colors hover:bg-muted"
              onClick={() =>
                navigate(option.path, { state: { fromProfile: true } })
              }
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
