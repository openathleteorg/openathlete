import { m } from '@/paraglide/messages';
import { View403 } from '@/views/error';

// ----------------------------------------------------------------------

export default function Page403() {
  return (
    <>
      <title> {m.ui_forbidden()} </title>
      <View403 />
    </>
  );
}
