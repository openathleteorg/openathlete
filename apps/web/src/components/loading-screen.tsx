import { PageLoader } from '@/components/ui/loader';

interface P {
  message?: string;
}

export function LoadingScreen({ message }: P) {
  return <PageLoader message={message} />;
}
