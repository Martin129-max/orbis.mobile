import { useLocalSearchParams } from 'expo-router';
import * as Organism from '@organism';
import * as Template from '@template';

export default function QrInviteScreen() {
  const { code = '' } = useLocalSearchParams<{ code: string }>();

  return (
    <Template.ScreenTemplate>
      <Organism.InvitePreview code={code} />
    </Template.ScreenTemplate>
  );
}
