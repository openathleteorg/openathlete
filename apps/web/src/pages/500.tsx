import { m } from '@/paraglide/messages';
import { View500 } from '@/views/error';

export default function Page500() {
  return (
    <>
      <title> {m.ui_server_error()} </title>
      <View500 />
    </>
  );
}
