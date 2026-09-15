import { m } from '@/paraglide/messages';
import { View404 } from '@/views/error';

export default function NotFoundPage() {
  return (
    <>
      <title> {m.ui_not_found()} </title>
      <View404 />
    </>
  );
}
